import { tenantStorage } from "./storage-multitenant";
import { hashPassword } from "./middleware/tenant";

export async function seedDemoData() {
  try {
    console.log("🌱 Starting demo data seeding...");

    // Create demo publisher
    const demoPublisher = await tenantStorage.createPublisher({
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

    // Create demo admin user
    const hashedPassword = await hashPassword("demo123");
    const demoUser = await tenantStorage.createUser({
      publisherId: demoPublisher.id,
      username: "demo",
      email: "demo@sharpsend.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log(`✅ Created demo user: ${demoUser.id}`);

    // Create demo subscribers
    const demoSubscribers = [
      {
        publisherId: demoPublisher.id,
        email: "alice.johnson@example.com",
        name: "Alice Johnson",
        segment: "premium",
        engagementScore: "85.5",
        revenue: "150.00",
        preferences: {
          topics: ["technology", "business"],
          frequency: "weekly",
          format: "html",
        },
        tags: ["high-value", "tech-enthusiast"],
      },
      {
        publisherId: demoPublisher.id,
        email: "bob.smith@example.com",
        name: "Bob Smith",
        segment: "general",
        engagementScore: "72.3",
        revenue: "45.00",
        preferences: {
          topics: ["business", "finance"],
          frequency: "bi-weekly",
          format: "html",
        },
        tags: ["regular-reader"],
      },
      {
        publisherId: demoPublisher.id,
        email: "carol.davis@example.com",
        name: "Carol Davis",
        segment: "vip",
        engagementScore: "92.1",
        revenue: "320.00",
        preferences: {
          topics: ["technology", "innovation", "startups"],
          frequency: "daily",
          format: "html",
        },
        tags: ["vip", "early-adopter", "high-value"],
      },
      {
        publisherId: demoPublisher.id,
        email: "david.wilson@example.com",
        name: "David Wilson",
        segment: "general",
        engagementScore: "58.7",
        revenue: "25.00",
        preferences: {
          topics: ["business"],
          frequency: "monthly",
          format: "text",
        },
        tags: ["casual-reader"],
      },
      {
        publisherId: demoPublisher.id,
        email: "emma.brown@example.com",
        name: "Emma Brown",
        segment: "premium",
        engagementScore: "78.9",
        revenue: "95.00",
        preferences: {
          topics: ["technology", "design"],
          frequency: "weekly",
          format: "html",
        },
        tags: ["designer", "creative"],
      },
      {
        publisherId: demoPublisher.id,
        email: "frank.miller@example.com",
        name: "Frank Miller",
        segment: "general",
        engagementScore: "65.4",
        revenue: "35.00",
        preferences: {
          topics: ["business", "marketing"],
          frequency: "weekly",
          format: "html",
        },
        tags: ["marketer"],
      },
      {
        publisherId: demoPublisher.id,
        email: "grace.taylor@example.com",
        name: "Grace Taylor",
        segment: "vip",
        engagementScore: "88.2",
        revenue: "275.00",
        preferences: {
          topics: ["technology", "business", "leadership"],
          frequency: "daily",
          format: "html",
        },
        tags: ["vip", "executive", "high-value"],
      },
      {
        publisherId: demoPublisher.id,
        email: "henry.anderson@example.com",
        name: "Henry Anderson",
        segment: "premium",
        engagementScore: "81.6",
        revenue: "120.00",
        preferences: {
          topics: ["technology", "innovation"],
          frequency: "bi-weekly",
          format: "html",
        },
        tags: ["tech-lead", "innovator"],
      },
    ];

    const createdSubscribers = await tenantStorage.bulkImportSubscribers(demoSubscribers);
    console.log(`✅ Created ${createdSubscribers.length} demo subscribers`);

    // Create demo campaigns
    const demoCampaigns = [
      {
        publisherId: demoPublisher.id,
        name: "Weekly Tech Insights #47",
        subjectLine: "🚀 AI Revolution: What Every Business Leader Needs to Know",
        content: `
          <h1>Welcome to Weekly Tech Insights</h1>
          <p>Hello {{subscriber.name}},</p>
          
          <p>This week, we're diving deep into the AI revolution that's transforming businesses across every industry. From automation to personalization, AI is no longer a future concept—it's happening now.</p>
          
          <h2>🔥 This Week's Highlights</h2>
          <ul>
            <li><strong>AI in Customer Service:</strong> How chatbots are reducing response times by 80%</li>
            <li><strong>Predictive Analytics:</strong> Companies using AI to forecast demand with 95% accuracy</li>
            <li><strong>Personalization at Scale:</strong> Netflix's recommendation engine generates $1B in value annually</li>
          </ul>
          
          <h2>💡 Key Takeaway</h2>
          <p>The companies that embrace AI today will be the leaders of tomorrow. Don't wait—start your AI journey now.</p>
          
          <p><a href="https://demo.sharpsend.com/read-more" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Read Full Article</a></p>
          
          <p>Best regards,<br>The Demo Newsletter Team</p>
        `,
        status: "sent",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        openRate: "68.5",
        clickRate: "12.3",
        revenue: "145.00",
        subscriberCount: 8,
      },
      {
        publisherId: demoPublisher.id,
        name: "Product Launch: SharpSend 2.0",
        subjectLine: "🎉 Introducing SharpSend 2.0 - AI-Powered Personalization",
        content: `
          <h1>SharpSend 2.0 is Here!</h1>
          <p>Dear {{subscriber.name}},</p>
          
          <p>We're thrilled to announce the launch of SharpSend 2.0, featuring groundbreaking AI-powered personalization that will transform how you connect with your audience.</p>
          
          <h2>🆕 What's New</h2>
          <ul>
            <li><strong>Smart Content Generation:</strong> AI creates personalized content for each subscriber</li>
            <li><strong>Predictive Send Times:</strong> Automatically send emails when subscribers are most likely to engage</li>
            <li><strong>Advanced Segmentation:</strong> Dynamic segments based on behavior and preferences</li>
            <li><strong>Real-time Optimization:</strong> A/B tests that adapt in real-time</li>
          </ul>
          
          <h2>🚀 Early Results</h2>
          <p>Beta users are seeing incredible results:</p>
          <ul>
            <li>📈 45% increase in open rates</li>
            <li>💰 67% boost in revenue per email</li>
            <li>⚡ 80% reduction in content creation time</li>
          </ul>
          
          <p><a href="https://demo.sharpsend.com/upgrade" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Upgrade Now</a></p>
          
          <p>Ready to revolutionize your email marketing?</p>
          
          <p>Best,<br>The SharpSend Team</p>
        `,
        status: "sent",
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        openRate: "74.2",
        clickRate: "18.7",
        revenue: "320.00",
        subscriberCount: 8,
      },
      {
        publisherId: demoPublisher.id,
        name: "Monthly Business Roundup",
        subjectLine: "📊 March Business Insights: Growth Strategies That Work",
        content: `
          <h1>Monthly Business Roundup</h1>
          <p>Hi {{subscriber.name}},</p>
          
          <p>March was an incredible month for business innovation. Here are the key insights and strategies that successful companies are using to drive growth.</p>
          
          <h2>📈 Growth Strategies</h2>
          <ol>
            <li><strong>Customer-Centric Approach:</strong> Companies focusing on customer experience see 60% higher profits</li>
            <li><strong>Data-Driven Decisions:</strong> Organizations using analytics are 5x more likely to make faster decisions</li>
            <li><strong>Employee Engagement:</strong> Engaged teams show 21% higher profitability</li>
          </ol>
          
          <h2>🎯 Action Items for April</h2>
          <ul>
            <li>Audit your customer journey for friction points</li>
            <li>Implement weekly data review meetings</li>
            <li>Survey your team on engagement levels</li>
          </ul>
          
          <p><a href="https://demo.sharpsend.com/april-guide" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get April Action Guide</a></p>
          
          <p>Here's to a successful April!</p>
          
          <p>Cheers,<br>Business Insights Team</p>
        `,
        status: "draft",
        openRate: "0",
        clickRate: "0",
        revenue: "0",
        subscriberCount: 8,
      },
    ];

    for (const campaignData of demoCampaigns) {
      const campaign = await tenantStorage.createCampaign(campaignData);
      console.log(`✅ Created demo campaign: ${campaign.name}`);
    }

    // Create demo A/B tests
    const demoABTest = await tenantStorage.createABTest({
      publisherId: demoPublisher.id,
      name: "Subject Line Test - AI vs Human",
      status: "completed",
      variantA: {
        subjectLine: "🚀 AI Revolution: What Every Business Leader Needs to Know",
        content: "AI-generated subject line",
        openRate: 68.5,
        clickRate: 12.3,
        sent: 4,
      },
      variantB: {
        subjectLine: "The Future of Business: AI Transformation Guide",
        content: "Human-written subject line",
        openRate: 61.2,
        clickRate: 10.8,
        sent: 4,
      },
      confidenceLevel: "95.2",
    });

    console.log(`✅ Created demo A/B test: ${demoABTest.id}`);

    // Create demo email integrations
    const demoEmailIntegration = await tenantStorage.createEmailIntegration({
      publisherId: demoPublisher.id,
      platform: "sendgrid",
      isConnected: true,
      apiKey: "demo_api_key_sendgrid",
      campaignsSent: 15,
      status: "active",
      config: {
        fromEmail: "newsletter@demo.sharpsend.com",
        fromName: "Demo Newsletter",
        replyTo: "support@demo.sharpsend.com",
      },
    });

    console.log(`✅ Created demo email integration: ${demoEmailIntegration.id}`);

    // Create demo analytics
    const analyticsData = [
      {
        publisherId: demoPublisher.id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        totalSubscribers: 8,
        engagementRate: "71.2",
        churnRate: "2.1",
        monthlyRevenue: "465.00",
        revenueGrowth: "15.3",
        openRate: "68.5",
        clickRate: "12.3",
        unsubscribeRate: "0.8",
      },
      {
        publisherId: demoPublisher.id,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        totalSubscribers: 7,
        engagementRate: "69.8",
        churnRate: "2.3",
        monthlyRevenue: "403.00",
        revenueGrowth: "12.7",
        openRate: "66.2",
        clickRate: "11.9",
        unsubscribeRate: "1.1",
      },
      {
        publisherId: demoPublisher.id,
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        totalSubscribers: 6,
        engagementRate: "67.5",
        churnRate: "2.8",
        monthlyRevenue: "358.00",
        revenueGrowth: "8.9",
        openRate: "64.1",
        clickRate: "10.5",
        unsubscribeRate: "1.4",
      },
    ];

    for (const analytics of analyticsData) {
      await tenantStorage.createAnalytics(analytics);
    }

    console.log(`✅ Created demo analytics data`);

    // Create demo AI content history
    const aiContentHistory = [
      {
        publisherId: demoPublisher.id,
        prompt: "Generate a compelling subject line for a newsletter about AI in business",
        generatedContent: "🚀 AI Revolution: What Every Business Leader Needs to Know",
        contentType: "subject_line" as const,
        model: "gpt-4",
        tokensUsed: 45,
      },
      {
        publisherId: demoPublisher.id,
        prompt: "Create personalized opening for premium subscriber interested in technology",
        generatedContent: "Hi Alice! As a technology enthusiast, you'll love this week's deep dive into AI innovations...",
        contentType: "personalization" as const,
        model: "gpt-4",
        tokensUsed: 78,
      },
      {
        publisherId: demoPublisher.id,
        prompt: "Write a newsletter section about AI customer service benefits",
        generatedContent: "AI-powered customer service is transforming how businesses interact with their customers. Companies implementing chatbots and automated support systems are seeing response times decrease by up to 80% while maintaining high satisfaction scores...",
        contentType: "body" as const,
        model: "gpt-4",
        tokensUsed: 156,
      },
    ];

    for (const content of aiContentHistory) {
      await tenantStorage.createAiContentHistory(content);
    }

    console.log(`✅ Created demo AI content history`);

    console.log("🎉 Demo data seeding completed successfully!");
    console.log(`
📧 Demo Account Details:
- Subdomain: demo.sharpsend.com
- Email: demo@sharpsend.com
- Password: demo123
- Publisher ID: ${demoPublisher.id}
- User ID: ${demoUser.id}
- Subscribers: ${createdSubscribers.length}
- Campaigns: ${demoCampaigns.length}
    `);

    return {
      publisher: demoPublisher,
      user: demoUser,
      subscribers: createdSubscribers,
      message: "Demo data seeded successfully",
    };
  } catch (error) {
    console.error("❌ Demo data seeding failed:", error);
    throw error;
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

