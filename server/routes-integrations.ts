import type { Express } from "express";
import { 
  authenticateAndSetTenant,
  requireTenant,
  requireRole,
  logTenantOperation,
  type AuthenticatedRequest,
} from "./middleware/tenant";
import { tenantStorage } from "./storage-multitenant";
import { openaiService } from "./services/openai";
import { salesforceService } from "./services/salesforce";
import { exactTargetService } from "./services/exacttarget";

export function registerIntegrationRoutes(app: Express): void {
  
  // OpenAI / AI Content Generation Routes
  
  app.post("/api/ai/generate-content",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    logTenantOperation("AI_GENERATE_CONTENT"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { contentType, prompt, context, campaignId } = req.body;
        
        if (!contentType || !prompt) {
          return res.status(400).json({ error: "Content type and prompt are required" });
        }

        const result = await openaiService.generateContent({
          publisherId: req.tenant.publisherId,
          campaignId,
          contentType,
          prompt,
          context,
        });

        res.json(result);
      } catch (error) {
        console.error("AI content generation error:", error);
        res.status(500).json({ error: "Failed to generate content" });
      }
    }
  );

  app.post("/api/ai/generate-subject-lines",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { campaignData, count = 3 } = req.body;
        
        if (!campaignData) {
          return res.status(400).json({ error: "Campaign data is required" });
        }

        const subjectLines = await openaiService.generateSubjectLineVariations(
          req.tenant.publisherId,
          campaignData,
          count
        );

        res.json({ subjectLines });
      } catch (error) {
        console.error("Subject line generation error:", error);
        res.status(500).json({ error: "Failed to generate subject lines" });
      }
    }
  );

  app.post("/api/ai/personalize-content",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { subscriberData, baseContent, campaignId } = req.body;
        
        if (!subscriberData || !baseContent) {
          return res.status(400).json({ error: "Subscriber data and base content are required" });
        }

        const personalizedContent = await openaiService.personalizeContent(
          req.tenant.publisherId,
          subscriberData,
          baseContent,
          campaignId
        );

        res.json({ personalizedContent });
      } catch (error) {
        console.error("Content personalization error:", error);
        res.status(500).json({ error: "Failed to personalize content" });
      }
    }
  );

  app.post("/api/ai/generate-newsletter",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { brief, brandVoice, targetAudience } = req.body;
        
        if (!brief) {
          return res.status(400).json({ error: "Content brief is required" });
        }

        const content = await openaiService.generateNewsletterContent(
          req.tenant.publisherId,
          brief,
          brandVoice,
          targetAudience
        );

        res.json({ content });
      } catch (error) {
        console.error("Newsletter generation error:", error);
        res.status(500).json({ error: "Failed to generate newsletter content" });
      }
    }
  );

  app.post("/api/ai/optimize-content",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { content, optimizationGoal = "engagement" } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: "Content is required" });
        }

        const result = await openaiService.optimizeContent(
          req.tenant.publisherId,
          content,
          optimizationGoal
        );

        res.json(result);
      } catch (error) {
        console.error("Content optimization error:", error);
        res.status(500).json({ error: "Failed to optimize content" });
      }
    }
  );

  app.get("/api/ai/content-history",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const history = await openaiService.getAiContentHistory(req.tenant.publisherId, limit);
        res.json(history);
      } catch (error) {
        console.error("AI content history error:", error);
        res.status(500).json({ error: "Failed to get AI content history" });
      }
    }
  );

  // Salesforce Integration Routes
  
  app.post("/api/integrations/salesforce/connect",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const config = req.body;
        
        const { accessToken, instanceUrl } = await salesforceService.authenticate(
          req.tenant.publisherId,
          config
        );

        res.json({ 
          success: true, 
          message: "Successfully connected to Salesforce",
          instanceUrl 
        });
      } catch (error) {
        console.error("Salesforce connection error:", error);
        res.status(500).json({ error: "Failed to connect to Salesforce" });
      }
    }
  );

  app.post("/api/integrations/salesforce/sync-subscribers",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    logTenantOperation("SALESFORCE_SYNC_SUBSCRIBERS"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = await salesforceService.syncSubscribersToSalesforce(req.tenant.publisherId);
        res.json(result);
      } catch (error) {
        console.error("Salesforce subscriber sync error:", error);
        res.status(500).json({ error: "Failed to sync subscribers to Salesforce" });
      }
    }
  );

  app.post("/api/integrations/salesforce/sync-campaign/:campaignId",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { campaignId } = req.params;
        const salesforceCampaignId = await salesforceService.syncCampaignToSalesforce(
          req.tenant.publisherId,
          campaignId
        );
        
        res.json({ 
          success: true, 
          salesforceCampaignId,
          message: "Campaign synced to Salesforce" 
        });
      } catch (error) {
        console.error("Salesforce campaign sync error:", error);
        res.status(500).json({ error: "Failed to sync campaign to Salesforce" });
      }
    }
  );

  app.get("/api/integrations/salesforce/analytics",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const analytics = await salesforceService.getSalesforceAnalytics(req.tenant.publisherId);
        res.json(analytics);
      } catch (error) {
        console.error("Salesforce analytics error:", error);
        res.status(500).json({ error: "Failed to get Salesforce analytics" });
      }
    }
  );

  app.get("/api/integrations/salesforce/test",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const isConnected = await salesforceService.testConnection(req.tenant.publisherId);
        res.json({ connected: isConnected });
      } catch (error) {
        console.error("Salesforce connection test error:", error);
        res.status(500).json({ error: "Failed to test Salesforce connection" });
      }
    }
  );

  // ExactTarget Integration Routes
  
  app.post("/api/integrations/exacttarget/connect",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const config = req.body;
        
        const accessToken = await exactTargetService.authenticate(
          req.tenant.publisherId,
          config
        );

        res.json({ 
          success: true, 
          message: "Successfully connected to ExactTarget/Marketing Cloud" 
        });
      } catch (error) {
        console.error("ExactTarget connection error:", error);
        res.status(500).json({ error: "Failed to connect to ExactTarget" });
      }
    }
  );

  app.post("/api/integrations/exacttarget/sync-subscribers",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    logTenantOperation("EXACTTARGET_SYNC_SUBSCRIBERS"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // First create/update the data extension
        const dataExtensionKey = await exactTargetService.createSubscriberDataExtension(
          req.tenant.publisherId
        );
        
        // Then sync subscribers
        const result = await exactTargetService.syncSubscribersToExactTarget(req.tenant.publisherId);
        
        res.json({ 
          ...result, 
          dataExtensionKey,
          message: "Subscribers synced to ExactTarget" 
        });
      } catch (error) {
        console.error("ExactTarget subscriber sync error:", error);
        res.status(500).json({ error: "Failed to sync subscribers to ExactTarget" });
      }
    }
  );

  app.post("/api/integrations/exacttarget/send-campaign/:campaignId",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { campaignId } = req.params;
        const requestId = await exactTargetService.sendCampaign(
          req.tenant.publisherId,
          campaignId
        );
        
        res.json({ 
          success: true, 
          requestId,
          message: "Campaign sent via ExactTarget" 
        });
      } catch (error) {
        console.error("ExactTarget campaign send error:", error);
        res.status(500).json({ error: "Failed to send campaign via ExactTarget" });
      }
    }
  );

  app.get("/api/integrations/exacttarget/analytics/:requestId",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { requestId } = req.params;
        const analytics = await exactTargetService.getCampaignAnalytics(
          req.tenant.publisherId,
          requestId
        );
        res.json(analytics);
      } catch (error) {
        console.error("ExactTarget analytics error:", error);
        res.status(500).json({ error: "Failed to get ExactTarget analytics" });
      }
    }
  );

  app.get("/api/integrations/exacttarget/subscriber-engagement/:email",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { email } = req.params;
        const engagement = await exactTargetService.getSubscriberEngagement(
          req.tenant.publisherId,
          email
        );
        res.json(engagement);
      } catch (error) {
        console.error("ExactTarget subscriber engagement error:", error);
        res.status(500).json({ error: "Failed to get subscriber engagement data" });
      }
    }
  );

  app.get("/api/integrations/exacttarget/test",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const isConnected = await exactTargetService.testConnection(req.tenant.publisherId);
        res.json({ connected: isConnected });
      } catch (error) {
        console.error("ExactTarget connection test error:", error);
        res.status(500).json({ error: "Failed to test ExactTarget connection" });
      }
    }
  );

  app.get("/api/integrations/exacttarget/account-info",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const accountInfo = await exactTargetService.getAccountInfo(req.tenant.publisherId);
        res.json(accountInfo);
      } catch (error) {
        console.error("ExactTarget account info error:", error);
        res.status(500).json({ error: "Failed to get ExactTarget account information" });
      }
    }
  );

  // General Integration Status Routes
  
  app.get("/api/integrations/status",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const emailIntegrations = await tenantStorage.getEmailIntegrations(req.tenant.publisherId);
        const crmIntegrations = await tenantStorage.getCrmIntegrations(req.tenant.publisherId);
        
        const status = {
          email: emailIntegrations.map(integration => ({
            platform: integration.platform,
            isConnected: integration.isConnected,
            status: integration.status,
            lastSync: integration.lastSync,
          })),
          crm: crmIntegrations.map(integration => ({
            platform: integration.platform,
            isConnected: integration.isConnected,
            status: integration.status,
            lastSync: integration.lastSync,
          })),
          ai: {
            openai: !!process.env.OPENAI_API_KEY,
            status: "active",
          },
        };

        res.json(status);
      } catch (error) {
        console.error("Integration status error:", error);
        res.status(500).json({ error: "Failed to get integration status" });
      }
    }
  );
}

