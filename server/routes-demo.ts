import type { Express } from "express";
import { db } from "./db";
import { users, subscribers, campaigns, emailSegments, assignments } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";

// Generate unique shareable slug for assignments
function generateShareableSlug(): string {
  return randomBytes(8).toString("hex");
}

export function registerDemoRoutes(app: Express) {
  // Demo onboarding endpoint
  app.post("/api/demo/onboarding", async (req, res) => {
    try {
      const {
        companyName,
        industry,
        subscriberCount,
        emailPlatform,
        primaryGoal,
        contentTypes,
        monthlyBudget,
        websiteUrl,
        description
      } = req.body;

      // Create a demo user with the onboarding data
      const demoUserId = randomUUID();
      const [demoUser] = await db.insert(users).values({
        id: demoUserId,
        email: `demo-${Date.now()}@sharpsend.io`,
        username: companyName.toLowerCase().replace(/\s+/g, '-'),
        password: "demo123", // This is a demo account
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Store onboarding data as metadata (we'll use this to customize the demo)
      const onboardingMetadata = {
        companyName,
        industry,
        subscriberCount,
        emailPlatform,
        primaryGoal,
        contentTypes,
        monthlyBudget,
        websiteUrl,
        description,
        isDemoAccount: true,
        onboardingCompleted: true
      };

      // Create sample subscribers based on the subscriber count range
      const subscriberRanges: Record<string, number> = {
        "0-1000": 500,
        "1000-5000": 2500,
        "5000-10000": 7500,
        "10000-50000": 25000,
        "50000-100000": 75000,
        "100000+": 150000
      };

      const targetCount = subscriberRanges[subscriberCount] || 1000;
      const sampleSubscribers = [];

      // Create diverse subscriber segments
      const subscriberTypes = [
        { prefix: "premium", engagement: 85, revenue: 250 },
        { prefix: "active", engagement: 65, revenue: 150 },
        { prefix: "casual", engagement: 35, revenue: 50 },
        { prefix: "dormant", engagement: 10, revenue: 0 }
      ];

      for (let i = 0; i < Math.min(targetCount, 100); i++) {
        const type = subscriberTypes[i % subscriberTypes.length];
        sampleSubscribers.push({
          email: `${type.prefix}-user-${i}@example.com`,
          status: i % 10 === 0 ? "inactive" : "active",
          subscribedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          metadata: {
            engagement: type.engagement + Math.random() * 10 - 5,
            revenue: type.revenue + Math.random() * 50 - 25,
            interests: contentTypes.slice(0, Math.floor(Math.random() * contentTypes.length) + 1)
          }
        });
      }

      if (sampleSubscribers.length > 0) {
        await db.insert(subscribers).values(sampleSubscribers);
      }

      // Create sample campaigns based on content types
      const sampleCampaigns = [];
      for (const contentType of contentTypes.slice(0, 3)) {
        sampleCampaigns.push({
          name: `${contentType} Campaign`,
          subject: `Your ${contentType} Update`,
          content: `<h1>Welcome to ${contentType}</h1><p>This is a sample campaign for ${contentType} content.</p>`,
          status: "draft",
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          metadata: {
            contentType,
            industry,
            goal: primaryGoal
          }
        });
      }

      if (sampleCampaigns.length > 0) {
        await db.insert(campaigns).values(sampleCampaigns);
      }

      // Create AI-detected segments
      const detectedSegments = [
        {
          name: "High-Value Investors",
          description: "Premium subscribers with high engagement and purchase history",
          criteria: {
            dynamicRules: {
              engagement: { min: 70, max: 100 },
              revenue: { min: 200, max: 10000 }
            }
          },
          subscriberCount: Math.floor(targetCount * 0.15),
          growth: 12.5,
          potentialRevenue: Math.floor(targetCount * 0.15 * 250),
          engagementScore: 85,
          churnRisk: "low",
          isDetected: true,
          isDynamic: true,
          aiInsights: "This segment shows strong correlation with market volatility content and options trading newsletters"
        },
        {
          name: "Emerging Professionals",
          description: "Young professionals building their investment portfolio",
          criteria: {
            dynamicRules: {
              engagement: { min: 40, max: 70 },
              activity: { daysSinceLastOpen: 7 }
            }
          },
          subscriberCount: Math.floor(targetCount * 0.25),
          growth: 18.3,
          potentialRevenue: Math.floor(targetCount * 0.25 * 150),
          engagementScore: 55,
          churnRisk: "medium",
          isDetected: true,
          isDynamic: true,
          aiInsights: "Growing segment interested in educational content and long-term investment strategies"
        },
        {
          name: "Re-engagement Candidates",
          description: "Previously active subscribers showing declining engagement",
          criteria: {
            dynamicRules: {
              engagement: { min: 10, max: 40 },
              activity: { daysSinceLastOpen: 14 }
            }
          },
          subscriberCount: Math.floor(targetCount * 0.20),
          growth: -5.2,
          potentialRevenue: Math.floor(targetCount * 0.20 * 50),
          engagementScore: 25,
          churnRisk: "high",
          isDetected: true,
          isDynamic: true,
          aiInsights: "This segment responds well to win-back campaigns with exclusive offers"
        }
      ];

      await db.insert(emailSegments).values(detectedSegments);
      
      // Create demo assignments with shareable links
      const demoAssignments = [
        {
          publisherId: "demo-publisher",
          title: "Q1 Market Analysis Report",
          description: "Comprehensive analysis of Q1 market performance and trends for premium subscribers",
          type: "research",
          status: "in_progress",
          priority: "high",
          assignedTo: "analyst-1",
          content: "Market analysis covering tech sector performance, emerging trends, and investment opportunities.",
          shareableSlug: generateShareableSlug(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
        {
          publisherId: "demo-publisher",
          title: "Weekly Portfolio Newsletter",
          description: "Regular weekly update on portfolio performance and recommended trades",
          type: "newsletter",
          status: "unassigned",
          priority: "urgent",
          shareableSlug: generateShareableSlug(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        },
        {
          publisherId: "demo-publisher",
          title: "AI Sector Deep Dive",
          description: "In-depth analysis of artificial intelligence companies and investment opportunities",
          type: "analysis",
          status: "review",
          priority: "medium",
          assignedTo: "writer-1",
          shareableSlug: generateShareableSlug(),
          content: "Detailed examination of leading AI companies, including financial metrics and growth projections.",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
        {
          publisherId: "demo-publisher",
          title: "Breaking: Fed Rate Decision",
          description: "Urgent article on Federal Reserve interest rate decision and market impact",
          type: "article",
          status: "approved",
          priority: "urgent",
          assignedTo: "editor-1",
          shareableSlug: generateShareableSlug(),
          content: "Federal Reserve announces rate decision. Analysis of market reaction and investment implications.",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        },
      ];
      
      await db.insert(assignments).values(demoAssignments).onConflictDoNothing();

      res.json({
        success: true,
        message: "Demo environment created successfully",
        userId: demoUser.id,
        metadata: onboardingMetadata,
        stats: {
          subscribers: sampleSubscribers.length,
          campaigns: sampleCampaigns.length,
          segments: detectedSegments.length,
          assignments: demoAssignments.length
        }
      });
    } catch (error) {
      console.error("Demo onboarding error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create demo environment" 
      });
    }
  });

  // Get demo stats
  app.get("/api/demo/stats", async (req, res) => {
    try {
      const subscriberCount = await db.select().from(subscribers);
      const campaignCount = await db.select().from(campaigns);
      const segmentCount = await db.select().from(emailSegments);

      res.json({
        subscribers: subscriberCount.length,
        campaigns: campaignCount.length,
        segments: segmentCount.length,
        isDemo: true
      });
    } catch (error) {
      console.error("Error fetching demo stats:", error);
      res.status(500).json({ message: "Failed to fetch demo stats" });
    }
  });

  // Reset demo data
  app.post("/api/demo/reset", async (req, res) => {
    try {
      // Clear demo data (keeping structure intact)
      await db.delete(subscribers).where(eq(subscribers.isActive, true));
      await db.delete(campaigns).where(eq(campaigns.status, "draft"));
      await db.delete(emailSegments).where(eq(emailSegments.isDetected, true));

      res.json({
        success: true,
        message: "Demo data reset successfully"
      });
    } catch (error) {
      console.error("Error resetting demo:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to reset demo data" 
      });
    }
  });
}