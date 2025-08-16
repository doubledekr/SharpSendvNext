import type { Express } from "express";
import { emailConfirmationService } from "./services/email-confirmation-service";

export function registerEmailPlatformRoutes(app: Express) {
  // Get platform health status
  app.get("/api/email-platforms/health", async (req, res) => {
    try {
      const healthStatus = emailConfirmationService.getPlatformHealthStatus();
      
      const formattedStatus = Array.from(healthStatus.entries()).map(([platform, health]) => ({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        status: health?.status || 'unknown',
        uptime: health?.status === 'healthy' ? 99.95 : health?.status === 'degraded' ? 98.5 : 0,
        avgLatency: health?.avgLatency || 0,
        lastCheck: health?.lastCheck ? getTimeSince(health.lastCheck) : 'Never',
        errorCount: health?.errorCount || 0,
        capabilities: getPlatformCapabilities(platform)
      }));
      
      res.json(formattedStatus);
    } catch (error) {
      console.error("Error fetching platform health:", error);
      res.status(500).json({ error: "Failed to fetch platform health" });
    }
  });
  
  // Get platform configurations
  app.get("/api/email-platforms/configs", async (req, res) => {
    try {
      // Mock configuration data - replace with actual database fetch
      const configs = [
        {
          name: "SendGrid",
          enabled: true,
          priority: 1,
          apiKey: process.env.SENDGRID_API_KEY ? "Configured" : "Not Set",
          features: {
            groupsEnabled: true,
            tagsEnabled: true,
            automationEnabled: false,
            webhooksEnabled: true
          }
        },
        {
          name: "Mailchimp",
          enabled: true,
          priority: 2,
          apiKey: process.env.MAILCHIMP_API_KEY ? "Configured" : "Not Set",
          features: {
            groupsEnabled: true,
            tagsEnabled: true,
            automationEnabled: true,
            webhooksEnabled: true
          }
        },
        {
          name: "ExactTarget",
          enabled: true,
          priority: 3,
          apiKey: process.env.EXACTTARGET_CLIENT_ID ? "Configured" : "Not Set",
          features: {
            groupsEnabled: true,
            tagsEnabled: true,
            automationEnabled: true,
            webhooksEnabled: true
          }
        },
        {
          name: "Mailgun",
          enabled: false,
          priority: 4,
          apiKey: process.env.MAILGUN_API_KEY ? "Configured" : "Not Set",
          features: {
            groupsEnabled: false,
            tagsEnabled: true,
            automationEnabled: false,
            webhooksEnabled: true
          }
        }
      ];
      
      res.json(configs);
    } catch (error) {
      console.error("Error fetching platform configs:", error);
      res.status(500).json({ error: "Failed to fetch platform configurations" });
    }
  });
  
  // Update platform configuration
  app.put("/api/email-platforms/config", async (req, res) => {
    try {
      const { name, enabled, features } = req.body;
      
      // Mock update - replace with actual database update
      console.log(`Updating platform configuration for ${name}:`, { enabled, features });
      
      res.json({ 
        success: true, 
        message: `Configuration for ${name} updated successfully` 
      });
    } catch (error) {
      console.error("Error updating platform config:", error);
      res.status(500).json({ error: "Failed to update platform configuration" });
    }
  });
  
  // Test platform connection
  app.post("/api/email-platforms/test/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      
      // Mock test - replace with actual platform API test
      const testResult = await testPlatformConnection(platform);
      
      if (testResult.success) {
        res.json({ 
          success: true, 
          message: `${platform} connection successful`,
          details: testResult.details
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: testResult.error 
        });
      }
    } catch (error) {
      console.error(`Error testing ${req.params.platform} connection:`, error);
      res.status(500).json({ error: "Connection test failed" });
    }
  });
  
  // Send campaign with confirmation
  app.post("/api/email-platforms/send", async (req, res) => {
    try {
      const campaign = req.body;
      
      const result = await emailConfirmationService.sendWithConfirmation({
        id: `campaign_${Date.now()}`,
        primaryPlatform: campaign.platform || 'sendgrid',
        content: campaign.content,
        recipients: campaign.recipients,
        priority: campaign.priority || 'standard',
        scheduledTime: campaign.scheduledTime
      });
      
      res.json({
        success: true,
        result: {
          status: result.status,
          platform: result.platform,
          messageId: result.messageId,
          confirmations: result.confirmations
        }
      });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });
  
  // Reset platform health (admin function)
  app.post("/api/email-platforms/reset-health/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      emailConfirmationService.resetPlatformHealth(platform);
      
      res.json({ 
        success: true, 
        message: `Health status reset for ${platform}` 
      });
    } catch (error) {
      console.error("Error resetting platform health:", error);
      res.status(500).json({ error: "Failed to reset platform health" });
    }
  });
}

// Helper functions
function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function getPlatformCapabilities(platform: string): any {
  const capabilities: Record<string, any> = {
    sendgrid: {
      groups: true,
      tags: true,
      segments: true,
      automation: false,
      webhooks: true
    },
    mailchimp: {
      groups: true,
      tags: true,
      segments: true,
      automation: true,
      webhooks: true
    },
    exacttarget: {
      groups: true,
      tags: true,
      segments: true,
      automation: true,
      webhooks: true
    },
    mailgun: {
      groups: false,
      tags: true,
      segments: false,
      automation: false,
      webhooks: true
    }
  };
  
  return capabilities[platform.toLowerCase()] || {
    groups: false,
    tags: false,
    segments: false,
    automation: false,
    webhooks: false
  };
}

async function testPlatformConnection(platform: string): Promise<any> {
  // Mock implementation - replace with actual API tests
  const tests: Record<string, () => Promise<any>> = {
    SendGrid: async () => {
      // Test SendGrid API
      if (!process.env.SENDGRID_API_KEY) {
        return { success: false, error: "SendGrid API key not configured" };
      }
      return { 
        success: true, 
        details: { 
          version: "v3", 
          endpoint: "api.sendgrid.com",
          authenticated: true 
        }
      };
    },
    Mailchimp: async () => {
      // Test Mailchimp API
      if (!process.env.MAILCHIMP_API_KEY) {
        return { success: false, error: "Mailchimp API key not configured" };
      }
      return { 
        success: true, 
        details: { 
          version: "3.0", 
          endpoint: "api.mailchimp.com",
          authenticated: true 
        }
      };
    },
    ExactTarget: async () => {
      // Test ExactTarget API
      if (!process.env.EXACTTARGET_CLIENT_ID) {
        return { success: false, error: "ExactTarget credentials not configured" };
      }
      return { 
        success: true, 
        details: { 
          version: "v2", 
          endpoint: "mc.exacttarget.com",
          authenticated: true 
        }
      };
    },
    Mailgun: async () => {
      // Test Mailgun API
      if (!process.env.MAILGUN_API_KEY) {
        return { success: false, error: "Mailgun API key not configured" };
      }
      return { 
        success: true, 
        details: { 
          version: "v3", 
          endpoint: "api.mailgun.net",
          authenticated: true 
        }
      };
    }
  };
  
  const testFn = tests[platform];
  if (!testFn) {
    return { success: false, error: `Unknown platform: ${platform}` };
  }
  
  return await testFn();
}