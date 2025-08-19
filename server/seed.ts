import { eq } from "drizzle-orm";
import { db } from "./database";
import { 
  publishers,
  users, 
  subscribers, 
  campaigns, 
  abTests, 
  emailIntegrations, 
  analytics 
} from "@shared/schema-multitenant";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  console.log("Seeding database...");
  
  try {
    // Create demo publisher first
    const existingPublisher = await db.select().from(publishers).where(eq(publishers.subdomain, "demo")).limit(1);
    
    let publisherId: string;
    if (existingPublisher.length > 0) {
      publisherId = existingPublisher[0].id;
    } else {
      const demoPublisher = await db.insert(publishers).values({
        name: "Demo Publisher",
        email: "admin@demo.com",
        subdomain: "demo",
        plan: "premium"
      }).returning();
      publisherId = demoPublisher[0].id;
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash("demo", 10);
    await db.insert(users).values({
      publisherId: publisherId,
      username: "demo",
      email: "demo@example.com",
      password: hashedPassword,
      role: "admin"
    }).onConflictDoNothing();

    // Create sample subscribers
    const sampleSubscribers = [
      {
        publisherId: publisherId,
        email: "sarah.chen@techcorp.com",
        name: "Sarah Chen",
        segment: "High Value",
        engagementScore: "89.5",
        revenue: "1200.00"
      },
      {
        publisherId: publisherId,
        email: "michael.rodriguez@startup.io",
        name: "Michael Rodriguez", 
        segment: "Growth",
        engagementScore: "76.3",
        revenue: "850.00"
      },
      {
        publisherId: publisherId,
        email: "emily.johnson@consulting.com",
        name: "Emily Johnson",
        segment: "Premium",
        engagementScore: "92.1",
        revenue: "2400.00"
      },
      {
        publisherId: publisherId,
        email: "david.kim@fintech.ai",
        name: "David Kim",
        segment: "High Value",
        engagementScore: "84.7",
        revenue: "1750.00"
      },
      {
        publisherId: publisherId,
        email: "alexandra.popov@hedge.fund",
        name: "Alexandra Popov",
        segment: "Premium",
        engagementScore: "88.9",
        revenue: "3200.00"
      },
      {
        publisherId: publisherId,
        email: "james.wright@investment.com",
        name: "James Wright",
        segment: "Growth",
        engagementScore: "72.4",
        revenue: "680.00"
      },
      {
        publisherId: publisherId,
        email: "maria.gonzalez@analytics.co",
        name: "Maria Gonzalez",
        segment: "High Value",
        engagementScore: "85.2",
        revenue: "1450.00"
      },
      {
        publisherId: publisherId,
        email: "robert.taylor@quant.ai",
        name: "Robert Taylor",
        segment: "Premium",
        engagementScore: "90.6",
        revenue: "2800.00"
      }
    ];

    for (const subscriber of sampleSubscribers) {
      await db.insert(subscribers).values(subscriber).onConflictDoNothing();
    }

    // Skip campaign seeding for now - table structure mismatch
    // Will be handled by demo-init endpoint instead

    // Create sample A/B tests
    await db.insert(abTests).values({
      publisherId: publisherId,
      name: "Subject Line Optimization",
      status: "active",
      variantA: {
        subjectLine: "🚀 Breakthrough Tech Stock Alert",
        content: "Traditional version of our tech stock analysis...",
        openRate: 24.5,
        clickRate: 4.2,
        sent: 4
      },
      variantB: {
        subjectLine: "Tech Stock Alert: AI Revolution Continues",
        content: "Personalized version with AI-driven insights...",
        openRate: 31.8,
        clickRate: 6.1,
        sent: 4
      },
      confidenceLevel: "87.3"
    }).onConflictDoNothing();

    // Create email integrations
    const integrations = [
      { publisherId: publisherId, platform: "Mailchimp", isConnected: true, status: "active", campaignsSent: 24 },
      { publisherId: publisherId, platform: "ConvertKit", isConnected: false, status: "inactive", campaignsSent: 0 },
      { publisherId: publisherId, platform: "Campaign Monitor", isConnected: false, status: "inactive", campaignsSent: 0 },
      { publisherId: publisherId, platform: "SendGrid", isConnected: true, status: "active", campaignsSent: 12 }
    ];

    for (const integration of integrations) {
      await db.insert(emailIntegrations).values(integration).onConflictDoNothing();
    }

    // Create analytics data
    await db.insert(analytics).values({
      publisherId: publisherId,
      totalSubscribers: 8,
      engagementRate: "71.2",
      churnRate: "2.1", 
      monthlyRevenue: "13600.00",
      revenueGrowth: "15.3"
    }).onConflictDoNothing();

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}