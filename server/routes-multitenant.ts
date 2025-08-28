import type { Express, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { tenantStorage } from "./storage-multitenant";
import {
  requireTenant,
  getTenantInfo,
  type TenantInfo
} from "./middleware/tenant";
import {
  insertPublisherSchema,
  insertUserSchema,
  insertSubscriberSchema,
  insertABTestSchema,
  insertEmailIntegrationSchema,
  insertCrmIntegrationSchema,
} from "../shared/schema-multitenant";

// Helper functions for authentication
const JWT_SECRET = process.env.JWT_SECRET || "sharpsend-secret-key-change-in-production";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

function generateToken(userId: string, publisherId: string): string {
  return jwt.sign({ userId, publisherId }, JWT_SECRET, { expiresIn: '7d' });
}

// Extended Request type with authentication
interface AuthenticatedRequest extends Request {
  user?: { id: string; publisherId: string };
  tenant?: TenantInfo;
}

// Authentication middleware
function authenticateAndSetTenant(req: AuthenticatedRequest, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; publisherId: string };
    req.user = { id: decoded.userId, publisherId: decoded.publisherId };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role checking middleware
function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: Function) => {
    // Implement role checking logic here if needed
    next();
  };
}

// Logging middleware
function logTenantOperation(operation: string) {
  return (req: AuthenticatedRequest, res: Response, next: Function) => {
    console.log(`[${new Date().toISOString()}] ${operation} - Publisher: ${req.tenant?.id || 'unknown'}`);
    next();
  };
}

export async function registerMultiTenantRoutes(app: Express): Promise<void> {
  // Public routes for publisher registration and authentication
  
  // Publisher registration
  app.post("/api/publishers/register", async (req, res) => {
    try {
      // Make domain and settings optional for registration
      const registrationSchema = insertPublisherSchema.omit({ domain: true, settings: true }).extend({
        domain: z.string().optional(),
        settings: z.any().optional(),
        password: z.string().min(8), // Add password validation
      });
      const publisherData = registrationSchema.parse(req.body);
      
      // Check if subdomain is already taken
      const existingPublisher = await tenantStorage.getPublisherBySubdomain(publisherData.subdomain);
      if (existingPublisher) {
        return res.status(400).json({ error: "Subdomain already taken" });
      }

      // Check if email is already taken
      const existingEmail = await tenantStorage.getPublisherByEmail(publisherData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create publisher
      const publisher = await tenantStorage.createPublisher({
        ...publisherData,
        settings: {
          branding: {
            primaryColor: "#3b82f6",
            secondaryColor: "#1e40af",
          },
          features: {
            aiPersonalization: true,
            abTesting: publisherData.plan !== "starter",
            advancedAnalytics: publisherData.plan === "enterprise",
          },
          limits: {
            maxSubscribers: publisherData.plan === "starter" ? 1000 : publisherData.plan === "pro" ? 10000 : 100000,
            maxCampaigns: publisherData.plan === "starter" ? 10 : publisherData.plan === "pro" ? 100 : 1000,
            maxEmailsPerMonth: publisherData.plan === "starter" ? 5000 : publisherData.plan === "pro" ? 50000 : 500000,
          },
        },
      });

      // Create default admin user
      const hashedPassword = await hashPassword(req.body.password);
      const user = await tenantStorage.createUser({
        publisherId: publisher.id,
        username: publisherData.name.toLowerCase().replace(/\s+/g, ""),
        email: publisherData.email,
        password: hashedPassword,
        role: "admin",
      });

      // Generate token
      const token = generateToken(user.id, publisher.id);

      res.status(201).json({
        publisher: {
          id: publisher.id,
          name: publisher.name,
          subdomain: publisher.subdomain,
          plan: publisher.plan,
        },
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Publisher registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, subdomain } = req.body;

      if (!email || !password || !subdomain) {
        return res.status(400).json({ error: "Email, password, and subdomain are required" });
      }

      // Get publisher by subdomain
      const publisher = await tenantStorage.getPublisherBySubdomain(subdomain);
      if (!publisher || !publisher.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Get user by email within publisher
      const user = await tenantStorage.getUserByEmail(email, publisher.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      await tenantStorage.updateUser(user.id, publisher.id, { lastLoginAt: new Date() });

      // Generate token
      const token = generateToken(user.id, publisher.id);

      res.json({
        publisher: {
          id: publisher.id,
          name: publisher.name,
          subdomain: publisher.subdomain,
          plan: publisher.plan,
        },
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Protected routes - require authentication and tenant context
  
  // Analytics endpoints
  app.get("/api/analytics", 
    authenticateAndSetTenant,
    requireTenant,
    logTenantOperation("GET_ANALYTICS"),
    async (req: AuthenticatedRequest, res) => {
      try {
        let analytics = await tenantStorage.getLatestAnalytics(req.tenant!.id);
        
        // If no analytics exist, calculate and create them
        if (!analytics) {
          analytics = await tenantStorage.calculateAnalytics(req.tenant!.id);
        }
        
        res.json(analytics);
      } catch (error) {
        console.error("Analytics fetch error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    }
  );

  app.get("/api/analytics/history",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const days = parseInt(req.query.days as string) || 30;
        const history = await tenantStorage.getAnalyticsHistory(req.tenant!.id, days);
        res.json(history);
      } catch (error) {
        console.error("Analytics history fetch error:", error);
        res.status(500).json({ error: "Failed to fetch analytics history" });
      }
    }
  );

  // Subscribers endpoints
  app.get("/api/subscribers",
    authenticateAndSetTenant,
    requireTenant,
    logTenantOperation("GET_SUBSCRIBERS"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const subscribers = await tenantStorage.getSubscribers(req.tenant!.id);
        res.json(subscribers);
      } catch (error) {
        console.error("Subscribers fetch error:", error);
        res.status(500).json({ error: "Failed to fetch subscribers" });
      }
    }
  );

  app.get("/api/subscribers/:id",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const subscriber = await tenantStorage.getSubscriber(req.params.id, req.tenant!.id);
        if (!subscriber) {
          return res.status(404).json({ error: "Subscriber not found" });
        }
        res.json(subscriber);
      } catch (error) {
        console.error("Subscriber fetch error:", error);
        res.status(500).json({ error: "Failed to fetch subscriber" });
      }
    }
  );

  app.post("/api/subscribers",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertSubscriberSchema.parse({
          ...req.body,
          publisherId: req.tenant!.id,
        });
        
        // Check if subscriber already exists
        const existing = await tenantStorage.getSubscriberByEmail(validatedData.email, req.tenant!.id);
        if (existing) {
          return res.status(400).json({ error: "Subscriber with this email already exists" });
        }

        const subscriber = await tenantStorage.createSubscriber(validatedData);
        res.status(201).json(subscriber);
      } catch (error) {
        console.error("Subscriber creation error:", error);
        res.status(400).json({ error: "Invalid subscriber data" });
      }
    }
  );

  app.post("/api/subscribers/bulk-import",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { subscribers: subscriberList } = req.body;
        
        if (!Array.isArray(subscriberList) || subscriberList.length === 0) {
          return res.status(400).json({ error: "Invalid subscriber list" });
        }

        // Validate and prepare subscriber data
        const validatedSubscribers = subscriberList.map(sub => 
          insertSubscriberSchema.parse({
            ...sub,
            publisherId: req.tenant!.id,
          })
        );

        const importedSubscribers = await tenantStorage.bulkImportSubscribers(validatedSubscribers);
        
        res.status(201).json({
          imported: importedSubscribers.length,
          subscribers: importedSubscribers,
        });
      } catch (error) {
        console.error("Bulk import error:", error);
        res.status(400).json({ error: "Failed to import subscribers" });
      }
    }
  );

  app.put("/api/subscribers/:id",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        delete updates.publisherId; // Prevent publisher ID changes
        
        const subscriber = await tenantStorage.updateSubscriber(req.params.id, req.tenant!.id, updates);
        if (!subscriber) {
          return res.status(404).json({ error: "Subscriber not found" });
        }
        res.json(subscriber);
      } catch (error) {
        console.error("Subscriber update error:", error);
        res.status(500).json({ error: "Failed to update subscriber" });
      }
    }
  );

  app.delete("/api/subscribers/:id",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const deleted = await tenantStorage.deleteSubscriber(req.params.id, req.tenant!.id);
        if (!deleted) {
          return res.status(404).json({ error: "Subscriber not found" });
        }
        res.status(204).send();
      } catch (error) {
        console.error("Subscriber deletion error:", error);
        res.status(500).json({ error: "Failed to delete subscriber" });
      }
    }
  );

  // Campaigns endpoints
  app.get("/api/campaigns",
    authenticateAndSetTenant,
    requireTenant,
    logTenantOperation("GET_CAMPAIGNS"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const campaigns = await tenantStorage.getCampaigns(req.tenant!.id);
        res.json(campaigns);
      } catch (error) {
        console.error("Campaigns fetch error:", error);
        res.status(500).json({ error: "Failed to fetch campaigns" });
      }
    }
  );

  app.post("/api/campaigns",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertCampaignSchema.parse({
          ...req.body,
          publisherId: req.tenant!.id,
        });
        const campaign = await tenantStorage.createCampaign(validatedData);
        res.status(201).json(campaign);
      } catch (error) {
        console.error("Campaign creation error:", error);
        res.status(400).json({ error: "Invalid campaign data" });
      }
    }
  );

  app.get("/api/campaigns/:id",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const campaign = await tenantStorage.getCampaign(req.params.id, req.tenant!.id);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }
        res.json(campaign);
      } catch (error) {
        console.error("Campaign fetch error:", error);
        res.status(500).json({ error: "Failed to fetch campaign" });
      }
    }
  );

  app.put("/api/campaigns/:id",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        delete updates.publisherId; // Prevent publisher ID changes
        
        const campaign = await tenantStorage.updateCampaign(req.params.id, req.tenant!.id, updates);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }
        res.json(campaign);
      } catch (error) {
        console.error("Campaign update error:", error);
        res.status(500).json({ error: "Failed to update campaign" });
      }
    }
  );

  // Segments endpoints
  app.get("/api/segments/suggested", 
    authenticateAndSetTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Check if demo user - ONLY return data for demo accounts
        if (req.user?.id === 'demo-user-id') {
          // Return demo segments for demo accounts
          return res.json([
            {
              id: "seg_001",
              name: "High CTR Low Conversion",
              type: "behavior",
              size: 3200,
              confidence: 92,
              description: "Engaged readers who browse but rarely purchase",
              criteria: [
                "CTR > 25% on promotional emails",
                "Conversion rate < 2%",
                "Opens 80%+ of emails"
              ],
              potentialRevenue: 45000
            },
            {
              id: "seg_002",
              name: "Premium Offer Browsers",
              type: "value",
              size: 1850,
              confidence: 88,
              description: "Clicked premium offers 3x+ but never converted",
              criteria: [
                "Clicked premium CTAs 3+ times",
                "No premium purchases",
                "Account age > 6 months"
              ],
              potentialRevenue: 125000
            },
            {
              id: "seg_003",
              name: "Bullish Headline Lovers",
              type: "sentiment",
              size: 5400,
              confidence: 85,
              description: "Always opens bullish market sentiment headlines",
              criteria: [
                "Opens 90%+ bullish subject lines",
                "Opens <30% bearish headlines",
                "Active during market rallies"
              ]
            },
            {
              id: "seg_004",
              name: "Morning Power Users",
              type: "engagement",
              size: 2100,
              confidence: 94,
              description: "Highly engaged pre-market readers",
              criteria: [
                "Opens emails 6-9 AM EST",
                "Engagement rate > 75%",
                "Clicks within 5 min of open"
              ]
            }
          ]);
        }
        
        // For ALL real accounts (including test.sharpsend), return empty array
        res.json([]);
      } catch (error) {
        console.error("Segments fetch error:", error);
        res.status(500).json({ error: "Failed to fetch suggested segments" });
      }
    }
  );

  // A/B Testing endpoints
  app.get("/api/ab-tests",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const abTests = await tenantStorage.getABTests(req.tenant!.id);
        res.json(abTests);
      } catch (error) {
        console.error("A/B tests fetch error:", error);
        res.status(500).json({ error: "Failed to fetch A/B tests" });
      }
    }
  );

  app.post("/api/ab-tests",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertABTestSchema.parse({
          ...req.body,
          publisherId: req.tenant!.id,
        });
        const abTest = await tenantStorage.createABTest(validatedData);
        res.status(201).json(abTest);
      } catch (error) {
        console.error("A/B test creation error:", error);
        res.status(400).json({ error: "Invalid A/B test data" });
      }
    }
  );

  app.put("/api/ab-tests/:id",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("editor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        delete updates.publisherId; // Prevent publisher ID changes
        
        const abTest = await tenantStorage.updateABTest(req.params.id, req.tenant!.id, updates);
        if (!abTest) {
          return res.status(404).json({ error: "A/B test not found" });
        }
        res.json(abTest);
      } catch (error) {
        console.error("A/B test update error:", error);
        res.status(500).json({ error: "Failed to update A/B test" });
      }
    }
  );

  // Email Integration endpoints
  app.get("/api/email-integrations",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const integrations = await tenantStorage.getEmailIntegrations(req.tenant!.id);
        res.json(integrations);
      } catch (error) {
        console.error("Email integrations fetch error:", error);
        res.status(500).json({ error: "Failed to fetch email integrations" });
      }
    }
  );

  app.post("/api/email-integrations",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertEmailIntegrationSchema.parse({
          ...req.body,
          publisherId: req.tenant!.id,
        });
        const integration = await tenantStorage.createEmailIntegration(validatedData);
        res.status(201).json(integration);
      } catch (error) {
        console.error("Email integration creation error:", error);
        res.status(400).json({ error: "Invalid email integration data" });
      }
    }
  );

  app.put("/api/email-integrations/:id",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        delete updates.publisherId; // Prevent publisher ID changes
        
        const integration = await tenantStorage.updateEmailIntegration(req.params.id, req.tenant!.id, updates);
        if (!integration) {
          return res.status(404).json({ error: "Email integration not found" });
        }
        res.json(integration);
      } catch (error) {
        console.error("Email integration update error:", error);
        res.status(500).json({ error: "Failed to update email integration" });
      }
    }
  );

  // CRM Integration endpoints
  app.get("/api/crm-integrations",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        const integrations = await tenantStorage.getCrmIntegrations(req.tenant!.id);
        res.json(integrations);
      } catch (error) {
        console.error("CRM integrations fetch error:", error);
        res.status(500).json({ error: "Failed to fetch CRM integrations" });
      }
    }
  );

  app.post("/api/crm-integrations",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertCrmIntegrationSchema.parse({
          ...req.body,
          publisherId: req.tenant!.id,
        });
        const integration = await tenantStorage.createCrmIntegration(validatedData);
        res.status(201).json(integration);
      } catch (error) {
        console.error("CRM integration creation error:", error);
        res.status(400).json({ error: "Invalid CRM integration data" });
      }
    }
  );

  app.put("/api/crm-integrations/:id",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        delete updates.publisherId; // Prevent publisher ID changes
        
        const integration = await tenantStorage.updateCrmIntegration(req.params.id, req.tenant!.id, updates);
        if (!integration) {
          return res.status(404).json({ error: "CRM integration not found" });
        }
        res.json(integration);
      } catch (error) {
        console.error("CRM integration update error:", error);
        res.status(500).json({ error: "Failed to update CRM integration" });
      }
    }
  );

  // Pixels endpoint - returns empty array for real accounts
  app.get("/api/pixels",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        // For now, return empty array for real accounts
        // This will be populated when pixel tracking is actually implemented
        res.json([]);
      } catch (error) {
        console.error("Pixels fetch error:", error);
        res.status(500).json({ error: "Failed to fetch pixels" });
      }
    }
  );

  // Publisher settings endpoints
  app.get("/api/publisher/settings",
    authenticateAndSetTenant,
    requireTenant,
    async (req: AuthenticatedRequest, res) => {
      try {
        res.json(req.tenant.publisher);
      } catch (error) {
        console.error("Publisher settings fetch error:", error);
        res.status(500).json({ error: "Failed to fetch publisher settings" });
      }
    }
  );

  app.put("/api/publisher/settings",
    authenticateAndSetTenant,
    requireTenant,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        delete updates.id; // Prevent ID changes
        delete updates.subdomain; // Prevent subdomain changes
        
        const publisher = await tenantStorage.updatePublisher(req.tenant!.id, updates);
        if (!publisher) {
          return res.status(404).json({ error: "Publisher not found" });
        }
        res.json(publisher);
      } catch (error) {
        console.error("Publisher settings update error:", error);
        res.status(500).json({ error: "Failed to update publisher settings" });
      }
    }
  );
}

