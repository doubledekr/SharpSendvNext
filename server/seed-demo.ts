import { tenantStorage } from "./storage-multitenant";
import crypto from "crypto";

// Simple hash function for demo purposes
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function seedDemoData() {
  // Skip demo seeding in production environment unless specifically in demo mode
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
    console.log("🚫 Production environment detected - skipping demo data seeding");
    return { 
      message: "Demo seeding skipped in production",
      publisher: null,
      user: null,
      subscribers: []
    };
  }

  console.log("🌱 Starting demo data seeding...");

  try {
    // Try to create demo publisher, handle duplicates gracefully
    let demoPublisher;
    try {
      demoPublisher = await tenantStorage.createPublisher({
        name: "Demo Newsletter Co",
        email: "demo@sharpsend.com",
        subdomain: "demo",
        plan: "pro",
        settings: {
          branding: {
            logo: "/demo-logo.png",
            primaryColor: "#3b82f6",
            secondaryColor: "#1e40af",
          },
          features: {
            aiPersonalization: true,
            abTesting: true,
            advancedAnalytics: true,
          },
          limits: {
            maxSubscribers: 10000,
            maxCampaigns: 100,
            maxEmailsPerMonth: 50000,
          },
        },
      });
      console.log(`✅ Created demo publisher: ${demoPublisher.id}`);
    } catch (publisherError: any) {
      // Handle duplicate key constraint gracefully
      if (publisherError.message?.includes('duplicate') || publisherError.code === '23505') {
        console.log("✅ Demo publisher already exists, continuing with seeding");
        return {
          message: "Demo publisher already exists",
          publisher: null,
          user: null,
          subscribers: []
        };
      } else {
        throw publisherError;
      }
    }

    // Create demo admin user
    let demoUser;
    try {
      const hashedPassword = hashPassword("demo123");
      demoUser = await tenantStorage.createUser({
        publisherId: demoPublisher.id,
        username: "demo",
        email: "demo@sharpsend.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log(`✅ Created demo user: ${demoUser.id}`);
    } catch (userError: any) {
      if (userError.message?.includes('duplicate') || userError.code === '23505') {
        console.log("✅ Demo user already exists");
      } else {
        console.warn("⚠️ Failed to create demo user:", userError);
      }
    }

    console.log("🎉 Demo data seeding completed successfully!");
    return {
      publisher: demoPublisher,
      user: demoUser || null,
      subscribers: [],
      message: "Demo data seeded successfully",
    };

  } catch (error) {
    console.error("❌ Demo data seeding failed:", error);
    // Don't throw - just return error status
    return {
      message: "Demo seeding failed but continuing",
      publisher: null,
      user: null,
      subscribers: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run seeding if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .then(() => {
      console.log("Demo seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Demo seeding failed:", error);
      process.exit(1);
    });
}