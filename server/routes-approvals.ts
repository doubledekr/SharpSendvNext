import { Router } from "express";
import { db } from "./db";
import { approvals } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Get all approvals for a publisher
router.get("/api/approvals", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    
    const result = await db
      .select()
      .from(approvals)
      .where(eq(approvals.publisherId, publisherId))
      .orderBy(desc(approvals.requestedAt));
    
    // Add mock entity details for demo
    const approvalsWithDetails = result.map(approval => ({
      ...approval,
      entityTitle: `Sample ${approval.entityType} Content`,
      entityContent: "This is a sample content preview for the approval workflow.",
      requestedByName: "John Doe",
    }));
    
    res.json(approvalsWithDetails);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

// Approve content
router.post("/api/approvals/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const publisherId = "demo-publisher";
    
    const [updated] = await db
      .update(approvals)
      .set({
        status: "approved",
        feedback,
        reviewedBy: "current-user",
        reviewedAt: new Date(),
      })
      .where(and(
        eq(approvals.id, id),
        eq(approvals.publisherId, publisherId)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Approval not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error approving content:", error);
    res.status(500).json({ error: "Failed to approve content" });
  }
});

// Reject content
router.post("/api/approvals/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const publisherId = "demo-publisher";
    
    const [updated] = await db
      .update(approvals)
      .set({
        status: "rejected",
        feedback,
        reviewedBy: "current-user",
        reviewedAt: new Date(),
      })
      .where(and(
        eq(approvals.id, id),
        eq(approvals.publisherId, publisherId)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Approval not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error rejecting content:", error);
    res.status(500).json({ error: "Failed to reject content" });
  }
});

// Request changes
router.post("/api/approvals/:id/request-changes", async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const publisherId = "demo-publisher";
    
    const [updated] = await db
      .update(approvals)
      .set({
        status: "changes_requested",
        feedback,
        reviewedBy: "current-user",
        reviewedAt: new Date(),
      })
      .where(and(
        eq(approvals.id, id),
        eq(approvals.publisherId, publisherId)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Approval not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error requesting changes:", error);
    res.status(500).json({ error: "Failed to request changes" });
  }
});

export default router;