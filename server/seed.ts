import { eq, and } from "drizzle-orm";
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
  
  // Skip seeding in production to prevent issues
  if (process.env.NODE_ENV === 'production') {
    console.log("🏭 Production environment detected - skipping database seeding");
    return { success: false, error: "Database seeding disabled in production" };
  }
  
  // Check if database is available
  if (!db) {
    console.warn("⚠️ Database not configured, skipping seeding");
    return { success: false, error: "Database not configured" };
  }
  
  try {
    // Create demo publisher first
    const existingPublisher = await db.select().from(publishers).where(eq(publishers.subdomain, "demo")).limit(1);
    
    let publisherId: string;
    if (existingPublisher.length > 0) {
      publisherId = existingPublisher[0].id;
      console.log("Demo publisher already exists, using existing one");
    } else {
      try {
        const demoPublisher = await db.insert(publishers).values({
          name: "Demo Publisher",
          email: "admin@demo.com",
          subdomain: "demo",
          plan: "premium"
        }).returning();
        publisherId = demoPublisher[0].id;
        console.log("Created new demo publisher");
      } catch (publisherError: any) {
        // Handle PostgreSQL unique constraint violation (error code 23505)
        if (publisherError.code === '23505') {
          console.log("Demo publisher already exists (unique constraint), fetching existing one");
          const retryPublisher = await db.select().from(publishers).where(eq(publishers.subdomain, "demo")).limit(1);
          if (retryPublisher.length > 0) {
            publisherId = retryPublisher[0].id;
          } else {
            console.error("Failed to find existing demo publisher after constraint violation");
            return { success: false, error: "Publisher creation failed" };
          }
        } else {
          console.error("Unexpected error creating demo publisher:", publisherError);
          return { success: false, error: publisherError.message };
        }
      }
    }

    // Check if demo user already exists before creating
    const existingUser = await db.select().from(users)
      .where(eq(users.email, "demo@example.com"))
      .limit(1);

    if (existingUser.length === 0) {
      try {
        const hashedPassword = await bcrypt.hash("demo", 10);
        await db.insert(users).values({
          publisherId: publisherId,
          username: "demo",
          email: "demo@example.com",
          password: hashedPassword,
          role: "admin"
        });
        console.log("Created demo user");
      } catch (userError) {
        console.warn("Failed to create demo user:", userError);
      }
    } else {
      console.log("Demo user already exists, skipping");
    }

    // No mock subscribers - only real data from integrations
    console.log("Skipping mock subscriber creation - only real integration data will be used");

    // Skip campaign seeding for now - table structure mismatch
    // Will be handled by demo-init endpoint instead

    // Create sample A/B tests
    try {
      const existingAbTest = await db.select().from(abTests)
        .where(eq(abTests.publisherId, publisherId))
        .limit(1);
      
      if (existingAbTest.length === 0) {
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
        });
        console.log("Created sample A/B test");
      } else {
        console.log("A/B test already exists, skipping");
      }
    } catch (abTestError) {
      console.warn("Failed to create A/B test:", abTestError);
    }

    // Create email integrations
    const integrations = [
      { publisherId: publisherId, platform: "Mailchimp", isConnected: true, status: "active", campaignsSent: 24 },
      { publisherId: publisherId, platform: "ConvertKit", isConnected: false, status: "inactive", campaignsSent: 0 },
      { publisherId: publisherId, platform: "Campaign Monitor", isConnected: false, status: "inactive", campaignsSent: 0 },
      { publisherId: publisherId, platform: "SendGrid", isConnected: true, status: "active", campaignsSent: 12 }
    ];

    for (const integration of integrations) {
      try {
        const existingIntegration = await db.select().from(emailIntegrations)
          .where(and(
            eq(emailIntegrations.publisherId, publisherId),
            eq(emailIntegrations.platform, integration.platform)
          ))
          .limit(1);
        
        if (existingIntegration.length === 0) {
          await db.insert(emailIntegrations).values(integration);
        }
      } catch (integrationError) {
        console.warn(`Failed to create integration ${integration.platform}:`, integrationError);
      }
    }

    // Create analytics data
    try {
      const existingAnalytics = await db.select().from(analytics)
        .where(eq(analytics.publisherId, publisherId))
        .limit(1);
      
      // Skip creating mock analytics data - only use real integration data
      console.log("Skipping mock analytics data - only real integration data will be used");
    } catch (analyticsError) {
      console.warn("Failed to create analytics data:", analyticsError);
    }

    // Seed email templates
    try {
      const { seedEmailTemplates } = await import('./seed-email-templates');
      await seedEmailTemplates();
    } catch (templateError) {
      console.warn("Failed to seed email templates:", templateError);
    }

    console.log("Database seeded successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}