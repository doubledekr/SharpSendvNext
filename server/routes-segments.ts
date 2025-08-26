import { Router } from "express";
import { db } from "./db";
import { emailSegments } from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";

const router = Router();

// Get all segments for a publisher
router.get("/api/segments", async (req, res) => {
  try {
    // Always return empty array for real accounts
    // Only demo accounts should see segments
    res.json([]);
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
    const publisherId = "demo-publisher";
    
    // Simulate AI segment detection
    const detectedSegments = [
      {
        name: "High-Value Tech Investors",
        description: "Subscribers interested in technology stocks with portfolio > $100k",
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            engagement: { min: 70, max: 100 },
            revenue: { min: 1000, max: 10000 },
            cohort: "tech-focused"
          }
        },
        subscriberCount: 2500,
        growth: 15.5,
      },
      {
        name: "Emerging Market Enthusiasts",
        description: "Active traders focused on emerging markets and commodities",
        isDetected: true,
        isDynamic: true,
        criteria: {
          dynamicRules: {
            engagement: { min: 60, max: 90 },
            activity: { daysSinceLastOpen: 3 },
            cohort: "emerging-markets"
          }
        },
        subscriberCount: 1800,
        growth: 22.3,
      },
      {
        name: "Dividend Seekers",
        description: "Conservative investors focused on dividend-yielding stocks",
        isDetected: true,
        isDynamic: false,
        criteria: {
          tags: ["dividend", "income", "conservative"],
          behavioralTriggers: ["dividend-report-opens", "income-strategy-clicks"]
        },
        subscriberCount: 3200,
        growth: 8.7,
      }
    ];
    
    // Insert detected segments
    const insertedSegments = [];
    for (const segment of detectedSegments) {
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
    
    res.json({ 
      message: "Segment detection complete",
      detected: insertedSegments.length,
      segments: insertedSegments
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