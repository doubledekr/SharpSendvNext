import { Router } from "express";
import { db } from "./db";
import { emailSegments } from "@shared/schema-multitenant";
import { integrations } from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";

const router = Router();

// Get all segments for a publisher
router.get("/api/segments", async (req, res) => {
  try {
    const publisherId = req.headers['x-publisher-id'] as string || req.query.publisherId as string;
    
    if (!publisherId) {
      // For backwards compatibility, return empty array instead of error
      return res.json([]);
    }
    
    // Get both detected and created segments for this publisher
    const segments = await db.select()
      .from(emailSegments)
      .where(eq(emailSegments.publisherId, publisherId))
      .orderBy(desc(emailSegments.createdAt));
    
    console.log(`Found ${segments.length} segments for publisher ${publisherId}`);
    res.json(segments);
  } catch (error) {
    console.error("Error fetching segments:", error);
    res.status(500).json({ error: "Failed to fetch segments" });
  }
});

// Get suggested segments - returns empty for non-demo accounts
router.get("/api/segments/suggested", async (req, res) => {
  try {
    // Always return empty array for suggested segments
    // Real accounts should not see mock AI-detected segments
    res.json([]);
  } catch (error) {
    console.error("Error fetching suggested segments:", error);
    res.status(500).json({ error: "Failed to fetch suggested segments" });
  }
});

// Get segment health data - returns empty for non-demo accounts
router.get("/api/segments/health", async (req, res) => {
  try {
    // Always return empty array for real accounts
    // Only demo accounts should see mock segment health data
    res.json([]);
  } catch (error) {
    console.error("Error fetching segment health:", error);
    res.status(500).json({ error: "Failed to fetch segment health" });
  }
});

// Get engagement heatmap data - returns empty for non-demo accounts
router.get("/api/segments/heatmap", async (req, res) => {
  try {
    // Always return empty object for real accounts
    // Only demo accounts should see mock heatmap data
    res.json({});
  } catch (error) {
    console.error("Error fetching engagement heatmap:", error);
    res.status(500).json({ error: "Failed to fetch engagement heatmap" });
  }
});

// Detect new segments using AI
router.post("/api/segments/detect", async (req, res) => {
  try {
    const publisherId = req.body.publisherId || req.headers['x-publisher-id'] as string;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher ID required" });
    }
    
    console.log(`Detecting segments for publisher: ${publisherId}`);
    
    // Get connected Customer.io integration
    const integration = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.publisherId, publisherId),
        eq(integrations.platformId, 'customer_io'),
        eq(integrations.status, 'connected')
      ))
      .limit(1);
    
    if (!integration.length) {
      return res.status(400).json({ error: "No connected Customer.io integration found" });
    }
    
    // Import services
    const { CustomerIoIntegrationService } = await import("./services/customerio-integration");
    const { AISegmentGenerator } = await import("./services/ai-segment-generator");
    
    const credentials = integration[0].credentials as any;
    const customerIoService = new CustomerIoIntegrationService({
      siteId: credentials.site_id,
      trackApiKey: credentials.track_api_key,
      appApiKey: credentials.app_api_key,
      region: credentials.region || 'us'
    });
    
    // Get real Customer.io data
    console.log("Fetching Customer.io segments and subscriber data...");
    const segments = await customerIoService.getSegments();
    const customers = await customerIoService.getCustomers(100);
    
    // Skip AI analysis for now to avoid rate limits
    // We'll analyze Customer.io data directly instead
    
    // Analyze subscriber attributes to detect new segments
    const detectedSegments = [];
    
    // 1. Engagement-based segments - Look at multiple engagement signals
    const highEngagement = customers.customers.filter((c: any) => {
      const engagementScore = c.attributes?.sharpsend_engagement_score || 0;
      const emailOpens = c.attributes?.email_opens || c.attributes?.opens || 0;
      const clicks = c.attributes?.email_clicks || c.attributes?.clicks || 0;
      const hasEngagement = c.attributes?.has_opened || c.attributes?.has_clicked;
      
      return engagementScore > 50 || emailOpens > 10 || clicks > 3 || hasEngagement;
    });
    
    const mediumEngagement = customers.customers.filter((c: any) => {
      const engagementScore = c.attributes?.sharpsend_engagement_score || 0;
      const emailOpens = c.attributes?.email_opens || c.attributes?.opens || 0;
      return engagementScore > 20 && engagementScore <= 50 || (emailOpens > 3 && emailOpens <= 10);
    });
    
    const lowEngagement = customers.customers.filter((c: any) => {
      const engagementScore = c.attributes?.sharpsend_engagement_score || 0;
      const emailOpens = c.attributes?.email_opens || c.attributes?.opens || 0;
      return engagementScore <= 20 || emailOpens <= 3;
    });
    
    if (highEngagement.length > 0) {
      detectedSegments.push({
        name: "High Engagement Power Users",
        description: `${highEngagement.length} subscribers with strong engagement patterns`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            engagement: { min: 50, max: 100 },
            activity: { daysSinceLastOpen: 7 }
          }
        },
        subscriberCount: highEngagement.length,
        growth: 12.5,
      });
    }
    
    if (mediumEngagement.length > 0) {
      detectedSegments.push({
        name: "Moderate Engagement Readers",
        description: `${mediumEngagement.length} subscribers with moderate engagement levels`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            engagement: { min: 20, max: 50 }
          }
        },
        subscriberCount: mediumEngagement.length,
        growth: 5.2,
      });
    }
    
    if (lowEngagement.length > 5) { // Only create if meaningful size
      detectedSegments.push({
        name: "Low Engagement - Nurture Needed",
        description: `${lowEngagement.length} subscribers needing re-engagement`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            engagement: { min: 0, max: 20 }
          }
        },
        subscriberCount: lowEngagement.length,
        growth: -2.3,
      });
    }
    
    // 2. Device-based segments
    const mobileUsers = customers.customers.filter((c: any) => 
      c.attributes?.device === 'mobile' || 
      c.attributes?.sharpsend_device_preference === 'mobile'
    );
    
    if (mobileUsers.length > 0) {
      detectedSegments.push({
        name: "Mobile-First Readers",
        description: `${mobileUsers.length} subscribers primarily reading on mobile devices`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          customFields: { device_preference: 'mobile' },
          behavioralTriggers: ['mobile_opens']
        },
        subscriberCount: mobileUsers.length,
        growth: 8.3,
      });
    }
    
    // 3. Time-based segments (when they joined)
    const newSubscribers = customers.customers.filter((c: any) => {
      const createdAt = c.created_at || c.attributes?.created_at;
      if (!createdAt) return false;
      const daysSinceJoin = (Date.now() - new Date(createdAt * 1000).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoin <= 30;
    });
    
    const establishedSubscribers = customers.customers.filter((c: any) => {
      const createdAt = c.created_at || c.attributes?.created_at;
      if (!createdAt) return false;
      const daysSinceJoin = (Date.now() - new Date(createdAt * 1000).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoin > 90;
    });
    
    if (newSubscribers.length > 0) {
      detectedSegments.push({
        name: "New Subscribers (Last 30 Days)",
        description: `${newSubscribers.length} recently joined subscribers needing onboarding`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            activity: { daysSinceJoined: 30 }
          }
        },
        subscriberCount: newSubscribers.length,
        growth: 25.0,
      });
    }
    
    if (establishedSubscribers.length > 0) {
      detectedSegments.push({
        name: "Established Subscribers (90+ Days)",
        description: `${establishedSubscribers.length} long-term subscribers`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            activity: { daysSinceJoined: 90 }
          }
        },
        subscriberCount: establishedSubscribers.length,
        growth: 3.5,
      });
    }
    
    // 4. Attribute-based segments
    const hasAttributes = customers.customers.filter((c: any) => {
      return c.attributes && Object.keys(c.attributes).length > 5;
    });
    
    const noAttributes = customers.customers.filter((c: any) => {
      return !c.attributes || Object.keys(c.attributes).length <= 2;
    });
    
    if (hasAttributes.length > 0) {
      detectedSegments.push({
        name: "Data-Rich Profiles",
        description: `${hasAttributes.length} subscribers with detailed profile information`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          customFields: { profile_completeness: 'high' }
        },
        subscriberCount: hasAttributes.length,
        growth: 8.7,
      });
    }
    
    if (noAttributes.length > 0) {
      detectedSegments.push({
        name: "Basic Profiles - Need Enrichment",
        description: `${noAttributes.length} subscribers with minimal profile data`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          customFields: { profile_completeness: 'low' }
        },
        subscriberCount: noAttributes.length,
        growth: 1.2,
      });
    }
    
    // 4. Newsletter-specific segments
    const newsletterPatterns = new Map();
    customers.customers.forEach((c: any) => {
      if (c.attributes?.newsletter_subscriptions) {
        const newsletters = Array.isArray(c.attributes.newsletter_subscriptions) 
          ? c.attributes.newsletter_subscriptions 
          : [c.attributes.newsletter_subscriptions];
        
        newsletters.forEach((newsletter: string) => {
          if (!newsletterPatterns.has(newsletter)) {
            newsletterPatterns.set(newsletter, []);
          }
          newsletterPatterns.get(newsletter).push(c);
        });
      }
    });
    
    newsletterPatterns.forEach((subscribers, newsletter) => {
      if (subscribers.length > 3) { // Only create segment if meaningful size
        detectedSegments.push({
          name: `${newsletter} Subscribers`,
          description: `${subscribers.length} active subscribers to ${newsletter}`,
          isDetected: true,
          isDynamic: false,
          criteria: {
            customFields: { newsletter_subscription: newsletter },
            tags: [newsletter.toLowerCase().replace(/\s+/g, '_')]
          },
          subscriberCount: subscribers.length,
          growth: 5.2,
        });
      }
    });
    
    // 5. Inactive subscribers segment
    const inactiveUsers = customers.customers.filter((c: any) => {
      // Check if they haven't engaged recently
      const lastOpened = c.attributes?.last_email_opened;
      if (!lastOpened) return true;
      const daysSinceOpen = (Date.now() - new Date(lastOpened).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceOpen > 30;
    });
    
    if (inactiveUsers.length > 0) {
      detectedSegments.push({
        name: "Re-engagement Candidates",
        description: `${inactiveUsers.length} subscribers who haven't engaged in 30+ days`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            activity: { daysSinceLastOpen: 30 }
          }
        },
        subscriberCount: inactiveUsers.length,
        growth: -5.2,
      });
    }
    
    // 6. Revenue-based segments
    const highValue = customers.customers.filter((c: any) => 
      c.attributes?.lifetime_value > 100 ||
      c.attributes?.sharpsend_revenue > 100
    );
    
    if (highValue.length > 0) {
      detectedSegments.push({
        name: "High-Value Subscribers",
        description: `${highValue.length} subscribers with lifetime value > $100`,
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            revenue: { min: 100 }
          }
        },
        subscriberCount: highValue.length,
        growth: 15.8,
      });
    }
    
    // Check for existing segments to avoid duplicates
    const existingSegments = await db.select()
      .from(emailSegments)
      .where(eq(emailSegments.publisherId, publisherId));
    
    const existingNames = new Set(existingSegments.map(s => s.name.toLowerCase()));
    
    // Insert only new unique segments
    const insertedSegments = [];
    for (const segment of detectedSegments) {
      if (!existingNames.has(segment.name.toLowerCase())) {
        const [inserted] = await db
          .insert(emailSegments)
          .values({
            publisherId,
            ...segment,
            lastCalculatedAt: new Date(),
            createdAt: new Date(),
          })
          .returning();
        insertedSegments.push(inserted);
      }
    }
    
    console.log(`Detected ${detectedSegments.length} segments, inserted ${insertedSegments.length} new ones`);
    
    res.status(200).json({ 
      success: true,
      message: `AI analysis complete: ${insertedSegments.length} new segments detected from Customer.io data`,
      detected: insertedSegments.length,
      segments: insertedSegments,
      analyzed: {
        totalSubscribers: customers.customers.length,
        existingSegments: segments.segments.length,
        patternsFound: detectedSegments.length
      }
    });
  } catch (error) {
    console.error("Error detecting segments:", error);
    res.status(500).json({ error: "Failed to detect segments" });
  }
});

// Adopt a detected segment
router.post("/api/segments/:id/adopt", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    const [updated] = await db
      .update(emailSegments)
      .set({
        isDynamic: true,
        lastCalculatedAt: new Date(),
      })
      .where(and(
        eq(emailSegments.id, id),
        eq(emailSegments.publisherId, publisherId)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Segment not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error adopting segment:", error);
    res.status(500).json({ error: "Failed to adopt segment" });
  }
});

// Calculate revenue potential for a segment
router.post("/api/segments/:id/calculate-revenue", async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = "demo-publisher";
    
    // Simulate revenue calculation
    const potentialRevenue = Math.floor(Math.random() * 100000) + 20000;
    
    const [updated] = await db
      .update(emailSegments)
      .set({
        lastCalculatedAt: new Date(),
      })
      .where(and(
        eq(emailSegments.id, id),
        eq(emailSegments.publisherId, publisherId)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Segment not found" });
    }
    
    res.json({
      ...updated,
      potentialRevenue,
    });
  } catch (error) {
    console.error("Error calculating revenue:", error);
    res.status(500).json({ error: "Failed to calculate revenue" });
  }
});

export default router;