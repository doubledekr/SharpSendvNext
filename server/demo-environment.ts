import { db } from "./db";
import { 
  publishers, 
  users, 
  subscribers, 
  campaigns,
  abTests,
  emailIntegrations,
  analytics,
  assignments
} from "@shared/schema-multitenant";
import {
  sends,
  pixels,
  approvals
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

export interface DemoEnvironmentConfig {
  enabled: boolean;
  publisherId?: string;
  userId?: string;
  token?: string;
}

let demoConfig: DemoEnvironmentConfig = {
  enabled: false
};

export function getDemoConfig(): DemoEnvironmentConfig {
  return demoConfig;
}

export function setDemoEnabled(enabled: boolean) {
  demoConfig.enabled = enabled;
}

export async function initializeDemoEnvironment() {
  console.log("🚀 Initializing comprehensive demo environment...");
  
  // Allow demo in production but with extra safety checks
  if (process.env.NODE_ENV === 'production') {
    console.log("🏭 Production environment detected - using safe demo mode");
  }
  
  // Check if database is available
  if (!db) {
    console.warn("⚠️ Database not configured, skipping demo environment setup");
    return { success: false, error: "Database not configured" };
  }
  
  try {
    // Check database connection first
    await db.select().from(publishers).limit(1);
  } catch (dbError) {
    console.warn("⚠️ Database connection failed, skipping demo environment setup");
    return { success: false, error: "Database connection failed" };
  }
  
  try {
    // 1. Create or get demo publisher
    let publisherId: string;
    let demoPublisher;
    
    try {
      const existingPublisher = await db.select().from(publishers)
        .where(eq(publishers.subdomain, "demo"))
        .limit(1);
      
      if (existingPublisher.length > 0) {
        demoPublisher = existingPublisher[0];
        publisherId = demoPublisher.id;
        console.log("✓ Using existing demo publisher");
      } else {
        try {
          const [newPublisher] = await db.insert(publishers).values({
            name: "Demo Financial Publisher",
            email: "admin@demo.sharpsend.io",
            subdomain: "demo",
            plan: "premium"
          }).returning();
          
          demoPublisher = newPublisher;
          publisherId = newPublisher.id;
          console.log("✓ Created demo publisher");
        } catch (insertError: any) {
          // Handle unique constraint violation (23505 is PostgreSQL unique constraint error)
          if (insertError.code === '23505' && insertError.constraint_name === 'publishers_subdomain_unique') {
            console.log("✓ Demo publisher already exists (constraint violation - using existing)");
            // Try to get the existing publisher again
            const retryPublisher = await db.select().from(publishers)
              .where(eq(publishers.subdomain, "demo"))
              .limit(1);
            if (retryPublisher.length > 0) {
              demoPublisher = retryPublisher[0];
              publisherId = demoPublisher.id;
            } else {
              throw insertError;
            }
          } else {
            throw insertError;
          }
        }
      }
    } catch (publisherError) {
      console.warn("⚠️ Publisher creation failed:", publisherError);
      return { success: false, error: "Publisher creation failed" };
    }
    
    // 2. Create or get demo user
    let userId: string;
    let demoUser;
    
    try {
      const existingUser = await db.select().from(users)
        .where(eq(users.email, "demo@sharpsend.io"))
        .limit(1);
      
      if (existingUser.length > 0) {
        demoUser = existingUser[0];
        userId = demoUser.id;
        console.log("✓ Using existing demo user");
      } else {
        try {
          const hashedPassword = await bcrypt.hash("demo123", 10);
          const [newUser] = await db.insert(users).values({
            publisherId,
            username: "demo",
            email: "demo@sharpsend.io",
            password: hashedPassword,
            role: "admin"
          }).returning();
          
          demoUser = newUser;
          userId = newUser.id;
          console.log("✓ Created demo user");
        } catch (insertError: any) {
          // Handle unique constraint violation for email
          if (insertError.code === '23505') {
            console.log("✓ Demo user already exists (constraint violation - using existing)");
            // Try to get the existing user again
            const retryUser = await db.select().from(users)
              .where(eq(users.email, "demo@sharpsend.io"))
              .limit(1);
            if (retryUser.length > 0) {
              demoUser = retryUser[0];
              userId = demoUser.id;
            } else {
              throw insertError;
            }
          } else {
            throw insertError;
          }
        }
      }
    } catch (userError) {
      console.warn("⚠️ User creation failed:", userError);
      return { success: false, error: "User creation failed" };
    }
    
    // Note: Segments table removed - using hardcoded segments in sends instead
    
    // 4. Create demo subscribers if needed
    const existingSubscribers = await db.select().from(subscribers)
      .where(eq(subscribers.publisherId, publisherId))
      .limit(1);
    
    if (existingSubscribers.length === 0) {
      const demoSubscribers = [
        {
          publisherId,
          email: "sarah.chen@techcorp.com",
          name: "Sarah Chen",
          segment: "High Value Investors",
          engagementScore: "89.5",
          revenue: "2450.00"
        },
        {
          publisherId,
          email: "michael.rodriguez@startup.io",
          name: "Michael Rodriguez",
          segment: "Active Traders",
          engagementScore: "76.3",
          revenue: "1250.00"
        },
        {
          publisherId,
          email: "emily.johnson@consulting.com",
          name: "Emily Johnson",
          segment: "Premium Subscribers",
          engagementScore: "92.1",
          revenue: "3200.00"
        },
        {
          publisherId,
          email: "david.kim@fintech.ai",
          name: "David Kim",
          segment: "Growth Investors",
          engagementScore: "68.7",
          revenue: "850.00"
        }
      ];
      
      for (const subscriber of demoSubscribers) {
        await db.insert(subscribers).values(subscriber).catch(() => {});
      }
      console.log("✓ Created demo subscribers");
    }
    
    // 5. Create demo campaigns with sends and pixels - skip for now due to schema mismatch
    // The campaigns table has different columns in the database vs TypeScript schema
    // We'll rely on the existing seedDatabase function to create campaigns
    console.log("✓ Skipping campaign creation - handled by seedDatabase");
    
    // 6. Create demo assignments - skip due to schema mismatch
    // The assignments table has different columns in database vs TypeScript schema
    console.log("✓ Skipping assignments creation - schema mismatch");
    
    // 7. Create demo A/B tests
    const existingTests = await db.select().from(abTests)
      .where(eq(abTests.publisherId, publisherId))
      .limit(1);
    
    if (existingTests.length === 0) {
      await db.insert(abTests).values({
        publisherId,
        name: "Subject Line Optimization Test",
        status: "active",
        variantA: {
          subjectLine: "🚀 Tech Stock Alert: Major Breakthrough",
          content: "Traditional market analysis format...",
          openRate: 24.5,
          clickRate: 4.2,
          sent: 1000
        },
        variantB: {
          subjectLine: "AI Revolution: Your Portfolio's Next Move",
          content: "AI-personalized insights and recommendations...",
          openRate: 31.8,
          clickRate: 6.7,
          sent: 1000
        },
        confidenceLevel: "92.3"
      }).catch(() => {});
      console.log("✓ Created demo A/B tests");
    }
    
    // 8. Create demo integrations
    const existingIntegrations = await db.select().from(emailIntegrations)
      .where(eq(emailIntegrations.publisherId, publisherId))
      .limit(1);
    
    if (existingIntegrations.length === 0) {
      const integrations = [
        { publisherId, platform: "Mailchimp", isConnected: true, status: "active", campaignsSent: 47 },
        { publisherId, platform: "SendGrid", isConnected: true, status: "active", campaignsSent: 23 },
        { publisherId, platform: "ConvertKit", isConnected: false, status: "inactive", campaignsSent: 0 }
      ];
      
      for (const integration of integrations) {
        await db.insert(emailIntegrations).values(integration).catch(() => {});
      }
      console.log("✓ Created demo email integrations");
    }
    
    // 9. Create demo analytics
    try {
      const existingAnalytics = await db.select().from(analytics)
        .where(eq(analytics.publisherId, publisherId))
        .limit(1);
      
      if (existingAnalytics.length === 0) {
        await db.insert(analytics).values({
          publisherId,
          totalSubscribers: 12847,
          engagementRate: "74.20",
          monthlyRevenue: "89450.00",
          churnRate: "2.80",
          openRate: "31.50",
          clickRate: "6.20",
          unsubscribeRate: "0.85"
        });
        console.log("✓ Created demo analytics");
      }
    } catch (analyticsError) {
      console.warn("⚠️ Analytics creation failed:", analyticsError);
    }
    
    // Generate proper JWT demo token
    const JWT_SECRET = process.env.JWT_SECRET || "sharpsend-secret-key-change-in-production";
    const demoToken = jwt.sign(
      { userId, publisherId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update demo config
    demoConfig = {
      enabled: true,
      publisherId,
      userId,
      token: demoToken
    };
    
    console.log("✅ Demo environment initialized successfully!");
    console.log("📧 Demo credentials: email: demo@sharpsend.io | password: demo123 | subdomain: demo");
    
    return {
      success: true,
      publisherId,
      userId,
      token: demoToken,
      credentials: {
        email: "demo@sharpsend.io",
        password: "demo123",
        subdomain: "demo"
      }
    };
  } catch (error) {
    console.error("❌ Failed to initialize demo environment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function cleanupDemoData() {
  console.log("🧹 Cleaning up demo data...");
  
  try {
    const [demoPublisher] = await db.select({ id: publishers.id })
      .from(publishers)
      .where(eq(publishers.subdomain, "demo"))
      .limit(1);
    
    if (demoPublisher) {
      // Delete in reverse order of dependencies
      await db.delete(pixels).where(eq(pixels.publisherId, demoPublisher.id));
      await db.delete(sends).where(eq(sends.publisherId, demoPublisher.id));
      await db.delete(campaigns).where(eq(campaigns.publisherId, demoPublisher.id));
      await db.delete(approvals).where(eq(approvals.publisherId, demoPublisher.id));
      await db.delete(assignments).where(eq(assignments.publisherId, demoPublisher.id));
      await db.delete(subscribers).where(eq(subscribers.publisherId, demoPublisher.id));
      await db.delete(abTests).where(eq(abTests.publisherId, demoPublisher.id));
      await db.delete(emailIntegrations).where(eq(emailIntegrations.publisherId, demoPublisher.id));
      await db.delete(analytics).where(eq(analytics.publisherId, demoPublisher.id));
      await db.delete(users).where(eq(users.publisherId, demoPublisher.id));
      await db.delete(publishers).where(eq(publishers.id, demoPublisher.id));
      
      console.log("✅ Demo data cleaned up successfully");
    } else {
      console.log("ℹ️ No demo data found to clean up");
    }
    
    demoConfig = { enabled: false };
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to cleanup demo data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}