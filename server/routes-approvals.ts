import { Router } from "express";
import { db } from "./db";
import { approvals } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Get all approvals for a publisher
router.get("/api/approvals", async (req, res) => {
  try {
    const publisherId = req.tenant?.id || "demo-publisher";
    
    const result = await db
      .select()
      .from(approvals)
      .where(eq(approvals.publisherId, publisherId))
      .orderBy(desc(approvals.requestedAt));
    
    // Fetch assignment details for approval requests
    const { assignments } = await import("@shared/schema");
    const approvalsWithDetails = await Promise.all(result.map(async (approval) => {
      let entityTitle = `${approval.entityType} Content`;
      let entityContent = "Content preview unavailable";
      
      if (approval.entityType === "assignment" && approval.entityId) {
        try {
          const [assignment] = await db
            .select()
            .from(assignments)
            .where(eq(assignments.id, approval.entityId))
            .limit(1);
          
          if (assignment) {
            entityTitle = assignment.title;
            entityContent = assignment.description || "No description available";
          }
        } catch (error) {
          console.error("Error fetching assignment details:", error);
        }
      }
      
      return {
        ...approval,
        entityTitle,
        entityContent,
        requestedByName: "Copywriter", // In production, get from users table
      };
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
    const publisherId = req.tenant?.id || "demo-publisher";
    
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

    // Also update the assignment status to approved if this is an assignment approval
    if (updated.entityType === "assignment") {
      try {
        const { assignments } = await import("@shared/schema");
        await db
          .update(assignments)
          .set({
            status: "approved",
            updatedAt: new Date(),
          })
          .where(eq(assignments.id, updated.entityId));
      } catch (error) {
        console.error("Error updating assignment status:", error);
      }
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
    const publisherId = req.tenant?.id || "demo-publisher";
    
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

    // Also update the assignment status back to in_progress if this is an assignment rejection
    if (updated.entityType === "assignment") {
      try {
        const { assignments } = await import("@shared/schema");
        await db
          .update(assignments)
          .set({
            status: "in_progress",
            updatedAt: new Date(),
          })
          .where(eq(assignments.id, updated.entityId));
      } catch (error) {
        console.error("Error updating assignment status:", error);
      }
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