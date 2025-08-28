import type { Express, Request } from "express";
import { 
  requireTenant,
} from "./middleware/tenant";

// Type for requests with tenant info
type AuthenticatedRequest = Request;
import { tenantStorage } from "./storage-multitenant";
import { emailService } from "./services/email";
// Demo functionality removed

export function registerEmailRoutes(app: Express): void {
  
  // Email sending routes
  
  app.post("/api/email/send-test",
    
    requireTenant,
    
    async (req: AuthenticatedRequest, res) => {
      try {
        const { testEmail, subject, htmlBody, textBody } = req.body;
        
        if (!testEmail || !subject || !htmlBody) {
          return res.status(400).json({ error: "Test email, subject, and HTML body are required" });
        }

        const result = await emailService.sendTestEmail(req.tenant.publisherId, testEmail, {
          subject,
          htmlBody,
          textBody,
        });

        res.json({
          success: true,
          messageId: result.messageId,
          message: "Test email sent successfully",
        });
      } catch (error) {
        console.error("Test email send error:", error);
        res.status(500).json({ error: "Failed to send test email" });
      }
    }
  );

  app.post("/api/email/send-campaign/:campaignId",
    
    requireTenant,
    
    
    async (req: AuthenticatedRequest, res) => {
      try {
        const { campaignId } = req.params;
        
        const result = await emailService.sendCampaign(req.tenant.publisherId, campaignId);
        
        res.json({
          success: true,
          ...result,
          message: `Campaign sent to ${result.successful} subscribers`,
        });
      } catch (error) {
        console.error("Campaign send error:", error);
        res.status(500).json({ error: "Failed to send campaign" });
      }
    }
  );

  app.get("/api/email/validate-config",
    
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = await emailService.validateEmailConfig(req.tenant.publisherId);
        res.json(result);
      } catch (error) {
        console.error("Email config validation error:", error);
        res.status(500).json({ error: "Failed to validate email configuration" });
      }
    }
  );

  app.get("/api/email/stats",
    
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const stats = await emailService.getEmailStats(req.tenant.publisherId);
        res.json(stats);
      } catch (error) {
        console.error("Email stats error:", error);
        res.status(500).json({ error: "Failed to get email statistics" });
      }
    }
  );

  // Unsubscribe handling (public route)
  app.get("/api/unsubscribe",
    async (req, res) => {
      try {
        const { token } = req.query;
        
        if (!token || typeof token !== "string") {
          return res.status(400).json({ error: "Unsubscribe token is required" });
        }

        const result = await emailService.processUnsubscribe(token);
        
        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        console.error("Unsubscribe error:", error);
        res.status(500).json({ error: "Failed to process unsubscribe request" });
      }
    }
  );

  app.post("/api/unsubscribe",
    async (req, res) => {
      try {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({ error: "Unsubscribe token is required" });
        }

        const result = await emailService.processUnsubscribe(token);
        
        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        console.error("Unsubscribe error:", error);
        res.status(500).json({ error: "Failed to process unsubscribe request" });
      }
    }
  );

  // Demo account routes
  
  app.post("/api/demo/seed",
    async (req, res) => {
      try {
        // Check if demo data already exists
        const existingDemo = await tenantStorage.getPublisherBySubdomain("demo");
        
        if (existingDemo) {
          return res.json({
            success: true,
            message: "Demo data already exists",
            publisher: existingDemo,
          });
        }

        const result = await seedDemoData();
        
        res.json({
          success: true,
          message: "Demo data created successfully",
          ...result,
        });
      } catch (error) {
        console.error("Demo seed error:", error);
        res.status(500).json({ error: "Failed to create demo data" });
      }
    }
  );

  app.get("/api/demo/info",
    async (req, res) => {
      try {
        const demoPublisher = await tenantStorage.getPublisherBySubdomain("demo");
        
        if (!demoPublisher) {
          return res.status(404).json({ error: "Demo account not found" });
        }

        const subscribers = await tenantStorage.getSubscribers(demoPublisher.id);
        const campaigns = await tenantStorage.getCampaigns(demoPublisher.id);
        const analytics = await tenantStorage.getLatestAnalytics(demoPublisher.id);

        res.json({
          publisher: {
            id: demoPublisher.id,
            name: demoPublisher.name,
            subdomain: demoPublisher.subdomain,
            plan: demoPublisher.plan,
            createdAt: demoPublisher.createdAt,
          },
          stats: {
            subscribers: subscribers.length,
            campaigns: campaigns.length,
            sentCampaigns: campaigns.filter(c => c.status === "sent").length,
            totalRevenue: analytics?.monthlyRevenue || "0",
            engagementRate: analytics?.engagementRate || "0",
          },
          credentials: {
            email: "demo@sharpsend.com",
            password: "demo123",
            subdomain: "demo",
          },
        });
      } catch (error) {
        console.error("Demo info error:", error);
        res.status(500).json({ error: "Failed to get demo information" });
      }
    }
  );

  app.post("/api/demo/send-sample-email",
    async (req, res) => {
      try {
        const { recipientEmail } = req.body;
        
        if (!recipientEmail) {
          return res.status(400).json({ error: "Recipient email is required" });
        }

        const demoPublisher = await tenantStorage.getPublisherBySubdomain("demo");
        if (!demoPublisher) {
          return res.status(404).json({ error: "Demo account not found" });
        }

        // Create a sample email template
        const sampleTemplate = {
          subject: "🚀 Welcome to SharpSend Demo - See AI Personalization in Action!",
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #3b82f6; text-align: center;">Welcome to SharpSend!</h1>
              
              <p>Hello {{subscriber.name}},</p>
              
              <p>Thank you for trying our SharpSend demo! This email demonstrates our AI-powered personalization capabilities.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #1e40af; margin-top: 0;">🤖 AI Features You Just Experienced:</h2>
                <ul style="color: #475569;">
                  <li><strong>Smart Personalization:</strong> This email was personalized just for you</li>
                  <li><strong>Optimized Send Time:</strong> Delivered when you're most likely to engage</li>
                  <li><strong>Dynamic Content:</strong> Content adapted based on your profile</li>
                </ul>
              </div>
              
              <h3 style="color: #1e40af;">What Makes SharpSend Special?</h3>
              <ul style="color: #475569;">
                <li>📈 <strong>45% Higher Open Rates</strong> with AI-optimized subject lines</li>
                <li>💰 <strong>67% More Revenue</strong> per email through personalization</li>
                <li>⚡ <strong>80% Less Time</strong> creating content with AI assistance</li>
                <li>🎯 <strong>Real-time A/B Testing</strong> that adapts automatically</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://demo.sharpsend.com/dashboard" 
                   style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Explore the Demo Dashboard
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                This is a demonstration email from SharpSend. You're receiving this because you requested a demo of our platform.
                <br><br>
                <strong>Demo Credentials:</strong><br>
                Email: demo@sharpsend.com<br>
                Password: demo123<br>
                URL: demo.sharpsend.com
              </p>
            </div>
          `,
        };

        // Send the sample email
        const result = await emailService.sendTestEmail(demoPublisher.id, recipientEmail, sampleTemplate);
        
        res.json({
          success: true,
          messageId: result.messageId,
          message: "Sample demo email sent successfully",
          demoCredentials: {
            email: "demo@sharpsend.com",
            password: "demo123",
            subdomain: "demo",
          },
        });
      } catch (error) {
        console.error("Demo email send error:", error);
        res.status(500).json({ error: "Failed to send demo email" });
      }
    }
  );

  // Email template routes
  
  app.get("/api/email/templates",
    
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Return predefined email templates
        const templates = [
          {
            id: "newsletter",
            name: "Newsletter Template",
            description: "Clean, professional newsletter layout",
            category: "newsletter",
            preview: "/templates/newsletter-preview.png",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3b82f6;">{{campaign.name}}</h1>
                <p>Hello {{subscriber.name}},</p>
                <div style="margin: 20px 0;">
                  {{campaign.content}}
                </div>
                <p>Best regards,<br>{{publisher.name}}</p>
              </div>
            `,
          },
          {
            id: "promotional",
            name: "Promotional Template",
            description: "Eye-catching template for promotions and offers",
            category: "promotional",
            preview: "/templates/promotional-preview.png",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
                <h1 style="text-align: center; margin-bottom: 30px;">{{campaign.name}}</h1>
                <div style="background: white; color: #333; padding: 30px; border-radius: 10px;">
                  <p>Hi {{subscriber.name}},</p>
                  {{campaign.content}}
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a>
                  </div>
                </div>
              </div>
            `,
          },
          {
            id: "announcement",
            name: "Announcement Template",
            description: "Professional template for company announcements",
            category: "announcement",
            preview: "/templates/announcement-preview.png",
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="border-left: 4px solid #3b82f6; padding-left: 20px; margin-bottom: 30px;">
                  <h1 style="color: #1e40af; margin: 0;">{{campaign.name}}</h1>
                  <p style="color: #64748b; margin: 5px 0 0 0;">Important Update</p>
                </div>
                <p>Dear {{subscriber.name}},</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  {{campaign.content}}
                </div>
                <p>Thank you for your attention.</p>
                <p>Sincerely,<br>{{publisher.name}} Team</p>
              </div>
            `,
          },
        ];

        res.json(templates);
      } catch (error) {
        console.error("Email templates error:", error);
        res.status(500).json({ error: "Failed to get email templates" });
      }
    }
  );
}

