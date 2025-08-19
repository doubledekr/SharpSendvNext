import type { Express } from "express";
import { db } from "./db";
import { campaigns, sends, pixels, publishers } from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export function registerCampaignRoutes(app: Express) {
  // Initialize demo campaigns
  app.post("/api/campaigns/demo-init", async (req, res) => {
    try {
      // Use the actual demo publisher ID from the database
      const [demoPublisher] = await db.select({ id: publishers.id }).from(publishers).where(eq(publishers.subdomain, "demo")).limit(1);
      const publisherId = demoPublisher?.id || "189ce086-e6c1-441e-ba0a-5e9bc2fe314e";
      
      // Create demo campaigns for different email types
      const demoCampaigns = [
        {
          publisherId,
          name: "Q1 Market Updates",
          type: "marketing",
          description: "Quarterly marketing campaign for market insights",
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
        {
          publisherId,
          name: "Weekly Newsletter Series",
          type: "editorial",
          description: "Editorial content for weekly newsletters",
          status: "active",
          startDate: new Date(),
        },
        {
          publisherId,
          name: "Premium Subscriber Content",
          type: "paid_fulfillment",
          description: "Exclusive content for paid subscribers",
          status: "active",
        },
      ];
      
      const createdCampaigns = [];
      for (const campaign of demoCampaigns) {
        const [created] = await db.insert(campaigns).values(campaign).returning();
        createdCampaigns.push(created);
        
        // Create demo sends for each campaign
        const demoSends = [
          {
            publisherId,
            campaignId: created.id,
            name: `${campaign.name} - Send 1`,
            subjectLine: "Market Alert: Key Opportunities This Week",
            content: "Your personalized market insights...",
            status: "suggested",
            pipelineStage: "suggested",
            targetedSegments: ["high-value", "active-traders"],
            pixelAttached: true,
          },
          {
            publisherId,
            campaignId: created.id,
            name: `${campaign.name} - Send 2`,
            subjectLine: "Portfolio Update: Performance Review",
            content: "Check your portfolio performance...",
            status: "draft",
            pipelineStage: "drafts",
            targetedSegments: ["premium"],
            pixelAttached: true,
          },
          {
            publisherId,
            campaignId: created.id,
            name: `${campaign.name} - Send 3`,
            subjectLine: "Breaking: Fed Decision Impact",
            content: "Federal Reserve announcement analysis...",
            status: "approved",
            pipelineStage: "approved",
            targetedSegments: ["all-subscribers"],
            pixelAttached: true,
          },
        ];
        
        for (const send of demoSends) {
          const pixelCode = randomBytes(16).toString("hex");
          const pixelUrl = `https://sharpsend.io/pixel/${pixelCode}`;
          
          const [createdSend] = await db.insert(sends).values(send).returning();
          
          // Create tracking pixel for each send
          await db.insert(pixels).values({
            publisherId,
            sendId: createdSend.id,
            pixelCode,
            pixelUrl,
            totalOpens: Math.floor(Math.random() * 1000),
            uniqueOpens: Math.floor(Math.random() * 500),
            totalClicks: Math.floor(Math.random() * 300),
            uniqueClicks: Math.floor(Math.random() * 150),
            conversions: Math.floor(Math.random() * 50),
            deviceData: {
              desktop: Math.floor(Math.random() * 400),
              mobile: Math.floor(Math.random() * 400),
              tablet: Math.floor(Math.random() * 200),
            },
            fatigueScore: (Math.random() * 100).toFixed(2),
          }).returning();
          
          // Update send with pixel ID
          await db.update(sends)
            .set({ pixelId: createdSend.id })
            .where(eq(sends.id, createdSend.id));
        }
      }
      
      res.json({
        success: true,
        message: `Created ${createdCampaigns.length} demo campaigns with sends and pixels`,
        campaigns: createdCampaigns,
      });
    } catch (error) {
      console.error("Error initializing demo campaigns:", error);
      res.status(500).json({ error: "Failed to initialize demo campaigns" });
    }
  });
  
  // Get all campaigns for a publisher
  app.get("/api/campaigns", async (req, res) => {
    try {
      // Get the demo publisher ID from database
      const [demoPublisher] = await db.select({ id: publishers.id }).from(publishers).where(eq(publishers.subdomain, "demo")).limit(1);
      const publisherId = req.headers["x-publisher-id"] as string || demoPublisher?.id || "189ce086-e6c1-441e-ba0a-5e9bc2fe314e";
      const type = req.query.type as string;
      
      let query = db.select().from(campaigns).where(eq(campaigns.publisherId, publisherId));
      
      if (type) {
        query = db.select().from(campaigns)
          .where(and(
            eq(campaigns.publisherId, publisherId),
            eq(campaigns.type, type)
          ));
      }
      
      const result = await query.orderBy(desc(campaigns.createdAt));
      // Always return an array, even if empty
      res.json(result || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      // Return empty array on error to prevent frontend crash
      res.status(200).json([]);
    }
  });

  // Create a new campaign
  app.post("/api/campaigns", async (req, res) => {
    try {
      const publisherId = req.headers["x-publisher-id"] as string || "demo-publisher";
      const { name, type, description, owner, startDate, endDate } = req.body;
      
      const [campaign] = await db.insert(campaigns).values({
        publisherId,
        name,
        type,
        description,
        owner,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: "active"
      }).returning();
      
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Get sends for a campaign with pipeline view
  app.get("/api/campaigns/:campaignId/sends", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const publisherId = req.headers["x-publisher-id"] as string || "demo-publisher";
      
      const campaignSends = await db.select().from(sends)
        .where(and(
          eq(sends.campaignId, campaignId),
          eq(sends.publisherId, publisherId)
        ))
        .orderBy(desc(sends.createdAt));
      
      // Group sends by pipeline stage
      const pipeline = {
        suggested: campaignSends.filter(s => s.pipelineStage === "suggested"),
        drafts: campaignSends.filter(s => s.pipelineStage === "drafts"),
        approved: campaignSends.filter(s => s.pipelineStage === "approved"),
        scheduled: campaignSends.filter(s => s.pipelineStage === "scheduled"),
        sent: campaignSends.filter(s => s.pipelineStage === "sent")
      };
      
      res.json({ sends: campaignSends, pipeline });
    } catch (error) {
      console.error("Error fetching sends:", error);
      res.status(500).json({ error: "Failed to fetch sends" });
    }
  });

  // Create a new send within a campaign
  app.post("/api/campaigns/:campaignId/sends", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const publisherId = req.headers["x-publisher-id"] as string || "demo-publisher";
      const { name, subjectLine, content, targetedSegments, assignedTo, scheduledAt } = req.body;
      
      // Generate unique pixel for this send
      const pixelCode = randomBytes(16).toString("hex");
      const pixelUrl = `https://${req.hostname}/pixel/${pixelCode}`;
      
      // Create the send
      const [send] = await db.insert(sends).values({
        publisherId,
        campaignId,
        name,
        subjectLine,
        content,
        targetedSegments,
        assignedTo,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: "draft",
        pipelineStage: "drafts",
        pixelAttached: true
      }).returning();
      
      // Create the tracking pixel
      const [pixel] = await db.insert(pixels).values({
        publisherId,
        sendId: send.id,
        pixelCode,
        pixelUrl
      }).returning();
      
      // Update send with pixel ID
      await db.update(sends)
        .set({ pixelId: pixel.id })
        .where(eq(sends.id, send.id));
      
      res.json({ ...send, pixel });
    } catch (error) {
      console.error("Error creating send:", error);
      res.status(500).json({ error: "Failed to create send" });
    }
  });

  // Update send pipeline stage
  app.patch("/api/sends/:sendId/pipeline", async (req, res) => {
    try {
      const { sendId } = req.params;
      const { pipelineStage } = req.body;
      
      const [updated] = await db.update(sends)
        .set({ 
          pipelineStage,
          status: pipelineStage === "sent" ? "sent" : pipelineStage
        })
        .where(eq(sends.id, sendId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating send pipeline:", error);
      res.status(500).json({ error: "Failed to update send" });
    }
  });

  // Get pixel performance data
  app.get("/api/pixels/:pixelId", async (req, res) => {
    try {
      const { pixelId } = req.params;
      
      const [pixel] = await db.select().from(pixels)
        .where(eq(pixels.id, pixelId));
      
      if (!pixel) {
        return res.status(404).json({ error: "Pixel not found" });
      }
      
      res.json(pixel);
    } catch (error) {
      console.error("Error fetching pixel:", error);
      res.status(500).json({ error: "Failed to fetch pixel data" });
    }
  });

  // Update pixel tracking data (simulated for demo)
  app.post("/api/pixels/:pixelCode/track", async (req, res) => {
    try {
      const { pixelCode } = req.params;
      const { eventType, deviceType, location } = req.body;
      
      const [pixel] = await db.select().from(pixels)
        .where(eq(pixels.pixelCode, pixelCode));
      
      if (!pixel) {
        return res.status(404).json({ error: "Pixel not found" });
      }
      
      // Update tracking data based on event type
      const updates: any = {
        lastActivityAt: new Date()
      };
      
      if (eventType === "open") {
        updates.totalOpens = (pixel.totalOpens || 0) + 1;
        updates.uniqueOpens = (pixel.uniqueOpens || 0) + 1;
      } else if (eventType === "click") {
        updates.totalClicks = (pixel.totalClicks || 0) + 1;
        updates.uniqueClicks = (pixel.uniqueClicks || 0) + 1;
      } else if (eventType === "conversion") {
        updates.conversions = (pixel.conversions || 0) + 1;
      } else if (eventType === "unsubscribe") {
        updates.unsubscribes = (pixel.unsubscribes || 0) + 1;
      }
      
      // Update device data
      if (deviceType && pixel.deviceData) {
        const deviceData = pixel.deviceData as any;
        deviceData[deviceType] = (deviceData[deviceType] || 0) + 1;
        updates.deviceData = deviceData;
      }
      
      // Update location data
      if (location && pixel.locationData) {
        const locationData = pixel.locationData as any;
        locationData[location] = (locationData[location] || 0) + 1;
        updates.locationData = locationData;
      }
      
      await db.update(pixels)
        .set(updates)
        .where(eq(pixels.id, pixel.id));
      
      // Also update the send's performance metrics
      const [send] = await db.select().from(sends).where(eq(sends.id, pixel.sendId));
      if (send) {
        const updates: any = {};
        if (eventType === "open") {
          updates.openCount = (send.openCount || 0) + 1;
        } else if (eventType === "click") {
          updates.clickCount = (send.clickCount || 0) + 1;
        } else if (eventType === "conversion") {
          updates.conversionCount = (send.conversionCount || 0) + 1;
        } else if (eventType === "unsubscribe") {
          updates.unsubscribeCount = (send.unsubscribeCount || 0) + 1;
        }
        
        if (Object.keys(updates).length > 0) {
          await db.update(sends)
            .set(updates)
            .where(eq(sends.id, pixel.sendId));
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking pixel event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // Get pixel dashboard data (aggregated performance)
  app.get("/api/pixels/dashboard", async (req, res) => {
    try {
      // First try to get the publisher ID from the request context
      let publisherId = req.headers["x-publisher-id"] as string;
      
      // If no publisher ID in headers, try to get demo publisher
      if (!publisherId) {
        const [demoPublisher] = await db.select({ id: publishers.id })
          .from(publishers)
          .where(eq(publishers.subdomain, "demo"))
          .limit(1);
        
        publisherId = demoPublisher?.id;
      }
      
      // If still no publisher ID, return empty data
      if (!publisherId) {
        return res.json({
          pixels: [],
          aggregates: {
            totalOpens: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalUnsubscribes: 0,
            avgOpenRate: 0,
            conversionRate: 0
          },
          fatigueAlerts: []
        });
      }
      
      const pixelData = await db.select().from(pixels)
        .where(eq(pixels.publisherId, publisherId))
        .orderBy(desc(pixels.lastActivityAt));
      
      // Calculate aggregate metrics
      const totalOpens = pixelData.reduce((sum, p) => sum + (p.totalOpens || 0), 0);
      const totalClicks = pixelData.reduce((sum, p) => sum + (p.totalClicks || 0), 0);
      const totalConversions = pixelData.reduce((sum, p) => sum + (p.conversions || 0), 0);
      const totalUnsubscribes = pixelData.reduce((sum, p) => sum + (p.unsubscribes || 0), 0);
      
      // Identify fatigue alerts
      const fatigueAlerts = pixelData
        .filter(p => p.fatigueScore && parseFloat(p.fatigueScore) > 70)
        .map(p => ({
          pixelId: p.id,
          sendId: p.sendId,
          fatigueScore: p.fatigueScore,
          alerts: p.fatigueAlerts
        }));
      
      res.json({
        pixels: pixelData,
        aggregates: {
          totalOpens,
          totalClicks,
          totalConversions,
          totalUnsubscribes,
          avgOpenRate: totalOpens > 0 ? (totalClicks / totalOpens * 100).toFixed(2) : 0,
          conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0
        },
        fatigueAlerts
      });
    } catch (error) {
      console.error("Error fetching pixel dashboard:", error);
      res.status(500).json({ error: "Failed to fetch pixel dashboard" });
    }
  });
}