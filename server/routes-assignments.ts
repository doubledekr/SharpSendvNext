import { Router } from "express";
import { db } from "./db";
import { assignments } from "@shared/schema";
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
    
    // For demo users, return demo assignments
    if (user?.id === 'demo-user' || user?.id === 'demo-user-id') {
      const host = req.get('host') || 'sharpsend.io';
      const protocol = req.protocol || 'https';
      
      return res.json([
        {
          id: "demo-1",
          title: "Q1 Market Analysis Report",
          description: "Comprehensive analysis of market trends for Q1",
          type: "newsletter",
          status: "in_progress",
          priority: "high",
          shareableSlug: "demo-q1-analysis",
          shareableUrl: `${protocol}://${host}/assignment/demo-q1-analysis`,
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-20")
        },
        {
          id: "demo-2",
          title: "Crypto Investment Guide",
          description: "Essential guide for crypto investments",
          type: "analysis",
          status: "unassigned",
          priority: "medium",
          shareableSlug: "demo-crypto-guide",
          shareableUrl: `${protocol}://${host}/assignment/demo-crypto-guide`,
          createdAt: new Date("2025-01-10"),
          updatedAt: new Date("2025-01-10")
        }
      ]);
    }
    
    // For real users, use their actual publisher ID
    const publisherId = user?.publisherId || user?.publisher?.id;
    
    if (!publisherId) {
      // Return empty array if no publisher ID is available
      return res.json([]);
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

// Create a new assignment with unique shareable link
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
    
    const { title, description, type, priority, dueDate, notes, tags, brief } = req.body;
    
    // Generate unique shareable slug
    const shareableSlug = generateShareableSlug();
    
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        publisherId,
        title,
        description,
        type,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        tags,
        brief,
        shareableSlug,
        status: "unassigned",
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
    const publisherId = "demo-publisher";
    const updates = req.body;
    
    const [updated] = await db
      .update(assignments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, publisherId)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Assignment not found" });
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

// AI Suggestions endpoint (stub for now)
router.post("/api/ai/assignments/suggest", async (req, res) => {
  try {
    const { source_url, raw_text, type_hint } = req.body;
    
    // For now, return mock suggestions
    // In production, this would call OpenAI or another AI service
    const mockSuggestions = [
      {
        title: "Weekly Income Watch: 3 Yield Signals",
        objective: "Brief readers on income opportunities and drive clicks to the portfolio update.",
        angle: "A quiet shift in credit markets is setting up better yields.",
        key_points: [
          "MBS spreads tightened; watch REITs.",
          "Utilities dividend coverage improved q/q.",
          "Preferred pricing dislocation in BBB tier."
        ],
        cta: {
          label: "See the portfolio update",
          url: "https://publisher.com/portfolio"
        },
        due_at_suggestion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        flags: []
      },
      {
        title: "Market Alert: Fed Minutes Signal Shift",
        objective: "Alert subscribers to Fed policy changes and their portfolio implications.",
        angle: "The Fed just revealed what Wall Street missed.",
        key_points: [
          "Hawkish tone on Q2 inflation data",
          "Regional bank stress mentioned 7 times",
          "Dollar strength concerns growing"
        ],
        cta: {
          label: "Read Full Analysis",
          url: "https://publisher.com/fed-analysis"
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

export default router;