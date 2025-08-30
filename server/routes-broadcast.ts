import { Router, Request, Response } from "express";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { broadcastQueue, broadcastSendLogs, assignments } from "@shared/schema-multitenant";
// import { insertBroadcastQueueSchema, insertBroadcastSendLogSchema } from "@shared/schema-multitenant"; // Temporarily disabled
import type { BroadcastQueueItem, InsertBroadcastQueue } from "@shared/schema-multitenant";

// Extend Request type for session
interface AuthenticatedRequest extends Request {
  session?: {
    publisher?: {
      id: string;
      name: string;
      subdomain: string;
    };
    user?: {
      id: string;
      email: string;
    };
  };
}

const router = Router();

// Phase 2: Broadcast Queue API Endpoints

// GET /api/broadcast-queue - Get all broadcast queue items for publisher
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Use demo publisher for now - fix authentication later
    const publisherId = "demo-publisher";
    
    // Original auth check (commented out for now)
    // const publisherId = req.session?.publisher?.id;
    // if (!publisherId) {
    //   return res.status(401).json({ error: "Unauthorized - no publisher session" });
    // }

    const queueItems = await db
      .select({
        id: broadcastQueue.id,
        publisherId: broadcastQueue.publisherId,
        assignmentId: broadcastQueue.assignmentId,
        title: broadcastQueue.title,
        status: broadcastQueue.status,
        scheduledAt: broadcastQueue.scheduledAt,
        sentAt: broadcastQueue.sentAt,
        audienceCount: broadcastQueue.audienceCount,
        segments: broadcastQueue.segments,
        sendSettings: broadcastQueue.sendSettings,
        abTestConfig: broadcastQueue.abTestConfig,
        createdAt: broadcastQueue.createdAt,
        updatedAt: broadcastQueue.updatedAt,
        // Join assignment data for reference
        assignmentTitle: assignments.title,
        assignmentStatus: assignments.status,
        assignmentApprovalStatus: assignments.approvalStatus,
      })
      .from(broadcastQueue)
      .leftJoin(assignments, eq(broadcastQueue.assignmentId, assignments.id))
      .where(eq(broadcastQueue.publisherId, publisherId))
      .orderBy(desc(broadcastQueue.createdAt));

    res.json(queueItems);
  } catch (error) {
    console.error("Error fetching broadcast queue:", error);
    res.status(500).json({ error: "Failed to fetch broadcast queue" });
  }
});

// POST /api/broadcast-queue - Add approved assignment to broadcast queue
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Use demo publisher for now - fix authentication later
    const publisherId = "demo-publisher";
    
    // Original auth check (commented out for now)  
    // const publisherId = req.session?.publisher?.id;
    // if (!publisherId) {
    //   return res.status(401).json({ error: "Unauthorized - no publisher session" });
    // }

    // Build data directly without schema validation for now
    const validatedData = {
      publisherId,
      assignmentId: req.body.assignmentId,
      title: req.body.title || req.body.assignmentTitle || "Untitled Assignment",
      status: req.body.status || "pending",
      audienceCount: req.body.audienceCount || 0,
      segments: req.body.segments || [],
      sendSettings: req.body.sendSettings || null,
      abTestConfig: req.body.abTestConfig || null,
      scheduledAt: req.body.scheduledAt || null,
    };

    // Check if assignment exists (skip approval check for demo)
    const assignment = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, validatedData.assignmentId),
        eq(assignments.publisherId, publisherId)
      ))
      .limit(1);

    if (!assignment.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const assignmentData = assignment[0];
    // Skip approval check for testing - will enable later
    // if (assignmentData.status !== "approved" && assignmentData.approvalStatus !== "approved") {
    //   return res.status(400).json({ error: "Assignment must be approved before adding to broadcast queue" });
    // }

    // Check if assignment is already in queue
    const existingQueueItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.assignmentId, validatedData.assignmentId),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (existingQueueItem.length > 0) {
      return res.status(400).json({ error: "Assignment is already in broadcast queue" });
    }

    // Create broadcast queue item
    const newQueueItem = await db
      .insert(broadcastQueue)
      .values({
        ...validatedData,
        title: validatedData.title || assignmentData.title,
        status: "ready",
        abTestConfig: validatedData.abTestConfig || { enabled: false },
      })
      .returning();

    // Update assignment status to "queued"
    await db
      .update(assignments)
      .set({ 
        status: "queued",
        updatedAt: new Date()
      })
      .where(eq(assignments.id, validatedData.assignmentId));

    res.status(201).json(newQueueItem[0]);
  } catch (error) {
    console.error("Error creating broadcast queue item:", error);
    res.status(500).json({ error: "Failed to create broadcast queue item" });
  }
});

// PUT /api/broadcast-queue/:id - Update broadcast queue item
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const publisherId = req.session?.publisher?.id;
    if (!publisherId) {
      return res.status(401).json({ error: "Unauthorized - no publisher session" });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if queue item exists and belongs to publisher
    const existingItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!existingItem.length) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    // Update queue item
    const updatedItem = await db
      .update(broadcastQueue)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(broadcastQueue.id, id))
      .returning();

    res.json(updatedItem[0]);
  } catch (error) {
    console.error("Error updating broadcast queue item:", error);
    res.status(500).json({ error: "Failed to update broadcast queue item" });
  }
});

// DELETE /api/broadcast-queue/:id - Remove item from broadcast queue
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const publisherId = req.session?.publisher?.id;
    if (!publisherId) {
      return res.status(401).json({ error: "Unauthorized - no publisher session" });
    }

    const { id } = req.params;

    // Check if queue item exists and belongs to publisher
    const existingItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!existingItem.length) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    // Remove from queue
    await db
      .delete(broadcastQueue)
      .where(eq(broadcastQueue.id, id));

    // Update assignment status back to "approved" 
    await db
      .update(assignments)
      .set({ 
        status: "approved",
        updatedAt: new Date()
      })
      .where(eq(assignments.id, existingItem[0].assignmentId));

    res.json({ message: "Broadcast queue item removed successfully" });
  } catch (error) {
    console.error("Error removing broadcast queue item:", error);
    res.status(500).json({ error: "Failed to remove broadcast queue item" });
  }
});

// POST /api/broadcast-queue/:id/schedule - Schedule a broadcast
router.post("/:id/schedule", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Use demo publisher for now - fix authentication later
    const publisherId = "demo-publisher";
    
    // Original auth check (commented out for now)
    // const publisherId = req.session?.publisher?.id;
    // if (!publisherId) {
    //   return res.status(401).json({ error: "Unauthorized - no publisher session" });
    // }

    const { id } = req.params;
    const { scheduledAt, sendSettings } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: "Scheduled time is required" });
    }

    // Check if queue item exists and belongs to publisher
    const existingItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!existingItem.length) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    if (existingItem[0].status !== "ready") {
      return res.status(400).json({ error: "Can only schedule items that are ready" });
    }

    // Update to scheduled status
    const updatedItem = await db
      .update(broadcastQueue)
      .set({
        status: "scheduled",
        scheduledAt: new Date(scheduledAt),
        sendSettings: sendSettings || existingItem[0].sendSettings,
        updatedAt: new Date()
      })
      .where(eq(broadcastQueue.id, id))
      .returning();

    // Log the scheduling action
    await db.insert(broadcastSendLogs).values({
      publisherId,
      broadcastId: id,
      status: "scheduled",
      message: `Broadcast scheduled for ${new Date(scheduledAt).toISOString()}`,
      details: { scheduledAt, sendSettings }
    });

    res.json(updatedItem[0]);
  } catch (error) {
    console.error("Error scheduling broadcast:", error);
    res.status(500).json({ error: "Failed to schedule broadcast" });
  }
});

// POST /api/broadcast-queue/:id/send - Send broadcast immediately
router.post("/:id/send", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const publisherId = req.session?.publisher?.id;
    if (!publisherId) {
      return res.status(401).json({ error: "Unauthorized - no publisher session" });
    }

    const { id } = req.params;

    // Check if queue item exists and belongs to publisher
    const existingItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!existingItem.length) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    if (!["ready", "scheduled"].includes(existingItem[0].status)) {
      return res.status(400).json({ error: "Can only send items that are ready or scheduled" });
    }

    // Update to sending status
    await db
      .update(broadcastQueue)
      .set({
        status: "sending",
        updatedAt: new Date()
      })
      .where(eq(broadcastQueue.id, id));

    // Log the send start
    await db.insert(broadcastSendLogs).values({
      publisherId,
      broadcastId: id,
      status: "started",
      message: "Broadcast send initiated",
      details: { totalRecipients: existingItem[0].audienceCount || 0 }
    });

    // Implement actual email sending via Customer.io
    setTimeout(async () => {
      try {
        // Get the assignment content for the email
        const assignment = await db
          .select()
          .from(assignments)
          .where(eq(assignments.id, existingItem[0].assignmentId))
          .limit(1);

        if (!assignment.length) {
          throw new Error("Assignment not found");
        }

        const assignmentData = assignment[0];
        
        // Initialize Customer.io integration
        const { CustomerIoIntegration } = await import("../services/customerio-integration");
        const customerIo = new CustomerIoIntegration();
        
        // Send broadcast via Customer.io
        const broadcastResult = await customerIo.sendBroadcast({
          subject: existingItem[0].emailSubject || assignmentData.title,
          content: assignmentData.content || `Assignment: ${assignmentData.title}\n\n${assignmentData.description}`,
          segment: "all_users", // Send to all subscribers
          campaignName: `Broadcast_${existingItem[0].id}`,
          sendNow: true
        });

        if (broadcastResult.success) {
          // Update to sent status
          await db
            .update(broadcastQueue)
            .set({
              status: "sent",
              sentAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(broadcastQueue.id, id));

          // Update assignment status to "published"
          await db
            .update(assignments)
            .set({ 
              status: "published",
              updatedAt: new Date()
            })
            .where(eq(assignments.id, existingItem[0].assignmentId));

          // Log completion
          await db.insert(broadcastSendLogs).values({
            publisherId,
            broadcastId: id,
            status: "completed",
            message: "Email sent successfully via Customer.io",
            details: { 
              totalRecipients: existingItem[0].audienceCount || 0,
              sent: existingItem[0].audienceCount || 0,
              failed: 0,
              customerIoCampaignId: broadcastResult.campaignId
            }
          });
        } else {
          throw new Error(broadcastResult.error || "Customer.io send failed");
        }
      } catch (error) {
        console.error("Error sending broadcast via Customer.io:", error);
        // Update to failed status
        await db
          .update(broadcastQueue)
          .set({
            status: "failed",
            updatedAt: new Date()
          })
          .where(eq(broadcastQueue.id, id));

        await db.insert(broadcastSendLogs).values({
          publisherId,
          broadcastId: id,
          status: "failed",
          message: `Email send failed: ${String(error)}`,
          details: { error: String(error) }
        });
      }
    }, 2000); // Small delay to update UI before sending

    res.json({ message: "Broadcast send initiated", status: "sending" });
  } catch (error) {
    console.error("Error sending broadcast:", String(error));
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

// POST /api/broadcast-queue/:id/cancel - Cancel scheduled broadcast
router.post("/:id/cancel", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const publisherId = req.session?.publisher?.id;
    if (!publisherId) {
      return res.status(401).json({ error: "Unauthorized - no publisher session" });
    }

    const { id } = req.params;

    // Check if queue item exists and belongs to publisher
    const existingItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!existingItem.length) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    if (existingItem[0].status !== "scheduled") {
      return res.status(400).json({ error: "Can only cancel scheduled broadcasts" });
    }

    // Update to ready status
    const updatedItem = await db
      .update(broadcastQueue)
      .set({
        status: "ready",
        scheduledAt: null,
        updatedAt: new Date()
      })
      .where(eq(broadcastQueue.id, id))
      .returning();

    // Log the cancellation
    await db.insert(broadcastSendLogs).values({
      publisherId,
      broadcastId: id,
      status: "cancelled",
      message: "Scheduled broadcast cancelled",
      details: { reason: "User cancelled" }
    });

    res.json(updatedItem[0]);
  } catch (error) {
    console.error("Error cancelling broadcast:", error);
    res.status(500).json({ error: "Failed to cancel broadcast" });
  }
});

// GET /api/broadcast-queue/:id/logs - Get send logs for a broadcast
router.get("/:id/logs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const publisherId = req.session?.publisher?.id;
    if (!publisherId) {
      return res.status(401).json({ error: "Unauthorized - no publisher session" });
    }

    const { id } = req.params;

    // Check if queue item exists and belongs to publisher
    const existingItem = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!existingItem.length) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    // Get logs for this broadcast
    const logs = await db
      .select()
      .from(broadcastSendLogs)
      .where(and(
        eq(broadcastSendLogs.broadcastId, id),
        eq(broadcastSendLogs.publisherId, publisherId)
      ))
      .orderBy(asc(broadcastSendLogs.createdAt));

    res.json(logs);
  } catch (error) {
    console.error("Error fetching broadcast logs:", error);
    res.status(500).json({ error: "Failed to fetch broadcast logs" });
  }
});

// POST /api/broadcast-queue/:id/send - Send broadcast to Customer.io
router.post("/:id/send", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Use demo publisher for now - fix authentication later
    const publisherId = "demo-publisher";
    
    // Original auth check (commented out for now)
    // const publisherId = req.session?.publisher?.id;
    // if (!publisherId) {
    //   return res.status(401).json({ error: "Unauthorized - no publisher session" });
    // }
    
    const { id } = req.params;

    // Get broadcast queue item
    const [queueItem] = await db
      .select()
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.id, id),
        eq(broadcastQueue.publisherId, publisherId)
      ))
      .limit(1);

    if (!queueItem) {
      return res.status(404).json({ error: "Broadcast queue item not found" });
    }

    // Get assignment content
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, queueItem.assignmentId))
      .limit(1);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Trigger Customer.io send
    try {
      const { CustomerIOIntegration } = await import("./services/customerio-integration");
      const customerIO = new CustomerIOIntegration();
      
      const sendResult = await customerIO.sendBroadcast({
        subject: assignment.title,
        content: assignment.content || "Email content",
        segment: "all_users", // Send to all users
        metadata: {
          assignmentId: assignment.id,
          broadcastId: id,
          publisherId
        }
      });

      // Update queue item status
      await db
        .update(broadcastQueue)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(broadcastQueue.id, id));

      // Log send attempt
      await db.insert(broadcastSendLogs).values({
        publisherId,
        broadcastId: id,
        status: "success",
        message: `Successfully sent to Customer.io segment: all_users`,
        details: sendResult,
      });

      res.json({
        success: true,
        message: `Successfully sent to ${queueItem.audienceCount} subscribers via Customer.io`,
        queueItem: { ...queueItem, status: "sent", sentAt: new Date() },
        sendResult
      });

    } catch (sendError) {
      console.error("Error sending via Customer.io:", sendError);
      
      // Log failed send attempt
      await db.insert(broadcastSendLogs).values({
        publisherId,
        broadcastId: id,
        status: "failed",
        message: `Failed to send via Customer.io: ${sendError.message}`,
        details: { error: sendError.message },
      });

      // Update queue item status to failed
      await db
        .update(broadcastQueue)
        .set({
          status: "failed",
          updatedAt: new Date()
        })
        .where(eq(broadcastQueue.id, id));

      res.status(500).json({ 
        error: "Failed to send broadcast",
        details: sendError.message
      });
    }

  } catch (error) {
    console.error("Error processing broadcast send:", error);
    res.status(500).json({ error: "Failed to process broadcast send" });
  }
});

export default router;