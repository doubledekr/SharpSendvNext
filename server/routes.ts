import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertCampaignSchema, insertABTestSchema, insertEmailIntegrationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getLatestAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Subscribers endpoints
  app.get("/api/subscribers", async (req, res) => {
    try {
      const subscribers = await storage.getSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.get("/api/subscribers/:id", async (req, res) => {
    try {
      const subscriber = await storage.getSubscriber(req.params.id);
      if (!subscriber) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.json(subscriber);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriber" });
    }
  });

  app.post("/api/subscribers", async (req, res) => {
    try {
      const validatedData = insertSubscriberSchema.parse(req.body);
      const subscriber = await storage.createSubscriber(validatedData);
      res.status(201).json(subscriber);
    } catch (error) {
      res.status(400).json({ error: "Invalid subscriber data" });
    }
  });

  app.put("/api/subscribers/:id", async (req, res) => {
    try {
      const updates = req.body;
      const subscriber = await storage.updateSubscriber(req.params.id, updates);
      if (!subscriber) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.json(subscriber);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscriber" });
    }
  });

  app.delete("/api/subscribers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSubscriber(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subscriber" });
    }
  });

  // Campaigns endpoints
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ error: "Invalid campaign data" });
    }
  });

  // A/B Testing endpoints
  app.get("/api/ab-tests", async (req, res) => {
    try {
      const abTests = await storage.getABTests();
      res.json(abTests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch A/B tests" });
    }
  });

  app.post("/api/ab-tests", async (req, res) => {
    try {
      const validatedData = insertABTestSchema.parse(req.body);
      const abTest = await storage.createABTest(validatedData);
      res.status(201).json(abTest);
    } catch (error) {
      res.status(400).json({ error: "Invalid A/B test data" });
    }
  });

  app.put("/api/ab-tests/:id", async (req, res) => {
    try {
      const updates = req.body;
      const abTest = await storage.updateABTest(req.params.id, updates);
      if (!abTest) {
        return res.status(404).json({ error: "A/B test not found" });
      }
      res.json(abTest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update A/B test" });
    }
  });

  // Email Integration endpoints
  app.get("/api/email-integrations", async (req, res) => {
    try {
      const integrations = await storage.getEmailIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email integrations" });
    }
  });

  app.post("/api/email-integrations", async (req, res) => {
    try {
      const validatedData = insertEmailIntegrationSchema.parse(req.body);
      const integration = await storage.createEmailIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: "Invalid email integration data" });
    }
  });

  app.put("/api/email-integrations/:id", async (req, res) => {
    try {
      const updates = req.body;
      const integration = await storage.updateEmailIntegration(req.params.id, updates);
      if (!integration) {
        return res.status(404).json({ error: "Email integration not found" });
      }
      res.json(integration);
    } catch (error) {
      res.status(500).json({ error: "Failed to update email integration" });
    }
  });

  // Personalization endpoints
  app.post("/api/personalize/subject-line", async (req, res) => {
    try {
      const { baseSubjectLine, segment } = req.body;
      
      if (!baseSubjectLine || !segment) {
        return res.status(400).json({ error: "Base subject line and segment are required" });
      }

      // In a real implementation, this would call OpenAI API
      const personalizedVariants = [
        {
          segment: "High-Value Investor",
          subjectLine: `Exclusive Market Intelligence: ${baseSubjectLine}`,
          predictedImprovement: 42
        },
        {
          segment: "Day Trader",
          subjectLine: `🚨 URGENT: ${baseSubjectLine} + Quick Profit Opportunities`,
          predictedImprovement: 38
        },
        {
          segment: "Long-term Investor",
          subjectLine: `Strategic Insight: ${baseSubjectLine} - Portfolio Impact`,
          predictedImprovement: 35
        }
      ];

      const variant = personalizedVariants.find(v => v.segment === segment) || personalizedVariants[0];
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate personalized subject line" });
    }
  });

  app.post("/api/personalize/content", async (req, res) => {
    try {
      const { content, segment } = req.body;
      
      if (!content || !segment) {
        return res.status(400).json({ error: "Content and segment are required" });
      }

      // In a real implementation, this would call OpenAI API
      const personalizedContent = {
        originalContent: content,
        personalizedContent: `[Personalized for ${segment}] ${content}\n\nThis analysis is specifically tailored for ${segment.toLowerCase()}s based on your investment profile and preferences.`,
        improvements: [
          "Added segment-specific context",
          "Included personalized investment recommendations",
          "Optimized tone for target audience"
        ]
      };

      res.json(personalizedContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to personalize content" });
    }
  });

  // Revenue Impact endpoints
  app.post("/api/revenue/calculate", async (req, res) => {
    try {
      const { subscriberCount, arpu, currentEngagement } = req.body;
      
      const currentMonthlyRevenue = subscriberCount * arpu;
      const currentAnnualRevenue = currentMonthlyRevenue * 12;
      
      // Porter & Co scenario calculations
      const engagementImprovement = 0.44; // 44% improvement
      const churnReduction = 0.185; // 18.5% reduction
      const premiumPricing = 0.15; // 15% pricing uplift
      
      const improvedEngagement = currentEngagement * (1 + engagementImprovement);
      const improvedRevenue = currentAnnualRevenue * (1 + engagementImprovement + premiumPricing);
      const revenuelift = improvedRevenue - currentAnnualRevenue;
      
      const platformCost = 47964; // Annual platform cost
      const netROI = ((revenuelift - platformCost) / platformCost) * 100;

      res.json({
        currentAnnualRevenue,
        projectedAnnualRevenue: improvedRevenue,
        revenueLift: revenuelift,
        platformCost,
        netROI,
        engagementImprovement: engagementImprovement * 100,
        churnReduction: churnReduction * 100,
        premiumPricingUplift: premiumPricing * 100
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate revenue impact" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
