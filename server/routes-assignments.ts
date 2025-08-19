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
    // For now, using a demo publisher ID
    const publisherId = "demo-publisher";
    
    const result = await db
      .select()
      .from(assignments)
      .where(eq(assignments.publisherId, publisherId))
      .orderBy(desc(assignments.createdAt));
    
    // Add shareable URLs to each assignment
    const host = req.get('host') || 'sharpsend.io';
    const protocol = req.protocol || 'https';
    const assignmentsWithUrls = result.map(assignment => ({
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

// Create a new assignment with unique shareable link
router.post("/api/assignments", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const { title, description, type, priority, dueDate, notes, tags } = req.body;
    
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

export default router;