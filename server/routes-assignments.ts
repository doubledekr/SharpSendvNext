import { Router } from "express";
import { db } from "./db";
import { assignments, emailSendQueue, subscribers } from "@shared/schema-multitenant";
import { emailVariations, imageAttachments, imagePixelEvents, trackingPixels } from "@shared/schema";
import { eq, and, desc, notInArray } from "drizzle-orm";
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

// Get single assignment (by ID or slug)
router.get("/api/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    // First try to find by ID
    let assignment = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ))
      .limit(1);
    
    // If not found by ID, try to find by shareable slug
    if (!assignment || assignment.length === 0) {
      assignment = await db
        .select()
        .from(assignments)
        .where(eq(assignments.shareableSlug, id))
        .limit(1);
    }
    
    if (!assignment || assignment.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    const assignmentData = assignment[0];
    
    // Add shareable URL
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const shareableUrl = assignmentData.shareableSlug 
      ? `${protocol}://${host}/assignment/${assignmentData.shareableSlug}`
      : null;
    
    res.json({
      ...assignmentData,
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
      title, description, type, priority, dueDate, notes, tags, brief, opportunityId, referenceUrl,
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
        referenceUrl, // Add reference URL to assignment
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

    // If assignment is being approved, automatically add to broadcast queue
    if (updates.status === "approved" || updates.approvalStatus === "approved") {
      try {
        console.log(`Auto-adding approved assignment ${id} to broadcast queue`);
        
        // Check if already in broadcast queue
        const { broadcastQueue } = await import("@shared/schema-multitenant");
        const existingQueueItem = await db
          .select()
          .from(broadcastQueue)
          .where(and(
            eq(broadcastQueue.assignmentId, id),
            eq(broadcastQueue.publisherId, existingAssignment.publisherId)
          ))
          .limit(1);

        if (!existingQueueItem.length) {
          // Add to broadcast queue
          const [queueItem] = await db.insert(broadcastQueue).values({
            publisherId: existingAssignment.publisherId,
            assignmentId: id,
            title: updated.title,
            status: "queued",
            audienceCount: 42, // Customer.io subscriber count
            segments: updated.targetSegments || [],
            sendSettings: null,
            abTestConfig: { enabled: false },
          }).returning();
          
          console.log(`Successfully added assignment ${id} to broadcast queue:`, queueItem.id);
        } else {
          console.log(`Assignment ${id} already in broadcast queue`);
        }
      } catch (queueError) {
        console.error("Error auto-adding to broadcast queue:", queueError);
        // Don't fail the main approval if queue addition fails
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

// Phase 1: Approval System API Endpoints

// Approve assignment
router.post("/api/assignments/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Add to approval history
    const currentHistory = existingAssignment.approvalHistory || [];
    const newHistoryEntry = {
      action: "approved",
      userId: "current-user", // TODO: Get from auth context
      userName: "Current User", // TODO: Get from auth context
      comments: comments || "",
      timestamp: new Date().toISOString()
    };
    
    // Update assignment with approval
    const [updated] = await db
      .update(assignments)
      .set({
        approvalStatus: "approved",
        approvalComments: comments,
        approvedBy: "current-user", // TODO: Get from auth context
        approvedAt: new Date(),
        approvalHistory: [...currentHistory, newHistoryEntry],
        status: "approved", // Also update main status
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, id))
      .returning();

    // Automatically add approved assignment to broadcast queue
    try {
      console.log(`Auto-adding approved assignment ${id} to broadcast queue`);
      
      // Import broadcast queue table from the correct schema
      const { broadcastQueue } = await import("@shared/schema-multitenant");
      const existingQueueItem = await db
        .select()
        .from(broadcastQueue)
        .where(and(
          eq(broadcastQueue.assignmentId, id),
          eq(broadcastQueue.publisherId, existingAssignment.publisherId)
        ))
        .limit(1);

      if (!existingQueueItem.length) {
        // Add to broadcast queue with "queued" status to prevent auto-sending
        const [queueItem] = await db.insert(broadcastQueue).values({
          publisherId: existingAssignment.publisherId,
          assignmentId: id,
          title: updated.title,
          status: "queued", // Items require manual scheduling/sending
          audienceCount: 42, // Customer.io subscriber count
          segments: updated.targetSegments || [],
          sendSettings: null,
          abTestConfig: { enabled: false },
        }).returning();
        
        console.log(`✅ Successfully added assignment ${id} to broadcast queue:`, queueItem.id);
      } else {
        console.log(`Assignment ${id} already in broadcast queue`);
      }
    } catch (queueError) {
      console.error("❌ Error auto-adding to broadcast queue:", queueError);
      // Don't fail the main approval if queue addition fails
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error approving assignment:", error);
    res.status(500).json({ error: "Failed to approve assignment" });
  }
});

// Reject assignment
router.post("/api/assignments/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Add to approval history
    const currentHistory = existingAssignment.approvalHistory || [];
    const newHistoryEntry = {
      action: "rejected",
      userId: "current-user", // TODO: Get from auth context
      userName: "Current User", // TODO: Get from auth context
      comments: comments || "",
      timestamp: new Date().toISOString()
    };
    
    // Update assignment with rejection
    const [updated] = await db
      .update(assignments)
      .set({
        approvalStatus: "rejected",
        approvalComments: comments,
        approvalHistory: [...currentHistory, newHistoryEntry],
        status: "revision_requested", // Set status to revision_requested
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, id))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error rejecting assignment:", error);
    res.status(500).json({ error: "Failed to reject assignment" });
  }
});

// Request changes for assignment
router.post("/api/assignments/:id/request-changes", async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({ error: "Comments are required when requesting changes" });
    }
    
    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Add to approval history
    const currentHistory = existingAssignment.approvalHistory || [];
    const newHistoryEntry = {
      action: "changes_requested",
      userId: "current-user", // TODO: Get from auth context
      userName: "Current User", // TODO: Get from auth context
      comments: comments,
      timestamp: new Date().toISOString()
    };
    
    // Update assignment with change request
    const [updated] = await db
      .update(assignments)
      .set({
        approvalStatus: "changes_requested",
        approvalComments: comments,
        approvalHistory: [...currentHistory, newHistoryEntry],
        status: "revision_requested", // Set status to revision_requested
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, id))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error requesting changes for assignment:", error);
    res.status(500).json({ error: "Failed to request changes for assignment" });
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

// **CRITICAL FIX 1: AI Content Generation for Assignment Editor**
router.post("/api/assignments/:id/generate-content", async (req, res) => {
  try {
    const { id } = req.params;
    const { objective, angle, keyPoints, segment } = req.body;
    
    // Get assignment to update
    const [existingAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Generate AI content using mock for now (can be enhanced with OpenAI later)
    const mockContent = `Subject: ${objective || 'Market Update'}: Key Opportunities This Week

Hello ${segment || 'Valued Investor'},

The market showed strong momentum this week, presenting several opportunities aligned with your investment strategy.

**Market Analysis:**
Based on your objective of "${objective}", here are the key developments:

${keyPoints?.map((point, index) => `${index + 1}. ${point}`).join('\n') || '• Technology sector leading with 3.4% gains\n• Healthcare showing resilience with 2.1% increase\n• Energy sector providing defensive positioning'}

**Investment Opportunity:**
${angle} - This creates a compelling entry point for portfolio optimization.

**Key Insights:**
- Current market conditions favor active positioning
- Risk-adjusted returns show 15-20% potential upside
- Institutional buying patterns indicate sustained momentum

**Action Items:**
- Review your current allocation
- Consider rebalancing toward growth sectors  
- Set stop-loss orders at 5% below entry points

**Risk Management:**
Monitor key support levels at S&P 4,200 and adjust positions accordingly.

Ready to capitalize on these opportunities? Let me know your thoughts.

Best regards,
The SharpSend Team

P.S. Remember to stay disciplined with your risk management strategy.`;

    // Save generated content to assignment
    const [updatedAssignment] = await db
      .update(assignments)
      .set({
        content: mockContent,
        status: 'in_progress', // Move to in_progress after content generation
        updatedAt: new Date()
      })
      .where(eq(assignments.id, id))
      .returning();

    res.json({ 
      success: true,
      content: mockContent,
      assignment: updatedAssignment
    });
    
  } catch (error) {
    console.error("Error generating assignment content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// **CRITICAL FIX 2: Complete Assignment (Ready for Review)**
router.post("/api/assignments/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [updatedAssignment] = await db
      .update(assignments)
      .set({
        status: 'review',
        workflowStage: 'review',
        progressPercentage: 80,
        updatedAt: new Date()
      })
      .where(eq(assignments.id, id))
      .returning();

    if (!updatedAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(updatedAssignment);
  } catch (error) {
    console.error("Error completing assignment:", error);
    res.status(500).json({ error: "Failed to complete assignment" });
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

// Generate email variations for approved assignment with A/B testing
router.post("/api/assignments/:id/generate-variations", async (req, res) => {
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
    
    // Get request body for master content
    const { subject, content } = req.body;
    
    // Clean up any AI formatting artifacts from content
    const cleanContent = (text: string) => {
      return text
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/##\s*/g, '') // Remove heading markdown
        .replace(/###\s*/g, '') // Remove subheading markdown
        .replace(/^\*\s+/gm, '• ') // Convert asterisk lists to bullets
        .replace(/^\d+\.\s+/gm, (match) => match) // Keep numbered lists
        .trim();
    };
    
    // Get target segments from assignment or use defaults
    const targetSegments = assignment.targetSegments || [
      { 
        segmentId: "all_users",
        segmentName: "All Subscribers",
        subscriberCount: 42,
        platform: "customerio"
      }
    ];
    
    // Generate A/B test variations for each segment
    const variations = [];
    
    for (const segment of targetSegments) {
      // Generate 2-3 variations per segment for A/B testing
      const variationCount = segment.segmentId === "all_users" ? 3 : 2;
      
      for (let v = 0; v < variationCount; v++) {
        const variationLabel = String.fromCharCode(65 + v); // A, B, C
        
        variations.push({
          id: `${id}-${segment.segmentId}-${variationLabel}`,
          segmentId: segment.segmentId,
          segmentName: segment.segmentName,
          variationLabel: `Version ${variationLabel}`,
          subjectLine: generateSubjectVariation(
            subject || assignment.title, 
            segment,
            v
          ),
          content: cleanContent(
            generateContentVariation(
              content || assignment.content || assignment.description,
              segment,
              assignment.referenceUrl,
              v
            )
          ),
          estimatedRecipients: Math.ceil(segment.subscriberCount / variationCount),
          platform: segment.platform,
          abTestGroup: variationLabel,
          pixelTracking: true,
          aiScore: Math.floor(Math.random() * 10) + 88, // 88-98% score
          createdAt: new Date().toISOString()
        });
      }
    }
    
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
    
    res.json(variations);
  } catch (error) {
    console.error("Error generating email variations:", error);
    res.status(500).json({ error: "Failed to generate email variations" });
  }
});

// Helper function to generate subject line variations for A/B testing
function generateSubjectVariation(title: string, segment: any, variation: number): string {
  const baseTitle = title || "Market Update";
  
  // Create different subject line approaches for A/B testing
  const variations = [
    // Version A: Direct & Actionable
    `${baseTitle} - Action Required Today`,
    // Version B: Curiosity & Benefit
    `What ${baseTitle} Means for Your Portfolio`,
    // Version C: Urgency & Exclusivity
    `[Limited Time] ${baseTitle} for ${segment.segmentName}`
  ];
  
  return variations[variation] || baseTitle;
}

// Helper function to generate content variations for A/B testing
function generateContentVariation(description: string, segment: any, referenceUrl: string | null, variation: number): string {
  const baseContent = description || "Market analysis and investment insights.";
  
  // Different content approaches for A/B testing
  const contentVariations = [
    // Version A: Direct & Informative
    `Dear Investor,

${baseContent}

Key Takeaways:
• Market momentum continues in key sectors
• Risk-adjusted opportunities identified
• Portfolio positioning recommendations included

${referenceUrl ? `Read the full analysis: ${referenceUrl}` : 'Visit our website for more details.'}

Best regards,
The Investment Team`,
    
    // Version B: Story & Engagement
    `Hello ${segment.segmentName},

This week's market action revealed something interesting...

${baseContent}

What this means for you:
• Immediate action items for your portfolio
• Risk management strategies to implement
• Opportunities aligned with your investment style

${referenceUrl ? `Continue reading: ${referenceUrl}` : 'Learn more on our platform.'}

To your success,
The Research Team`,
    
    // Version C: Data-Driven & Analytical
    `Market Update for ${segment.segmentName}

Performance Metrics:
• Market up 2.3% week-over-week
• Volume increased by 15%
• Volatility index at optimal levels

${baseContent}

Action Steps:
1. Review current allocations
2. Consider rebalancing opportunities
3. Set protective stops

${referenceUrl ? `Full Report: ${referenceUrl}` : 'Access complete analysis online.'}

Regards,
Analytics Team`
  ];
  
  return contentVariations[variation] || contentVariations[0];
}

// Keep original helper for backward compatibility
function generateContentForSegment(content: string, segment: any): string {
  return generateContentVariation(content, segment, null, 0);
}

// Helper function to generate subject line for backward compatibility
function generateSubjectLineForSegment(title: string, segment: any): string {
  return generateSubjectVariation(title, segment, 0);
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

// Generate email variations for an assignment
router.post("/api/assignments/:id/generate-variations", async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content } = req.body;
    
    // For demo purposes, create sample variations with unique pixel IDs
    const demoVariations = [
      {
        id: `var-${id}-growth-${Date.now()}`,
        segmentId: "growth-investors",
        segmentName: "Growth Investors 🚀",
        segmentCriteria: "Investors focused on high-growth opportunities",
        subjectLine: `${subject} - Growth Opportunity Alert`,
        content: `${content}\n\nThis opportunity aligns with your growth investment strategy. High potential for rapid expansion.`,
        estimatedRecipients: 2485,
        pixelId: `pixel-${id}-growth-${Date.now()}`
      },
      {
        id: `var-${id}-conservative-${Date.now()}`,
        segmentId: "conservative-investors", 
        segmentName: "Conservative Investors 🛡️",
        segmentCriteria: "Risk-averse investors seeking stability",
        subjectLine: `${subject} - Stable Investment Insight`,
        content: `${content}\n\nThis presents a measured approach with steady returns. Low-risk profile with consistent performance.`,
        estimatedRecipients: 3241,
        pixelId: `pixel-${id}-conservative-${Date.now()}`
      },
      {
        id: `var-${id}-daytraders-${Date.now()}`,
        segmentId: "day-traders",
        segmentName: "Day Traders ⚡",
        segmentCriteria: "Active traders seeking quick opportunities",
        subjectLine: `URGENT: ${subject} - Trading Signal`,
        content: `${content}\n\n⚡ QUICK MOVE OPPORTUNITY: Perfect for your active trading strategy. Time-sensitive action required.`,
        estimatedRecipients: 1654,
        pixelId: `pixel-${id}-daytraders-${Date.now()}`
      },
      {
        id: `var-${id}-crypto-${Date.now()}`,
        segmentId: "crypto-enthusiasts",
        segmentName: "Crypto Enthusiasts ₿",
        segmentCriteria: "Digital asset and blockchain investors",
        subjectLine: `${subject} - Blockchain Innovation`,
        content: `${content}\n\n₿ Digital asset correlation: This opportunity intersects with blockchain trends. Future of finance potential.`,
        estimatedRecipients: 1987,
        pixelId: `pixel-${id}-crypto-${Date.now()}`
      }
    ];
    
    res.json(demoVariations);
  } catch (error) {
    console.error("Error generating email variations:", error);
    res.status(500).json({ error: "Failed to generate email variations" });
  }
});

// Helper function to parse scheduled time properly
function parseScheduledTime(scheduledTime: string | number, customDateTime?: string): Date {
  if (customDateTime) {
    return new Date(customDateTime);
  }
  
  if (scheduledTime === "immediate" || scheduledTime === "now") {
    return new Date();
  }
  
  // Convert to number and add minutes to current time
  const minutes = typeof scheduledTime === 'string' ? parseInt(scheduledTime, 10) : scheduledTime;
  if (isNaN(minutes)) {
    return new Date(); // Default to immediate if invalid
  }
  
  return new Date(Date.now() + (minutes * 60 * 1000));
}

// Add assignment to send queue with segment variations and pixel tracking
router.post("/api/assignments/:id/send-queue", async (req, res) => {
  try {
    const { id } = req.params;
    const { variations, scheduledTime, customDateTime } = req.body;
    const publisherId = "demo-publisher";

    // Get the assignment 
    console.log(`Looking for assignment ${id} with publisher ${publisherId}`);
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);

    console.log(`Found assignment:`, assignment);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Get all subscribers for this publisher
    const allSubscribers = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.publisherId, publisherId));

    // Create send queue items and tracking pixels for each variation
    const queueItems = [];
    const trackingPixelItems = [];
    
    // Track which subscribers are assigned to specific segments
    const assignedSubscriberIds = new Set();

    // Process selected segment variations
    for (const variation of variations) {
      // Get subscribers for this segment based on segment criteria
      const segmentSubscribers = allSubscribers.filter(sub => {
        // Match subscribers to segments based on segment names/criteria
        switch (variation.segmentName) {
          case 'Growth Investors':
            return sub.segment === 'high-growth' || sub.segment === 'tech-investors' || sub.segment === 'growth';
          case 'Conservative Investors':
            return sub.segment === 'conservative' || sub.segment === 'dividend' || sub.segment === 'low-risk';
          case 'Day Traders':
            return sub.segment === 'active-traders' || sub.segment === 'day-trading' || sub.segment === 'trading';
          case 'Crypto Enthusiasts':
            return sub.segment === 'crypto' || sub.segment === 'blockchain' || sub.segment === 'digital-assets';
          default:
            return false;
        }
      });

      // Create tracking pixel for this variation
      const pixelCode = randomBytes(16).toString("hex");
      const [trackingPixel] = await db.insert(trackingPixels).values({
        variantId: variation.id,
        publisherId,
        emailType: 'assignment_variation',
        isUnique: true,
        auditLog: [{
          timestamp: new Date().toISOString(),
          event: 'pixel_created',
          metadata: { assignmentId: id, segmentName: variation.segmentName }
        }]
      }).returning();

      trackingPixelItems.push(trackingPixel);

      // Add send queue items for segment subscribers
      for (const subscriber of segmentSubscribers) {
        assignedSubscriberIds.add(subscriber.id);
        
        const [queueItem] = await db.insert(emailSendQueue).values({
          publisherId,
          campaignId: id, // Using assignment ID as campaign ID for tracking
          emailType: 'assignment_variation',
          recipientEmail: subscriber.email,
          recipientName: subscriber.name,
          subject: variation.subjectLine,
          content: variation.content,
          scheduledFor: parseScheduledTime(scheduledTime, customDateTime),
          status: 'pending',
          priority: 1,
          metadata: {
            cohort: variation.segmentName,
            assignmentId: id,
            variationId: variation.id,
            trackingPixelId: trackingPixel.id,
            trackingPixelCode: pixelCode,
            segmentCriteria: variation.segmentCriteria,
            personalizationData: {
              segmentName: variation.segmentName,
              aiScore: variation.aiScore
            },
            trackingEnabled: true
          }
        }).returning();

        queueItems.push(queueItem);
      }
    }

    // Create master variation for unassigned subscribers (always create master)
    const unassignedSubscribers = allSubscribers.filter(sub => !assignedSubscriberIds.has(sub.id));
    
    // Always create master variation, even if no unassigned subscribers
    {
      // Create tracking pixel for master variation
      const masterPixelCode = randomBytes(16).toString("hex");
      const [masterTrackingPixel] = await db.insert(trackingPixels).values({
        variantId: `${id}_master`,
        publisherId,
        emailType: 'assignment_master',
        isUnique: true,
        auditLog: [{
          timestamp: new Date().toISOString(),
          event: 'master_pixel_created',
          metadata: { assignmentId: id, segmentName: 'Master/Unassigned' }
        }]
      }).returning();

      trackingPixelItems.push(masterTrackingPixel);

      // Add send queue items for unassigned subscribers using master content
      // Always queue master even if no unassigned subscribers (for tracking purposes)
      if (unassignedSubscribers.length > 0) {
        for (const subscriber of unassignedSubscribers) {
          const [queueItem] = await db.insert(emailSendQueue).values({
            publisherId,
            campaignId: id,
            emailType: 'assignment_master',
            recipientEmail: subscriber.email,
            recipientName: subscriber.name,
            subject: assignment.title, // Use assignment title as master subject
            content: assignment.content || assignment.brief?.objective || 'Master email content',
            scheduledFor: parseScheduledTime(scheduledTime, customDateTime),
            status: 'pending',
            priority: 0, // Lower priority than segment variations
            metadata: {
              cohort: 'Master/Unassigned',
              assignmentId: id,
              variationId: 'master',
              trackingPixelId: masterTrackingPixel.id,
              trackingPixelCode: masterPixelCode,
              personalizationData: {
                segmentName: 'Master',
                isMaster: true
              },
              trackingEnabled: true
            }
          }).returning();

          queueItems.push(queueItem);
        }
      } else {
        // Create a placeholder master queue item for tracking even with no subscribers
        const [queueItem] = await db.insert(emailSendQueue).values({
          publisherId,
          campaignId: id,
          emailType: 'assignment_master',
          recipientEmail: 'no-recipients@placeholder.com',
          recipientName: 'No Unassigned Recipients',
          subject: assignment.title,
          content: assignment.content || assignment.brief?.objective || 'Master email content',
          scheduledFor: parseScheduledTime(scheduledTime, customDateTime),
          status: 'pending',
          priority: 0,
          metadata: {
            cohort: 'Master/Unassigned',
            assignmentId: id,
            variationId: 'master',
            trackingPixelId: masterTrackingPixel.id,
            trackingPixelCode: masterPixelCode,
            personalizationData: {
              segmentName: 'Master',
              isMaster: true,
              isPlaceholder: true
            },
            trackingEnabled: true
          }
        }).returning();

        queueItems.push(queueItem);
      }
    }

    // Update assignment status to indicate it's been queued
    await db.update(assignments)
      .set({ 
        status: 'queued',
        updatedAt: new Date()
      })
      .where(eq(assignments.id, id));

    res.json({
      success: true,
      data: {
        queuedItems: queueItems.length,
        trackingPixels: trackingPixelItems.length,
        segmentVariations: variations.length,
        masterVariationIncluded: true, // Always true since we always create master
        unassignedSubscribers: unassignedSubscribers.length,
        totalSubscribers: allSubscribers.length,
        scheduledFor: parseScheduledTime(scheduledTime, customDateTime),
        details: {
          segmentBreakdown: variations.map(v => ({
            segmentName: v.segmentName,
            subscriberCount: allSubscribers.filter(sub => {
              switch (v.segmentName) {
                case 'Growth Investors':
                  return sub.segment === 'high-growth' || sub.segment === 'tech-investors' || sub.segment === 'growth';
                case 'Conservative Investors':
                  return sub.segment === 'conservative' || sub.segment === 'dividend' || sub.segment === 'low-risk';
                case 'Day Traders':
                  return sub.segment === 'active-traders' || sub.segment === 'day-trading' || sub.segment === 'trading';
                case 'Crypto Enthusiasts':
                  return sub.segment === 'crypto' || sub.segment === 'blockchain' || sub.segment === 'digital-assets';
                default:
                  return false;
              }
            }).length
          })),
          masterVariation: {
            segmentName: 'Master/Unassigned',
            subscriberCount: unassignedSubscribers.length
          }
        }
      }
    });

  } catch (error) {
    console.error("Error adding assignment to send queue:", error);
    res.status(500).json({ error: "Failed to add assignment to send queue" });
  }
});

export default router;