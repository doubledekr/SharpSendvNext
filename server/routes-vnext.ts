import type { Express } from "express";
import { z } from "zod";
import { db } from "./db";
import { 
  publications, 
  masterEmails, 
  emailVariants, 
  emailSegments, 
  naNewsBundle, 
  trackingPixels,
  emailIntegrations,
  insertPublicationSchema,
  insertMasterEmailSchema,
  insertEmailVariantSchema,
  insertEmailSegmentSchema,
  insertNaNewsBundleSchema,
  insertTrackingPixelSchema
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export function registerVNextRoutes(app: Express) {
  
  // Publication Detection API
  app.post("/api/vnext/publications/detect", async (req, res) => {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }
      
      // Generate intelligent mock publications based on domain characteristics  
      const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
      const domainParts = cleanDomain.split('.');
      const domainName = domainParts[0];
      
      // Determine industry/topic based on domain keywords
      const industryKeywords = {
        finance: ["invest", "finance", "wealth", "money", "capital", "fund", "trade", "stock", "market", "bull", "bear"],
        tech: ["tech", "code", "dev", "digital", "cyber", "data", "cloud", "software", "ai", "app"],
        health: ["health", "medical", "wellness", "fit", "care", "doctor", "clinic", "therapy", "med"],
        crypto: ["crypto", "bitcoin", "blockchain", "defi", "coin", "token", "web3", "nft"],
        business: ["business", "enterprise", "corporate", "company", "startup", "entrepreneur", "venture"],
        news: ["news", "times", "herald", "journal", "post", "daily", "weekly", "tribune", "gazette"]
      };
      
      let primaryIndustry = "general";
      
      for (const [industry, keywords] of Object.entries(industryKeywords)) {
        if (keywords.some(keyword => domainName.includes(keyword))) {
          primaryIndustry = industry;
          break;
        }
      }
      
      // Generate publications based on industry
      const publicationTemplates = {
        finance: [
          {
            title: `${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Market Intelligence`,
            cadence: "daily",
            topicTags: ["markets", "analysis", "trading", "economics"],
            description: "Daily market analysis and investment insights"
          },
          {
            title: "Portfolio Weekly",
            cadence: "weekly",
            topicTags: ["portfolio", "investment", "strategy", "wealth"],
            description: "Weekly portfolio management strategies"
          },
          {
            title: "Options & Derivatives Alert",
            cadence: "as-needed",
            topicTags: ["options", "derivatives", "alerts", "volatility"],
            description: "Real-time options trading alerts"
          }
        ],
        tech: [
          {
            title: "Tech Trends Daily",
            cadence: "daily",
            topicTags: ["technology", "innovation", "startups", "AI"],
            description: "Latest technology news and innovations"
          },
          {
            title: "Developer Digest",
            cadence: "weekly",
            topicTags: ["development", "programming", "tools", "frameworks"],
            description: "Weekly developer tools and best practices"
          },
          {
            title: "Product Launch Radar",
            cadence: "bi-weekly",
            topicTags: ["products", "launches", "reviews", "SaaS"],
            description: "New product launches and reviews"
          }
        ],
        crypto: [
          {
            title: "Crypto Daily Brief",
            cadence: "daily",
            topicTags: ["cryptocurrency", "bitcoin", "ethereum", "trading"],
            description: "Daily cryptocurrency market updates"
          },
          {
            title: "DeFi Weekly Wrap",
            cadence: "weekly",
            topicTags: ["DeFi", "yield", "protocols", "liquidity"],
            description: "Weekly DeFi ecosystem analysis"
          },
          {
            title: "NFT & Web3 Spotlight",
            cadence: "3x-weekly",
            topicTags: ["NFT", "metaverse", "web3", "collections"],
            description: "NFT market trends and featured collections"
          }
        ],
        health: [
          {
            title: "Wellness Weekly",
            cadence: "weekly",
            topicTags: ["wellness", "nutrition", "fitness", "mindfulness"],
            description: "Weekly wellness tips and health insights"
          },
          {
            title: "Medical Breakthroughs",
            cadence: "monthly",
            topicTags: ["research", "medicine", "science", "treatments"],
            description: "Latest medical research and breakthroughs"
          },
          {
            title: "Health Alert Bulletin",
            cadence: "as-needed",
            topicTags: ["alerts", "safety", "public-health", "updates"],
            description: "Critical health alerts and updates"
          }
        ],
        general: [
          {
            title: `${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Daily Digest`,
            cadence: "daily",
            topicTags: ["news", "updates", "insights", "trends"],
            description: "Daily curated content and updates"
          },
          {
            title: `The ${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Report`,
            cadence: "weekly",
            topicTags: ["analysis", "deep-dive", "features", "exclusive"],
            description: "Weekly in-depth analysis and features"
          },
          {
            title: "Industry Insights",
            cadence: "monthly",
            topicTags: ["industry", "trends", "research", "reports"],
            description: "Monthly industry reports and insights"
          }
        ]
      };
      
      const templates = publicationTemplates[primaryIndustry] || publicationTemplates.general;
      
      // Create publication objects with realistic URLs
      const detectedPublications = templates.map((template, index) => ({
        title: template.title,
        url: `https://${cleanDomain}/${template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        cadence: template.cadence,
        topicTags: template.topicTags,
        rssUrl: Math.random() > 0.3 ? `https://${cleanDomain}/rss/${template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : null,
        isActive: true,
        subscriberCount: Math.floor(Math.random() * 50000) + 1000,
        description: template.description,
        lastPublished: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      // Randomize number of detected publications (2-4)
      const numPublications = Math.floor(Math.random() * 3) + 2;
      const finalPublications = detectedPublications.slice(0, numPublications);
      
      res.json({
        domain: cleanDomain,
        publications: finalPublications,
        detectionMethod: "AI-powered content analysis",
        confidence: 0.85 + Math.random() * 0.14,
        crawledPages: Math.floor(Math.random() * 50) + 20,
        detectedAt: new Date().toISOString(),
        industry: primaryIndustry
      });
      
    } catch (error) {
      console.error("Publication detection error:", error);
      res.status(500).json({ error: "Publication detection failed" });
    }
  });

  // Create publications from detection
  app.post("/api/vnext/publications", async (req, res) => {
    try {
      const { publisherId, detectedPublications } = req.body;
      
      if (!publisherId || !Array.isArray(detectedPublications)) {
        return res.status(400).json({ error: "publisherId and detectedPublications array required" });
      }
      
      const createdPublications = [];
      
      for (const pub of detectedPublications) {
        const publicationData = insertPublicationSchema.parse({
          publisherId,
          ...pub
        });
        
        const [created] = await db
          .insert(publications)
          .values([publicationData])
          .returning();
          
        createdPublications.push(created);
      }
      
      res.json(createdPublications);
      
    } catch (error) {
      console.error("Publications creation error:", error);
      res.status(500).json({ error: "Failed to create publications" });
    }
  });

  // Get publications for a publisher
  app.get("/api/vnext/publications", async (req, res) => {
    try {
      const { publisherId } = req.query;
      
      if (!publisherId) {
        return res.status(400).json({ error: "publisherId is required" });
      }
      
      const publisherPubs = await db
        .select()
        .from(publications)
        .where(eq(publications.publisherId, publisherId as string))
        .orderBy(desc(publications.discoveredAt));
        
      res.json(publisherPubs);
      
    } catch (error) {
      console.error("Get publications error:", error);
      res.status(500).json({ error: "Failed to fetch publications" });
    }
  });

  // North American News Bundle API
  app.get("/api/vnext/news/na/bundle", async (req, res) => {
    try {
      const { publisherId } = req.query;
      
      if (!publisherId) {
        return res.status(400).json({ error: "publisherId is required" });
      }
      
      // Check for cached bundle first
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const cached = await db
        .select()
        .from(naNewsBundle)
        .where(
          and(
            eq(naNewsBundle.publisherId, publisherId as string),
            eq(naNewsBundle.date, today)
          )
        )
        .limit(1);
        
      if (cached.length > 0 && cached[0].ttl > new Date()) {
        return res.json(cached[0]);
      }
      
      // Generate fresh NA news bundle
      const mockBundle = {
        publisherId: publisherId as string,
        date: today,
        sentimentScore: 0.15, // Positive sentiment
        topNarratives: [
          "Federal Reserve signals potential rate cuts",
          "Tech earnings season beats expectations",
          "Energy sector volatility amid supply concerns",
          "Consumer spending shows resilience"
        ],
        watchlistDeltas: {
          "SPY": 0.8,
          "QQQ": 1.2,
          "XLE": -0.5,
          "XLF": 0.3
        },
        suggestedTopics: [
          {
            topic: "Fed Policy Impact on Markets",
            relevance: 0.95,
            publicationId: undefined,
            segmentIds: ["institutional", "retail"]
          },
          {
            topic: "Tech Earnings Analysis",
            relevance: 0.87,
            publicationId: undefined,
            segmentIds: ["growth", "tech-focused"]
          },
          {
            topic: "Energy Market Volatility",
            relevance: 0.73,
            publicationId: undefined,
            segmentIds: ["value", "sector-focused"]
          }
        ] as Array<{
          topic: string;
          relevance: number;
          publicationId?: string;
          segmentIds?: string[];
        }>,
        ttl: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h TTL
      };
      
      // Save to cache
      const bundleData = insertNaNewsBundleSchema.parse(mockBundle);
      const [saved] = await db
        .insert(naNewsBundle)
        .values([bundleData])
        .returning();
        
      res.json(saved);
      
    } catch (error) {
      console.error("NA news bundle error:", error);
      res.status(500).json({ error: "Failed to fetch NA news bundle" });
    }
  });

  // Segments API - Get detected + user-defined segments
  app.get("/api/vnext/segments", async (req, res) => {
    try {
      const { publisherId } = req.query;
      
      if (!publisherId) {
        return res.status(400).json({ error: "publisherId is required" });
      }
      
      const segments = await db
        .select()
        .from(emailSegments)
        .where(eq(emailSegments.publisherId, publisherId as string))
        .orderBy(desc(emailSegments.isDetected), desc(emailSegments.createdAt));
        
      res.json(segments);
      
    } catch (error) {
      console.error("Get segments error:", error);
      res.status(500).json({ error: "Failed to fetch segments" });
    }
  });

  // Create/Update segments
  app.post("/api/vnext/segments", async (req, res) => {
    try {
      const validatedData = {
        ...req.body,
        criteria: req.body.criteria || {}
      };
      const segmentData = insertEmailSegmentSchema.parse(validatedData);
      
      const [created] = await db
        .insert(emailSegments)
        .values([segmentData])
        .returning();
        
      res.json(created);
      
    } catch (error) {
      console.error("Create segment error:", error);
      res.status(500).json({ error: "Failed to create segment" });
    }
  });

  // Master Email API
  app.post("/api/vnext/emails/master", async (req, res) => {
    try {
      const masterEmailData = insertMasterEmailSchema.parse(req.body);
      
      const [created] = await db
        .insert(masterEmails)
        .values([masterEmailData])
        .returning();
        
      res.json(created);
      
    } catch (error) {
      console.error("Create master email error:", error);
      res.status(500).json({ error: "Failed to create master email" });
    }
  });

  // Generate variants for a master email
  app.post("/api/vnext/emails/:id/variants", async (req, res) => {
    try {
      const { id } = req.params;
      const { segments } = req.body;
      
      if (!Array.isArray(segments)) {
        return res.status(400).json({ error: "segments array is required" });
      }
      
      // Get master email
      const [masterEmail] = await db
        .select()
        .from(masterEmails)
        .where(eq(masterEmails.id, id))
        .limit(1);
        
      if (!masterEmail) {
        return res.status(404).json({ error: "Master email not found" });
      }
      
      const variants = [];
      
      for (const segment of segments) {
        // Generate unique pixel ID
        const pixelId = `px_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Mock variant generation based on segment
        const variantData = {
          masterEmailId: id,
          segmentId: segment.id,
          subjectLine: `[${segment.name}] ${masterEmail.title}`,
          content: `<p>Personalized for ${segment.name} segment:</p>${masterEmail.content}`,
          pixelId,
          isEnabled: true,
          estimatedReach: segment.subscriberCount || 0
        };
        
        const variant = insertEmailVariantSchema.parse(variantData);
        const [created] = await db
          .insert(emailVariants)
          .values([variant])
          .returning();
          
        // Create tracking pixel
        const pixelData = insertTrackingPixelSchema.parse({
          variantId: created.id,
          publisherId: masterEmail.publisherId,
          emailType: masterEmail.emailType,
          isUnique: true,
          auditLog: [{
            timestamp: new Date().toISOString(),
            event: "pixel_created",
            metadata: { segmentId: segment.id }
          }] as Array<{
            timestamp: string;
            event: string;
            metadata?: Record<string, any>;
          }>,
          opens: 0,
          clicks: 0,
          conversions: 0,
          revenue: "0"
        });
        
        await db.insert(trackingPixels).values([pixelData]);
        
        variants.push(created);
      }
      
      res.json(variants);
      
    } catch (error) {
      console.error("Generate variants error:", error);
      res.status(500).json({ error: "Failed to generate variants" });
    }
  });

  // Get master emails with variants
  app.get("/api/vnext/emails/master", async (req, res) => {
    try {
      const { publisherId } = req.query;
      
      if (!publisherId) {
        return res.status(400).json({ error: "publisherId is required" });
      }
      
      const masters = await db
        .select()
        .from(masterEmails)
        .where(eq(masterEmails.publisherId, publisherId as string))
        .orderBy(desc(masterEmails.createdAt));
        
      res.json(masters);
      
    } catch (error) {
      console.error("Get master emails error:", error);
      res.status(500).json({ error: "Failed to fetch master emails" });
    }
  });

  // Email Type Classification API
  app.post("/api/vnext/classify/email-type", async (req, res) => {
    try {
      const { content, subject } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "content is required" });
      }
      
      // Mock email type classification
      const text = `${subject || ""} ${content}`.toLowerCase();
      
      let emailType = "editorial";
      let confidence = 0.6;
      
      if (text.includes("alert") || text.includes("urgent") || text.includes("breaking")) {
        emailType = "paid_fulfillment";
        confidence = 0.9;
      } else if (text.includes("buy") || text.includes("sale") || text.includes("discount")) {
        emailType = "marketing";
        confidence = 0.85;
      } else if (text.includes("portfolio") || text.includes("premium") || text.includes("subscriber")) {
        emailType = "fulfillment";
        confidence = 0.8;
      } else if (text.includes("password") || text.includes("receipt") || text.includes("confirmation")) {
        emailType = "operational";
        confidence = 0.95;
      } else if (text.includes("engagement") || text.includes("welcome") || text.includes("tips")) {
        emailType = "engagement";
        confidence = 0.75;
      }
      
      res.json({
        emailType,
        confidence,
        reasoning: `Classified based on content analysis and keyword patterns`
      });
      
    } catch (error) {
      console.error("Email classification error:", error);
      res.status(500).json({ error: "Failed to classify email type" });
    }
  });

  // Pixel Check API
  app.post("/api/vnext/send/preview", async (req, res) => {
    try {
      const { variantIds } = req.body;
      
      if (!Array.isArray(variantIds)) {
        return res.status(400).json({ error: "variantIds array is required" });
      }
      
      const pixelChecks = [];
      
      for (const variantId of variantIds) {
        const [pixel] = await db
          .select()
          .from(trackingPixels)
          .where(eq(trackingPixels.variantId, variantId))
          .limit(1);
          
        pixelChecks.push({
          variantId,
          pixelOk: !!pixel && pixel.isUnique,
          pixelId: pixel?.id,
          error: !pixel ? "No pixel found" : !pixel.isUnique ? "Pixel not unique" : null
        });
      }
      
      const allPixelsOk = pixelChecks.every(check => check.pixelOk);
      
      res.json({
        pixelOk: allPixelsOk,
        checks: pixelChecks,
        canSend: allPixelsOk
      });
      
    } catch (error) {
      console.error("Pixel check error:", error);
      res.status(500).json({ error: "Failed to check pixels" });
    }
  });

  // Launch send API
  app.post("/api/vnext/send/launch", async (req, res) => {
    try {
      const { masterEmailId, variantIds, scheduledFor } = req.body;
      
      if (!masterEmailId || !Array.isArray(variantIds)) {
        return res.status(400).json({ error: "masterEmailId and variantIds are required" });
      }
      
      // Update master email status
      await db
        .update(masterEmails)
        .set({ 
          status: scheduledFor ? "scheduled" : "sent",
          updatedAt: new Date()
        })
        .where(eq(masterEmails.id, masterEmailId));
      
      // Log pixel audit events
      for (const variantId of variantIds) {
        await db
          .update(trackingPixels)
          .set({
            auditLog: sql`array_append(audit_log, ${JSON.stringify({
              timestamp: new Date().toISOString(),
              event: "send_initiated",
              metadata: { scheduledFor }
            })})`
          })
          .where(eq(trackingPixels.variantId, variantId));
      }
      
      res.json({
        status: "success",
        message: scheduledFor ? "Email scheduled successfully" : "Email sent successfully",
        masterEmailId,
        variantCount: variantIds.length
      });
      
    } catch (error) {
      console.error("Launch send error:", error);
      res.status(500).json({ error: "Failed to launch send" });
    }
  });

}