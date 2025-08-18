import { Router } from "express";
import { db } from "./db";
import { assignments } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Get all assignments for a publisher
router.get("/api/assignments", async (req, res) => {
  try {
    // For now, using a demo publisher ID
    const publisherId = "demo-publisher";
    
    const result = await db
      .select()
      .from(assignments)
      .where(eq(assignments.publisherId, publisherId))
      .orderBy(desc(assignments.createdAt));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Create a new assignment
router.post("/api/assignments", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const { title, description, type, priority, dueDate, notes, tags } = req.body;
    
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
        status: "unassigned",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    res.json(newAssignment);
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
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

export default router;