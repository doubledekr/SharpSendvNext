import { Router } from "express";
import { db } from "./db";
import { 
  assignments, 
  drafts, 
  sendQueue,
  pixelTracking,
  emailMetrics,
  type InsertAssignment,
  type InsertDraft,
  type InsertSendQueueItem,
  type InsertPixelTracking
} from "@shared/schema-multitenant";
import { eq, and, desc, gte } from "drizzle-orm";
import { requireTenant } from "./middleware/tenant";
import { randomUUID } from "crypto";

const router = Router();

// ============= Assignment Routes =============

// Create a new assignment
router.post("/api/assignments", requireTenant, async (req: any, res) => {
  try {
    const publisherId = req.tenant?.publisherId;
    const assignmentData = {
      ...req.body,
      id: randomUUID(),
      publisherId,
      assignmentLink: `${req.protocol}://${req.get('host')}/assignment-copywriter/${randomUUID()}`,
      status: "assigned",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [assignment] = await db.insert(assignments)
      .values(assignmentData)
      .returning();

    res.json({
      success: true,
      assignment,
      copywriterLink: assignmentData.assignmentLink
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Get assignment by ID
router.get("/api/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [assignment] = await db.select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// Get all assignments for tenant
router.get("/api/assignments", requireTenant, async (req: any, res) => {
  try {
    const publisherId = req.tenant?.publisherId;
    
    const allAssignments = await db.select()
      .from(assignments)
      .where(eq(assignments.publisherId, publisherId))
      .orderBy(desc(assignments.createdAt));

    res.json({
      assignments: allAssignments,
      total: allAssignments.length
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// ============= Draft Routes =============

// Save draft from copywriter
router.post("/api/drafts", async (req, res) => {
  try {
    const draftData = {
      ...req.body,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [draft] = await db.insert(drafts)
      .values(draftData)
      .returning();

    res.json({
      success: true,
      draft
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

// Get drafts for publisher review
router.get("/api/drafts", requireTenant, async (req: any, res) => {
  try {
    const publisherId = req.tenant?.publisherId;
    const { status } = req.query;
    
    let conditions = [eq(drafts.publisherId, publisherId)];
    
    if (status) {
      conditions.push(eq(drafts.status, status as string));
    }

    const allDrafts = await db.select()
      .from(drafts)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(drafts.createdAt));

    res.json({
      drafts: allDrafts,
      total: allDrafts.length
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ error: "Failed to fetch drafts" });
  }
});

// Approve/reject draft
router.patch("/api/drafts/:id", requireTenant, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    const publisherId = req.tenant?.publisherId;

    const [updatedDraft] = await db.update(drafts)
      .set({ 
        status, 
        feedback,
        updatedAt: new Date()
      })
      .where(and(
        eq(drafts.id, id),
        eq(drafts.publisherId, publisherId)
      ))
      .returning();

    if (!updatedDraft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    res.json({
      success: true,
      draft: updatedDraft
    });
  } catch (error) {
    console.error("Error updating draft:", error);
    res.status(500).json({ error: "Failed to update draft" });
  }
});

// ============= Send Queue Routes =============

// Add campaigns to send queue with unique pixels
router.post("/api/send-queue", async (req, res) => {
  try {
    const { assignmentId, publisherId, campaigns } = req.body;
    
    const queueItems = await Promise.all(campaigns.map(async (campaign: any) => {
      // Generate unique pixel for each email campaign
      const pixelId = `px-${randomUUID()}`;
      
      // Create pixel tracking record
      const [pixel] = await db.insert(pixelTracking)
        .values({
          id: pixelId,
          publisherId,
          campaignId: campaign.segmentId,
          segmentName: campaign.segmentName,
          recipientCount: campaign.recipients,
          trackingUrl: `/api/pixel/${pixelId}.gif`,
          createdAt: new Date()
        })
        .returning();
      
      // Add to send queue
      const queueItem = {
        id: randomUUID(),
        publisherId,
        assignmentId,
        segmentId: campaign.segmentId,
        segmentName: campaign.segmentName,
        subject: campaign.subject,
        content: campaign.content,
        recipients: campaign.recipients,
        pixelId,
        platform: campaign.platform || 'mailchimp',
        scheduledTime: new Date(campaign.scheduledTime || Date.now()),
        status: 'queued' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [item] = await db.insert(sendQueue)
        .values(queueItem)
        .returning();
      
      return item;
    }));

    res.json({
      success: true,
      queuedItems: queueItems.length,
      items: queueItems
    });
  } catch (error) {
    console.error("Error adding to send queue:", error);
    res.status(500).json({ error: "Failed to add to send queue" });
  }
});

// Get send queue items
router.get("/api/send-queue", requireTenant, async (req: any, res) => {
  try {
    const publisherId = req.tenant?.publisherId;
    const { status } = req.query;
    
    let conditions = [eq(sendQueue.publisherId, publisherId)];
    
    if (status) {
      conditions.push(eq(sendQueue.status, status as any));
    }

    const items = await db.select()
      .from(sendQueue)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(sendQueue.scheduledTime));

    res.json({
      queue: items,
      total: items.length,
      pending: items.filter(i => i.status === 'queued').length,
      sent: items.filter(i => i.status === 'sent').length
    });
  } catch (error) {
    console.error("Error fetching send queue:", error);
    res.status(500).json({ error: "Failed to fetch send queue" });
  }
});

// Process send queue (send via email platform)
router.post("/api/send-queue/process", requireTenant, async (req: any, res) => {
  try {
    const publisherId = req.tenant?.publisherId;
    
    // Get queued items ready to send
    const itemsToSend = await db.select()
      .from(sendQueue)
      .where(and(
        eq(sendQueue.publisherId, publisherId),
        eq(sendQueue.status, 'queued'),
        gte(sendQueue.scheduledTime, new Date())
      ))
      .limit(10); // Process batch of 10
    
    const results = await Promise.all(itemsToSend.map(async (item) => {
      try {
        // Here you would integrate with actual email platform API
        // For demo, simulate sending
        
        // Update status to sending
        await db.update(sendQueue)
          .set({ 
            status: 'sending',
            updatedAt: new Date()
          })
          .where(eq(sendQueue.id, item.id));
        
        // Simulate API call to email platform
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mark as sent
        const [updated] = await db.update(sendQueue)
          .set({ 
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(sendQueue.id, item.id))
          .returning();
        
        // Initialize email metrics
        await db.insert(emailMetrics)
          .values({
            id: randomUUID(),
            publisherId,
            campaignId: item.segmentId!,
            pixelId: item.pixelId!,
            sent: item.recipients || 0,
            delivered: Math.floor((item.recipients || 0) * 0.98),
            opened: 0,
            clicked: 0,
            converted: 0,
            revenue: '0',
            date: new Date()
          });
        
        return { success: true, item: updated };
      } catch (error) {
        console.error(`Failed to send item ${item.id}:`, error);
        
        // Mark as failed
        await db.update(sendQueue)
          .set({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          })
          .where(eq(sendQueue.id, item.id));
        
        return { success: false, item, error };
      }
    }));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      processed: results.length,
      successful,
      failed,
      results
    });
  } catch (error) {
    console.error("Error processing send queue:", error);
    res.status(500).json({ error: "Failed to process send queue" });
  }
});

// ============= Pixel Tracking Routes =============

// Serve tracking pixel
router.get("/api/pixel/:pixelId.gif", async (req, res) => {
  try {
    const { pixelId } = req.params;
    
    // Record the pixel hit
    const [pixel] = await db.select()
      .from(pixelTracking)
      .where(eq(pixelTracking.id, pixelId.replace('.gif', '')))
      .limit(1);
    
    if (pixel) {
      // Update open count
      await db.update(pixelTracking)
        .set({ 
          opens: (pixel.opens || 0) + 1,
          lastOpened: new Date()
        })
        .where(eq(pixelTracking.id, pixel.id));
      
      // Update email metrics
      const [metric] = await db.select()
        .from(emailMetrics)
        .where(eq(emailMetrics.pixelId, pixel.id))
        .limit(1);
      
      if (metric) {
        await db.update(emailMetrics)
          .set({ 
            opened: Math.min((metric.opened || 0) + 1, metric.delivered || 0)
          })
          .where(eq(emailMetrics.id, metric.id));
      }
    }
    
    // Return 1x1 transparent GIF
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Expires': '0'
    });
    res.end(gif);
  } catch (error) {
    console.error("Error serving pixel:", error);
    res.status(404).end();
  }
});

// Get pixel tracking stats
router.get("/api/pixel-stats/:campaignId", requireTenant, async (req: any, res) => {
  try {
    const { campaignId } = req.params;
    const publisherId = req.tenant?.publisherId;
    
    const pixels = await db.select()
      .from(pixelTracking)
      .where(and(
        eq(pixelTracking.publisherId, publisherId),
        eq(pixelTracking.campaignId, campaignId)
      ));
    
    const metrics = await db.select()
      .from(emailMetrics)
      .where(and(
        eq(emailMetrics.publisherId, publisherId),
        eq(emailMetrics.campaignId, campaignId)
      ));
    
    res.json({
      pixels,
      metrics,
      summary: {
        totalSent: metrics.reduce((sum, m) => sum + (m.sent || 0), 0),
        totalOpened: metrics.reduce((sum, m) => sum + (m.opened || 0), 0),
        totalClicked: metrics.reduce((sum, m) => sum + (m.clicked || 0), 0),
        totalRevenue: metrics.reduce((sum, m) => sum + parseFloat(m.revenue || '0'), 0)
      }
    });
  } catch (error) {
    console.error("Error fetching pixel stats:", error);
    res.status(500).json({ error: "Failed to fetch pixel stats" });
  }
});

export default router;