import { Router } from "express";
import { db } from "./db";
import { opportunities } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Get all opportunities for a publisher
router.get("/api/opportunities", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    
    const result = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.publisherId, publisherId))
      .orderBy(desc(opportunities.createdAt));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// Get single opportunity
router.get("/api/opportunities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const [opportunity] = await db
      .select()
      .from(opportunities)
      .where(and(
        eq(opportunities.id, id),
        eq(opportunities.publisherId, publisherId)
      ))
      .limit(1);
    
    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    
    res.json(opportunity);
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

// Create new opportunity
router.post("/api/opportunities", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const {
      title,
      description,
      type,
      potentialValue,
      probability,
      contactName,
      contactEmail,
      contactCompany,
      nextAction,
      nextActionDate,
      notes,
      relatedAssignmentId,
    } = req.body;
    
    const [newOpportunity] = await db
      .insert(opportunities)
      .values({
        publisherId,
        title,
        description,
        type,
        status: "identified",
        potentialValue: potentialValue ? String(potentialValue) : undefined,
        probability,
        contactName,
        contactEmail,
        contactCompany,
        nextAction,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
        notes,
        relatedAssignmentId,
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    res.json(newOpportunity);
  } catch (error) {
    console.error("Error creating opportunity:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

// Update opportunity
router.patch("/api/opportunities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    const updates = req.body;
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Handle status change to won/lost
    if (updates.status === "won" || updates.status === "lost") {
      updates.closedAt = new Date();
    }
    
    const [updatedOpportunity] = await db
      .update(opportunities)
      .set(updates)
      .where(and(
        eq(opportunities.id, id),
        eq(opportunities.publisherId, publisherId)
      ))
      .returning();
    
    if (!updatedOpportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    
    res.json(updatedOpportunity);
  } catch (error) {
    console.error("Error updating opportunity:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

// Delete opportunity
router.delete("/api/opportunities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const result = await db
      .delete(opportunities)
      .where(and(
        eq(opportunities.id, id),
        eq(opportunities.publisherId, publisherId)
      ));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

export default router;