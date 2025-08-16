import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerMultiTenantRoutes } from "./routes-multitenant";
import { registerIntegrationRoutes } from "./routes-integrations";
import { registerEmailRoutes } from "./routes-email";
import { aiProcessingRoutes } from "./routes-ai-processing";
import { cohortPersonalizationRoutes } from "./routes-cohort-personalization";
import { emailOptimizationRoutes } from "./routes-email-optimization";
import { brevoIntegrationRoutes } from "./routes-brevo-integration";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      features: {
        multiTenant: true,
        aiPersonalization: true,
        integrations: true,
        emailSending: true,
        marketIntelligence: true,
        cohortPersonalization: true,
        emailOptimization: true,
        brevoIntegration: true
      }
    });
  });

  // Register all route modules
  registerMultiTenantRoutes(app);
  registerIntegrationRoutes(app);
  registerEmailRoutes(app);
  app.use("/api/ai", aiProcessingRoutes);
  app.use("/api/cohorts", cohortPersonalizationRoutes);
  app.use("/api/email-optimization", emailOptimizationRoutes);
  app.use("/api/brevo", brevoIntegrationRoutes);

  // Legacy routes for backward compatibility (these will be deprecated)
  
  // Simple analytics endpoint for demo purposes
  app.get("/api/analytics", async (req, res) => {
    try {
      // Return sample analytics data for demo
      const analytics = {
        totalSubscribers: 8,
        engagementRate: "71.2",
        churnRate: "2.1",
        monthlyRevenue: "465.00",
        revenueGrowth: "15.3",
        openRate: "68.5",
        clickRate: "12.3",
        unsubscribeRate: "0.8",
        date: new Date().toISOString(),
      };
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Legacy personalization endpoints for demo
  app.post("/api/personalize/subject-line", async (req, res) => {
    try {
      const { baseSubjectLine, segment } = req.body;
      
      if (!baseSubjectLine || !segment) {
        return res.status(400).json({ error: "Base subject line and segment are required" });
      }

      const personalizedVariants = [
        {
          segment: "High-Value Investor",
          subjectLine: `🚀 Exclusive: ${baseSubjectLine}`,
          predictedImprovement: 42
        },
        {
          segment: "Day Trader",
          subjectLine: `⚡ URGENT: ${baseSubjectLine}`,
          predictedImprovement: 38
        },
        {
          segment: "Long-term Investor",
          subjectLine: `📈 Strategic: ${baseSubjectLine}`,
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

  // Revenue calculation endpoint
  app.post("/api/revenue/calculate", async (req, res) => {
    try {
      const { subscriberCount, arpu, currentEngagement } = req.body;
      
      const currentMonthlyRevenue = subscriberCount * arpu;
      const currentAnnualRevenue = currentMonthlyRevenue * 12;
      
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

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(status).json({ 
      error: message,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
