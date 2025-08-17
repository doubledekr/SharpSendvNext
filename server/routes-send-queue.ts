import { Express, Request, Response } from "express";
import { db } from "./db";
import { emailSendQueue, insertEmailSendQueueSchema } from "../shared/schema-multitenant";
import { eq, and, lte, asc, desc } from "drizzle-orm";
import { openAIService } from "./services/openai-service";
import { MarketIntelligenceService } from "./services/market-intelligence";

const marketIntelligence = new MarketIntelligenceService();

export function registerSendQueueRoutes(app: Express) {
  // Get send queue items
  app.get("/api/send-queue", async (req: Request, res: Response) => {
    try {
      const { status = "all", limit = 50 } = req.query;
      
      let query = db.select().from(emailSendQueue);
      
      if (status !== "all") {
        query = query.where(eq(emailSendQueue.status, status as string));
      }
      
      const items = await query
        .orderBy(desc(emailSendQueue.priority), asc(emailSendQueue.scheduledFor))
        .limit(Number(limit));
      
      res.json({ data: items });
    } catch (error) {
      console.error("Error fetching send queue:", error);
      res.status(500).json({ error: "Failed to fetch send queue" });
    }
  });

  // Add item to send queue
  app.post("/api/send-queue", async (req: Request, res: Response) => {
    try {
      const data = insertEmailSendQueueSchema.parse(req.body);
      
      const [item] = await db.insert(emailSendQueue)
        .values([data])
        .returning();
      
      res.json({ data: item });
    } catch (error) {
      console.error("Error adding to send queue:", error);
      res.status(500).json({ error: "Failed to add to send queue" });
    }
  });

  // Generate and schedule AI content
  app.post("/api/send-queue/generate", async (req: Request, res: Response) => {
    try {
      const {
        subscriberSegment,
        contentType,
        scheduledFor,
        recipients,
        tone = "professional",
        length = "medium",
        campaignId,
        priority = 0
      } = req.body;

      // Get market context
      const marketContext = await marketIntelligence.getMarketContext();

      // Generate content with OpenAI
      const generatedContent = await openAIService.generateEmailContent({
        subscriberSegment,
        marketContext,
        contentType,
        tone,
        length
      });

      // Add to send queue for each recipient
      const queueItems = [];
      for (const recipient of recipients) {
        const [item] = await db.insert(emailSendQueue)
          .values({
            publisherId: "demo-publisher",
            campaignId,
            emailType: contentType,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject: generatedContent.subject,
            content: generatedContent.content,
            scheduledFor: new Date(scheduledFor),
            status: "pending",
            priority,
            metadata: {
              cohort: subscriberSegment,
              personalizationData: {
                previewText: generatedContent.previewText,
                tone,
                length
              },
              trackingEnabled: true
            }
          })
          .returning();
        
        queueItems.push(item);
      }

      res.json({ 
        data: {
          generated: generatedContent,
          queuedCount: queueItems.length,
          items: queueItems
        }
      });
    } catch (error) {
      console.error("Error generating and scheduling content:", error);
      res.status(500).json({ error: "Failed to generate and schedule content" });
    }
  });

  // Process send queue (would be called by a cron job in production)
  app.post("/api/send-queue/process", async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      // Get pending items that are due
      const items = await db.select()
        .from(emailSendQueue)
        .where(
          and(
            eq(emailSendQueue.status, "pending"),
            lte(emailSendQueue.scheduledFor, now)
          )
        )
        .orderBy(desc(emailSendQueue.priority), asc(emailSendQueue.scheduledFor))
        .limit(10);

      const processed = [];
      
      for (const item of items) {
        try {
          // Update status to sending
          await db.update(emailSendQueue)
            .set({ 
              status: "sending",
              lastAttempt: now
            })
            .where(eq(emailSendQueue.id, item.id));

          // Here you would integrate with actual email service
          // For now, just mark as sent after a brief delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Mark as sent
          await db.update(emailSendQueue)
            .set({ 
              status: "sent",
              sentAt: now
            })
            .where(eq(emailSendQueue.id, item.id));

          processed.push(item.id);
        } catch (error) {
          // Mark as failed and increment retry count
          await db.update(emailSendQueue)
            .set({ 
              status: "failed",
              retryCount: (item.retryCount || 0) + 1,
              error: String(error)
            })
            .where(eq(emailSendQueue.id, item.id));
        }
      }

      res.json({ 
        data: {
          processedCount: processed.length,
          processedIds: processed
        }
      });
    } catch (error) {
      console.error("Error processing send queue:", error);
      res.status(500).json({ error: "Failed to process send queue" });
    }
  });

  // Cancel scheduled email
  app.patch("/api/send-queue/:id/cancel", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [updated] = await db.update(emailSendQueue)
        .set({ 
          status: "cancelled",
          updatedAt: new Date()
        })
        .where(eq(emailSendQueue.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Queue item not found" });
      }
      
      res.json({ data: updated });
    } catch (error) {
      console.error("Error cancelling queue item:", error);
      res.status(500).json({ error: "Failed to cancel queue item" });
    }
  });

  // Generate A/B test variations with OpenAI
  app.post("/api/send-queue/ab-test", async (req: Request, res: Response) => {
    try {
      const {
        baseContent,
        testType,
        audience,
        scheduledFor,
        recipients
      } = req.body;

      // Generate variations with OpenAI
      const variations = await openAIService.generateABTestVariations({
        baseContent,
        testType,
        audience
      });

      // Split recipients for A/B test
      const halfIndex = Math.floor(recipients.length / 2);
      const groupA = recipients.slice(0, halfIndex);
      const groupB = recipients.slice(halfIndex);

      // Queue emails for both groups
      const queueItems = [];
      
      // Group A
      for (const recipient of groupA) {
        const [item] = await db.insert(emailSendQueue)
          .values({
            publisherId: "demo-publisher",
            emailType: "ab-test",
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject: variations.variantA.subject || baseContent.subject,
            content: variations.variantA.content || baseContent.content,
            scheduledFor: new Date(scheduledFor),
            status: "pending",
            metadata: {
              abTest: {
                variant: "A",
                strategy: variations.variantA.strategy,
                testType
              }
            }
          })
          .returning();
        queueItems.push(item);
      }

      // Group B
      for (const recipient of groupB) {
        const [item] = await db.insert(emailSendQueue)
          .values({
            publisherId: "demo-publisher",
            emailType: "ab-test",
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject: variations.variantB.subject || baseContent.subject,
            content: variations.variantB.content || baseContent.content,
            scheduledFor: new Date(scheduledFor),
            status: "pending",
            metadata: {
              abTest: {
                variant: "B",
                strategy: variations.variantB.strategy,
                testType
              }
            }
          })
          .returning();
        queueItems.push(item);
      }

      res.json({ 
        data: {
          variations,
          queuedCount: queueItems.length,
          groupASsize: groupA.length,
          groupBSize: groupB.length
        }
      });
    } catch (error) {
      console.error("Error creating A/B test:", error);
      res.status(500).json({ error: "Failed to create A/B test" });
    }
  });
}