import { Router } from "express";
import { db } from "./db";
import { assignments, emailVariations, imageAttachments, imagePixelEvents } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

const router = Router();

// Generate unique shareable slug for assignments
function generateShareableSlug(): string {
  return randomBytes(8).toString("hex");
}

// Get all assignments for a publisher with shareable URLs
router.get("/api/assignments", async (req, res) => {
  try {
    // Check if the user is authenticated
    const user = (req as any).session?.user;
    
    // Determine the publisher ID
    let publisherId = user?.publisherId || user?.publisher?.id;
    
    // For demo users or if no specific publisher ID, use demo-publisher
    if (!publisherId || user?.id === 'demo-user' || user?.id === 'demo-user-id') {
      publisherId = "demo-publisher";
    }
    
    const result = await db
      .select()
      .from(assignments)
      .where(eq(assignments.publisherId, publisherId))
      .orderBy(desc(assignments.createdAt));
    
    // Add shareable URLs to each assignment
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const assignmentsWithUrls = result.map((assignment: any) => ({
      ...assignment,
      shareableUrl: assignment.shareableSlug 
        ? `${protocol}://${host}/assignment/${assignment.shareableSlug}`
        : null
    }));
    
    res.json(assignmentsWithUrls);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get single assignment
router.get("/api/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ))
      .limit(1);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Add shareable URL
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const shareableUrl = assignment.shareableSlug 
      ? `${protocol}://${host}/assignment/${assignment.shareableSlug}`
      : null;
    
    res.json({
      ...assignment,
      shareableUrl
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// Get assignment by shareable slug (public access for copywriters)
router.get("/api/public/assignment/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.shareableSlug, slug))
      .limit(1);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Add shareable URL
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const shareableUrl = `${protocol}://${host}/assignment/${slug}`;
    
    res.json({
      ...assignment,
      shareableUrl
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// Create a new assignment with unique shareable link and enhanced workflow fields
router.post("/api/assignments", async (req, res) => {
  try {
    // Check if the user is authenticated
    const user = (req as any).session?.user;
    let publisherId = "demo-publisher";
    
    // Use actual publisher ID if available
    if (user?.publisherId) {
      publisherId = user.publisherId;
    } else if (user?.publisher?.id) {
      publisherId = user.publisher.id;
    }
    
    const { 
      title, description, type, priority, dueDate, notes, tags, brief, opportunityId,
      // New enhanced workflow fields
      targetSegments, emailPlatform, reviewers, reviewDeadline, reviewNotes, autoGenerateVariations
    } = req.body;
    
    // Generate unique shareable slug
    const shareableSlug = generateShareableSlug();

    // If creating from opportunity, fetch opportunity data to populate assignment
    let enhancedBrief = brief;
    let enhancedDescription = description;
    let relatedAssignmentId = null;

    if (opportunityId) {
      try {
        const { opportunities } = await import("../shared/schema");
        const [opportunity] = await db
          .select()
          .from(opportunities)
          .where(eq(opportunities.id, opportunityId))
          .limit(1);

        if (opportunity) {
          // Populate assignment content from opportunity
          enhancedDescription = opportunity.description || description;
          enhancedBrief = {
            ...brief,
            objective: opportunity.title,
            angle: opportunity.description,
            keyPoints: opportunity.notes ? [opportunity.notes] : [],
            opportunity: {
              type: opportunity.type,
              potentialValue: opportunity.potentialValue,
              probability: opportunity.probability,
              source: opportunity.source
            }
          };
          relatedAssignmentId = opportunityId;
        }
      } catch (error) {
        console.error("Error fetching opportunity data:", error);
        // Continue with assignment creation even if opportunity fetch fails
      }
    }
    
    // Determine initial status and workflow stage
    let initialStatus = "unassigned";
    let initialStage = "creation";
    let progressPct = 20;
    
    if (reviewers && reviewers.length > 0) {
      initialStatus = "review";
      initialStage = "review";
      progressPct = 40;
    }
    
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        publisherId,
        title,
        description: enhancedDescription,
        type: type || "newsletter",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        tags: tags || [],
        brief: enhancedBrief,
        shareableSlug,
        status: initialStatus,
        // Enhanced workflow fields
        targetSegments: targetSegments || [],
        emailPlatform: emailPlatform || 'auto-detect',
        reviewers: reviewers || [],
        reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : undefined,
        reviewNotes,
        autoGenerateVariations: autoGenerateVariations !== false,
        workflowStage: initialStage,
        progressPercentage: progressPct,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Add the full shareable URL to the response
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const shareableUrl = `${protocol}://${host}/assignment/${shareableSlug}`;
    
    res.json({
      ...newAssignment,
      shareableUrl
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Update assignment
router.patch("/api/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // First, check if assignment exists
    console.log(`Looking for assignment with ID: ${id}`);
    const [existingAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);
    
    console.log(`Assignment found:`, existingAssignment ? existingAssignment.id : 'None');
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Use the assignment's publisherId for the update
    const [updated] = await db
      .update(assignments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // If status is being changed to "review", create an approval request
    if (updates.status === "review") {
      try {
        const { approvals } = await import("@shared/schema");
        await db.insert(approvals).values({
          publisherId: existingAssignment.publisherId,
          entityType: "assignment",
          entityId: id,
          status: "pending",
          requestedBy: "copywriter", // In production, get from auth
          requestedAt: new Date(),
        });
        console.log(`Created approval request for assignment ${id}`);
      } catch (approvalError) {
        console.error("Error creating approval request:", approvalError);
        // Don't fail the main update if approval creation fails
      }
    }
    
    // Add shareable URL to response
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const shareableUrl = updated.shareableSlug 
      ? `${protocol}://${host}/assignment/${updated.shareableSlug}`
      : null;
    
    res.json({
      ...updated,
      shareableUrl
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// Public route to view assignment by shareable slug (no auth required)
router.get("/api/public/assignment/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.shareableSlug, slug))
      .limit(1);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Return public-safe assignment data
    res.json({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      priority: assignment.priority,
      status: assignment.status,
      dueDate: assignment.dueDate,
      content: assignment.content,
      tags: assignment.tags,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      publisherName: "SharpSend Publisher", // You can fetch the actual publisher name if needed
    });
  } catch (error) {
    console.error("Error fetching public assignment:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// Generate shareable link for existing assignment
router.post("/api/assignments/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    // Check if assignment already has a shareable slug
    const [existing] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    let shareableSlug = existing.shareableSlug;
    
    // Generate new slug if doesn't exist
    if (!shareableSlug) {
      shareableSlug = generateShareableSlug();
      
      await db
        .update(assignments)
        .set({ shareableSlug })
        .where(eq(assignments.id, id));
    }
    
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const shareableUrl = `${protocol}://${host}/assignment/${shareableSlug}`;
    
    res.json({ shareableUrl, shareableSlug });
  } catch (error) {
    console.error("Error generating shareable link:", error);
    res.status(500).json({ error: "Failed to generate shareable link" });
  }
});

// AI Suggestions endpoint with real URL content analysis
router.post("/api/ai/assignments/suggest", async (req, res) => {
  try {
    const { source_url, raw_text, type_hint } = req.body;
    
    let contentToAnalyze = raw_text || "";
    let sourceTitle = "";
    
    // If URL is provided, fetch the actual article content
    if (source_url && !raw_text) {
      try {
        console.log(`Fetching article content from: ${source_url}`);
        
        // Enhanced fetch with timeout and better headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(source_url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SharpSend/1.0; +https://sharpsend.io)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          redirect: 'follow',
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log(`Fetched ${html.length} characters of HTML`);
        
        // Enhanced content extraction
        let textContent = html;
        
        // Remove scripts, styles, and other non-content elements
        textContent = textContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '');
        
        // Try to extract title from multiple sources
        let titleMatches = [
          html.match(/<title[^>]*>([^<]+)<\/title>/i),
          html.match(/<h1[^>]*>([^<]+)<\/h1>/i),
          html.match(/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i),
          html.match(/<meta[^>]*name=["\']title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i)
        ];
        
        for (let match of titleMatches) {
          if (match && match[1]) {
            sourceTitle = match[1].trim();
            break;
          }
        }
        
        // Try to extract article content from common patterns
        const articlePatterns = [
          /<article[^>]*>([\s\S]*?)<\/article>/i,
          /<div[^>]*class=["\'][^"\']*article[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*class=["\'][^"\']*content[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i,
          /<main[^>]*>([\s\S]*?)<\/main>/i
        ];
        
        let articleContent = "";
        for (let pattern of articlePatterns) {
          const match = textContent.match(pattern);
          if (match && match[1] && match[1].length > 200) {
            articleContent = match[1];
            break;
          }
        }
        
        // If no article content found, use the whole processed HTML
        if (!articleContent) {
          articleContent = textContent;
        }
        
        // Clean up and extract final text
        const finalText = articleContent
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        
        contentToAnalyze = finalText.slice(0, 4000); // Increased limit
        console.log(`Extracted ${contentToAnalyze.length} characters from article. Title: "${sourceTitle}"`);
        console.log(`Content preview: ${contentToAnalyze.slice(0, 200)}...`);
        
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        console.error("Error fetching URL content:", errorMessage);
        console.log("Falling back to URL-aware mock suggestions");
        // Extract domain for contextual fallback
        try {
          const urlObj = new URL(source_url);
          sourceTitle = `Article from ${urlObj.hostname}`;
        } catch {
          sourceTitle = "Financial Article";
        }
        contentToAnalyze = "";
      }
    }
    
    // Enhanced URL analysis - extract key information from URL even if content fetch fails
    let urlContext = "";
    if (source_url && !contentToAnalyze) {
      try {
        const urlObj = new URL(source_url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;
        
        // Extract meaningful information from URL structure
        const pathSegments = pathname.split('/').filter(seg => seg && seg.length > 2);
        const urlKeywords = pathSegments.join(' ').replace(/-/g, ' ');
        
        urlContext = `URL Analysis:
Source: ${hostname}
Topic keywords from URL: ${urlKeywords}
Article URL: ${source_url}
Title extracted: ${sourceTitle || 'Not available'}

This appears to be a financial news article. Please generate assignment suggestions based on this URL context and any extracted title information.`;

        contentToAnalyze = urlContext;
        console.log("Using URL-based analysis for content generation");
      } catch (urlError) {
        console.error("Error parsing URL:", urlError);
      }
    }

    // If we have content to analyze (either scraped or URL-based), use OpenAI to generate suggestions
    if (contentToAnalyze && contentToAnalyze.length > 50) {
      try {
        const { OpenAI } = await import('openai');
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        const prompt = `Analyze this financial news article and generate 2 specific assignment suggestions for a financial newsletter copywriter:

Article Title: ${sourceTitle}
Article Content: ${contentToAnalyze}
Source URL: ${source_url || 'Text input'}
Content Type: ${type_hint || 'auto'}

Based on the ACTUAL CONTENT above, create 2 distinct assignment suggestions that:
- Reference specific facts, numbers, or events mentioned in the article
- Target different subscriber segments (e.g., income investors vs growth investors)
- Include actionable insights from the source material
- Create urgency around the specific developments mentioned

For each suggestion, provide:
1. Title: Reference specific companies, events, or data from the article (8-12 words)
2. Objective: What this assignment should accomplish for subscribers (max 150 characters)
3. Angle: Unique perspective based on the article's key insights (max 120 characters)
4. Key Points: 3-4 specific points that directly reference article content
5. CTA: Action-oriented label and relevant URL
6. Due Date: 2-5 days from now

IMPORTANT: 
- Make sure each suggestion clearly demonstrates you read and understood the specific article content
- Include actual company names, figures, or events mentioned
- Keep the "angle" field under 120 characters
- Keep the "objective" field under 150 characters

Return only valid JSON:
{
  "suggestions": [
    {
      "title": "string",
      "objective": "string", 
      "angle": "string",
      "key_points": ["string", "string", "string"],
      "cta": {
        "label": "string",
        "url": "string"
      },
      "due_at_suggestion": "ISO date string",
      "flags": []
    }
  ]
}`;

        console.log("Sending request to OpenAI with content length:", contentToAnalyze.length);
        console.log("OpenAI API Key available:", !!process.env.OPENAI_API_KEY);
        
        const completion = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system", 
              content: "You are a financial newsletter strategist. Generate assignment suggestions based on market news and events. Always return valid JSON with the exact structure requested."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });
        
        console.log("OpenAI response received, choice count:", completion.choices?.length || 0);
        
        const aiResponse = completion.choices[0]?.message?.content;
        if (aiResponse) {
          try {
            // Clean up the response - remove markdown code blocks if present
            let cleanedResponse = aiResponse.trim();
            
            // Remove any leading/trailing backticks and code block markers
            cleanedResponse = cleanedResponse
              .replace(/^`+/g, '')  // Remove leading backticks
              .replace(/`+$/g, '')  // Remove trailing backticks  
              .replace(/^```(?:json)?\s*/gm, '')  // Remove opening code blocks
              .replace(/\s*```$/gm, '')  // Remove closing code blocks
              .trim();
            
            // Extract the JSON object - find the outermost braces
            const firstBrace = cleanedResponse.indexOf('{');
            const lastBrace = cleanedResponse.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
            }
            
            const parsedResponse = JSON.parse(cleanedResponse);
            console.log("AI generated suggestions based on article content");
            console.log("Suggestions generated:", parsedResponse.suggestions?.length || 0);
            return res.json(parsedResponse);
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            console.log("Raw AI response (first 500 chars):", aiResponse.slice(0, 500));
            // Fall through to mock suggestions
          }
        }
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);
        // Fall through to mock suggestions
      }
    }
    
    // Fallback: Enhanced mock suggestions with URL context
    const contextualTitle = sourceTitle || "Market Analysis";
    const mockSuggestions = [
      {
        title: `Weekly Insights: ${contextualTitle.split(' ').slice(0, 3).join(' ')}`,
        objective: "Brief readers on market developments and drive engagement with actionable insights.",
        angle: source_url ? `Breaking down the key implications from recent ${contextualTitle.toLowerCase()}` : "A focused look at current market dynamics affecting portfolios.",
        key_points: source_url ? [
          `Key insights from: ${new URL(source_url).hostname}`,
          "Market implications for subscribers",
          "Actionable next steps for investors"
        ] : [
          "Current market conditions analysis",
          "Portfolio positioning recommendations", 
          "Risk assessment and opportunities"
        ],
        cta: {
          label: "Read Full Analysis",
          url: source_url || "https://publisher.com/analysis"
        },
        due_at_suggestion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        flags: source_url ? ["url_based"] : []
      },
      {
        title: "Market Alert: Key Developments",
        objective: "Alert subscribers to important market changes with clear action items.",
        angle: "What this means for your portfolio positioning.",
        key_points: [
          "Breaking market developments",
          "Impact on key sectors",
          "Recommended portfolio adjustments"
        ],
        cta: {
          label: "View Recommendations", 
          url: "https://publisher.com/recommendations"
        },
        due_at_suggestion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        flags: []
      }
    ];
    
    res.json({ suggestions: mockSuggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

// CDN Assets endpoint for copywriter image browsing - Publisher-specific
router.get("/api/cdn/assets", async (req, res) => {
  try {
    // Get publisher ID from auth token or tenant context
    const publisherId = req.tenant?.id || 'demo-publisher';
    
    // In production, this would query the object storage for publisher-specific assets
    // For now, provide publisher-specific demo assets with unique IDs per publisher
    const publisherAssetPrefix = publisherId.slice(0, 8); // Use first 8 chars of publisher ID
    
    const demoAssets = [
      {
        id: `${publisherAssetPrefix}-1`,
        name: "financial-charts.jpg",
        url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
        type: "image",
        size: 245760,
        mimeType: "image/jpeg",
        width: 800,
        height: 600,
        publisherId: publisherId,
        createdAt: new Date().toISOString()
      },
      {
        id: `${publisherAssetPrefix}-2`, 
        name: "stock-market-screen.jpg",
        url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80",
        type: "image",
        size: 156432,
        mimeType: "image/jpeg",
        width: 800,
        height: 400,
        publisherId: publisherId,
        createdAt: new Date().toISOString()
      },
      {
        id: `${publisherAssetPrefix}-3`,
        name: "trading-analytics.jpg", 
        url: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&q=80",
        type: "image",
        size: 198765,
        mimeType: "image/jpeg",
        width: 800,
        height: 600,
        publisherId: publisherId,
        createdAt: new Date().toISOString()
      },
      {
        id: `${publisherAssetPrefix}-4`,
        name: "financial-newsletter.jpg",
        url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
        type: "image",
        size: 187543,
        mimeType: "image/jpeg",
        width: 600,
        height: 800,
        publisherId: publisherId,
        createdAt: new Date().toISOString()
      },
      {
        id: `${publisherAssetPrefix}-5`,
        name: "market-growth.jpg",
        url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80",
        type: "image",
        size: 234521,
        mimeType: "image/jpeg",
        width: 800,
        height: 600,
        publisherId: publisherId,
        createdAt: new Date().toISOString()
      },
      {
        id: `${publisherAssetPrefix}-6`,
        name: "investment-strategy.jpg",
        url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
        type: "image",
        size: 176890,
        mimeType: "image/jpeg",
        width: 800,
        height: 600,
        publisherId: publisherId,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter assets by publisher to ensure proper access control
    const publisherAssets = demoAssets.filter(asset => asset.publisherId === publisherId);
    
    res.json(publisherAssets);
  } catch (error) {
    console.error("Error fetching CDN assets:", error);
    res.status(500).json({ error: "Failed to fetch CDN assets" });
  }
});

// Generate email variations for approved assignment
router.post("/api/assignments/:id/variations", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    // Get the assignment
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ))
      .limit(1);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Simulate email variation generation for different segments
    const segments = [
      { id: "growth-investors", name: "Growth Investors", description: "Focus on growth stocks and emerging markets" },
      { id: "conservative-investors", name: "Conservative Investors", description: "Focus on stable, dividend-paying stocks" },
      { id: "day-traders", name: "Day Traders", description: "Active traders looking for short-term opportunities" },
      { id: "crypto-enthusiasts", name: "Crypto Enthusiasts", description: "Interested in cryptocurrency and digital assets" }
    ];
    
    const variations = segments.map(segment => ({
      id: `${id}-${segment.id}`,
      segmentId: segment.id,
      segmentName: segment.name,
      subjectLine: generateSubjectLineForSegment(assignment.title, segment),
      content: generateContentForSegment(assignment.content || assignment.description, segment),
      estimatedReach: Math.floor(Math.random() * 5000) + 1000,
      createdAt: new Date().toISOString()
    }));
    
    // Update assignment status to completed after generating variations
    await db
      .update(assignments)
      .set({ 
        status: "completed",
        updatedAt: new Date()
      })
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ));
    
    res.json({ variations, message: "Email variations generated successfully" });
  } catch (error) {
    console.error("Error generating email variations:", error);
    res.status(500).json({ error: "Failed to generate email variations" });
  }
});

// Helper function to generate segment-specific subject lines
function generateSubjectLineForSegment(title: string, segment: any): string {
  const baseTitle = title || "Market Update";
  
  switch (segment.id) {
    case "growth-investors":
      return `🚀 ${baseTitle}: High-Growth Opportunities Ahead`;
    case "conservative-investors":
      return `🛡️ ${baseTitle}: Stable Investment Insights`;
    case "day-traders":
      return `⚡ ${baseTitle}: Quick Moves & Market Signals`;
    case "crypto-enthusiasts":
      return `₿ ${baseTitle}: Digital Asset Market Analysis`;
    default:
      return baseTitle;
  }
}

// Helper function to generate segment-specific content
function generateContentForSegment(content: string, segment: any): string {
  const baseContent = content || "Market analysis and investment insights.";
  
  const segmentIntros = {
    "growth-investors": "For growth-focused investors seeking high-potential opportunities:",
    "conservative-investors": "For conservative investors prioritizing stability and income:",
    "day-traders": "For active traders looking for immediate market opportunities:",
    "crypto-enthusiasts": "For digital asset investors and crypto enthusiasts:"
  };
  
  const intro = segmentIntros[segment.id as keyof typeof segmentIntros] || "";
  return `${intro}\n\n${baseContent}`;
}

// Get email variations for a specific assignment
router.get("/api/assignments/:id/variations", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    // Get the assignment
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ))
      .limit(1);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    if (assignment.status !== "completed") {
      return res.json({ variations: [], message: "No variations available for non-completed assignments" });
    }
    
    // Generate the same variations as when completing the assignment
    const segments = [
      { id: "growth-investors", name: "Growth Investors", description: "Focus on growth stocks and emerging markets", icon: "🚀" },
      { id: "conservative-investors", name: "Conservative Investors", description: "Focus on stable, dividend-paying stocks", icon: "🛡️" },
      { id: "day-traders", name: "Day Traders", description: "Active traders looking for short-term opportunities", icon: "⚡" },
      { id: "crypto-enthusiasts", name: "Crypto Enthusiasts", description: "Interested in cryptocurrency and digital assets", icon: "₿" }
    ];
    
    const variations = segments.map(segment => ({
      id: `${id}-${segment.id}`,
      segmentId: segment.id,
      segmentName: segment.name,
      segmentDescription: segment.description,
      segmentIcon: segment.icon,
      subjectLine: generateSubjectLineForSegment(assignment.title, segment),
      content: generateContentForSegment(assignment.content || assignment.description, segment),
      estimatedReach: Math.floor(Math.random() * 5000) + 1000,
      createdAt: assignment.updatedAt || assignment.createdAt
    }));

    // Store variations in database for tracking
    for (const variation of variations) {
      await db.insert(emailVariations).values({
        assignmentId: assignment.id,
        publisherId: assignment.publisherId,
        segmentId: variation.segmentId,
        segmentName: variation.segmentName,
        segmentDescription: variation.segmentDescription,
        segmentIcon: variation.segmentIcon,
        subjectLine: variation.subjectLine,
        content: variation.content,
        estimatedReach: variation.estimatedReach,
      }).onConflictDoNothing();
    }

    // Extract and track images from assignment content
    if (assignment.content || assignment.masterDraft) {
      await trackAssignmentImages(assignment.id, assignment.publisherId, assignment.content, assignment.masterDraft);
    }
    
    res.json({ variations, assignment });
  } catch (error) {
    console.error("Error fetching email variations:", error);
    res.status(500).json({ error: "Failed to fetch email variations" });
  }
});

// Helper function to track images in assignments and variations
async function trackAssignmentImages(assignmentId: string, publisherId: string, content?: string, masterDraft?: any) {
  try {
    const imageUrls: string[] = [];
    
    // Extract images from content
    if (content) {
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        imageUrls.push(match[2]);
      }
    }
    
    // Extract images from masterDraft blocks
    if (masterDraft?.blocks) {
      for (const block of masterDraft.blocks) {
        if (block.type === 'image' && block.assetId) {
          imageUrls.push(block.assetId);
        }
      }
    }
    
    // Track each unique image
    for (const imageUrl of [...new Set(imageUrls)]) {
      const pixelTrackingId = `img_${randomBytes(8).toString('hex')}`;
      
      await db.insert(imageAttachments).values({
        publisherId,
        assignmentId,
        imageUrl,
        imagePath: extractImagePath(imageUrl),
        pixelTrackingId,
        placement: 'inline',
        isActive: true,
      }).onConflictDoNothing();
    }
  } catch (error) {
    console.error('Error tracking assignment images:', error);
  }
}

// Helper function to extract image path from URL
function extractImagePath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

// API endpoint to get images for assignment or variation
router.get("/api/assignments/:id/images", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const images = await db
      .select()
      .from(imageAttachments)
      .where(and(
        eq(imageAttachments.assignmentId, id),
        eq(imageAttachments.publisherId, publisherId),
        eq(imageAttachments.isActive, true)
      ))
      .orderBy(desc(imageAttachments.createdAt));
    
    res.json({ images });
  } catch (error) {
    console.error("Error fetching assignment images:", error);
    res.status(500).json({ error: "Failed to fetch assignment images" });
  }
});

// API endpoint to track image pixel events
router.post("/api/image-pixel-event", async (req, res) => {
  try {
    const { imageAttachmentId, eventType, subscriberId, metadata } = req.body;
    const publisherId = "demo-publisher";
    
    await db.insert(imagePixelEvents).values({
      publisherId,
      imageAttachmentId,
      eventType,
      subscriberId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      referrer: req.get('referer'),
      metadata,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking image pixel event:", error);
    res.status(500).json({ error: "Failed to track image event" });
  }
});

// API endpoint to search images by assignment or email variation
router.get("/api/images/search", async (req, res) => {
  try {
    const { assignmentId, emailVariationId, query } = req.query;
    const publisherId = "demo-publisher";
    
    let whereClause = eq(imageAttachments.publisherId, publisherId);
    
    if (assignmentId) {
      whereClause = and(whereClause, eq(imageAttachments.assignmentId, assignmentId as string));
    }
    
    if (emailVariationId) {
      whereClause = and(whereClause, eq(imageAttachments.emailVariationId, emailVariationId as string));
    }
    
    const images = await db
      .select()
      .from(imageAttachments)
      .where(whereClause)
      .orderBy(desc(imageAttachments.createdAt));
    
    // Filter by text query if provided
    let filteredImages = images;
    if (query) {
      const searchTerm = (query as string).toLowerCase();
      filteredImages = images.filter(img => 
        img.caption?.toLowerCase().includes(searchTerm) ||
        img.altText?.toLowerCase().includes(searchTerm) ||
        img.imagePath?.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({ images: filteredImages });
  } catch (error) {
    console.error("Error searching images:", error);
    res.status(500).json({ error: "Failed to search images" });
  }
});

export default router;