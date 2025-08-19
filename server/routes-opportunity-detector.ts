import { Router } from "express";
import { OpportunityDetector } from "./services/opportunity-detector";

const router = Router();

// Initialize opportunity detection for a publisher
router.post("/api/opportunity-detection/initialize", async (req, res) => {
  try {
    const publisherId = "demo-publisher"; // In real app, get from auth
    const detector = OpportunityDetector.getInstance();
    
    await detector.initializeDefaultTriggers(publisherId);
    
    res.json({
      success: true,
      message: "Opportunity detection initialized with default triggers",
      triggers: detector.getTriggers(publisherId)
    });
  } catch (error) {
    console.error("Error initializing opportunity detection:", error);
    res.status(500).json({ error: "Failed to initialize opportunity detection" });
  }
});

// Run opportunity detection with mock market data
router.post("/api/opportunity-detection/run", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const detector = OpportunityDetector.getInstance();
    
    // Mock market data for demo
    const mockMarketData = {
      prices: {
        "AAPL": 190.50,
        "TSLA": 380.25,
        "BTC-USD": 98500.00,
        "SPY": 485.20
      },
      indices: {
        "DJI": 39950.75, // Close to 40K milestone
        "SPX": 4850.30,
        "IXIC": 15200.45
      },
      volatility: {
        vix: 28.5 // High volatility
      },
      news: [
        {
          title: "Federal Reserve Signals Potential Rate Cuts in 2024",
          summary: "Jerome Powell hints at monetary policy shifts amid cooling inflation data"
        },
        {
          title: "Major Tech Earnings Beat Expectations",
          summary: "Apple and Microsoft report strong quarterly results, boosting market sentiment"
        }
      ],
      earnings: [
        {
          company: "Apple Inc.",
          date: "2024-01-25",
          description: "Q1 2024 earnings announcement"
        },
        {
          company: "Tesla Inc.",
          date: "2024-01-24",
          description: "Q4 2023 earnings release"
        }
      ]
    };

    const opportunities = await detector.detectOpportunities(publisherId, mockMarketData);
    
    res.json({
      success: true,
      opportunitiesDetected: opportunities.length,
      opportunities: opportunities.map(opp => ({
        title: opp.title,
        type: opp.type,
        potentialValue: opp.potentialValue,
        urgency: opp.context.urgency,
        trigger: opp.trigger.description
      }))
    });
  } catch (error) {
    console.error("Error running opportunity detection:", error);
    res.status(500).json({ error: "Failed to run opportunity detection" });
  }
});

// Get active triggers for a publisher
router.get("/api/opportunity-detection/triggers", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const detector = OpportunityDetector.getInstance();
    
    const triggers = detector.getTriggers(publisherId);
    
    res.json({
      triggers: triggers.map(trigger => ({
        id: trigger.id,
        type: trigger.type,
        description: trigger.description,
        isActive: trigger.isActive,
        symbol: trigger.symbol,
        threshold: trigger.threshold,
        condition: trigger.condition,
        lastTriggered: trigger.lastTriggered
      }))
    });
  } catch (error) {
    console.error("Error fetching triggers:", error);
    res.status(500).json({ error: "Failed to fetch triggers" });
  }
});

// Add custom trigger
router.post("/api/opportunity-detection/triggers", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const detector = OpportunityDetector.getInstance();
    
    const {
      type,
      symbol,
      condition,
      threshold,
      keywords,
      description
    } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({ error: "Type and description are required" });
    }
    
    const triggerId = await detector.addTrigger(publisherId, {
      type,
      symbol,
      condition,
      threshold: threshold ? parseFloat(threshold) : undefined,
      keywords,
      isActive: true,
      description
    });
    
    res.json({
      success: true,
      triggerId,
      message: "Custom trigger added successfully"
    });
  } catch (error) {
    console.error("Error adding trigger:", error);
    res.status(500).json({ error: "Failed to add trigger" });
  }
});

// Toggle trigger active state
router.patch("/api/opportunity-detection/triggers/:id/toggle", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const detector = OpportunityDetector.getInstance();
    const { id } = req.params;
    const { active } = req.body;
    
    const success = detector.toggleTrigger(publisherId, id, active);
    
    if (success) {
      res.json({
        success: true,
        message: `Trigger ${active ? 'activated' : 'deactivated'} successfully`
      });
    } else {
      res.status(404).json({ error: "Trigger not found" });
    }
  } catch (error) {
    console.error("Error toggling trigger:", error);
    res.status(500).json({ error: "Failed to toggle trigger" });
  }
});

// Simulate market event (for demo purposes)
router.post("/api/opportunity-detection/simulate", async (req, res) => {
  try {
    const publisherId = "demo-publisher";
    const detector = OpportunityDetector.getInstance();
    const { eventType, data } = req.body;
    
    let mockData = {};
    
    switch (eventType) {
      case "dow_milestone":
        mockData = {
          indices: { "DJI": 40000.25 },
          news: [{ title: "DOW Hits Historic 40,000 Milestone", summary: "Market celebrates major index achievement" }]
        };
        break;
        
      case "volatility_spike":
        mockData = {
          volatility: { vix: 32.5 },
          news: [{ title: "Market Volatility Surges on Economic Uncertainty", summary: "VIX spikes as investors seek safe havens" }]
        };
        break;
        
      case "earnings_surprise":
        mockData = {
          earnings: [{ company: "Apple Inc.", surprise: "beat" }],
          prices: { "AAPL": 200.50 },
          news: [{ title: "Apple Crushes Earnings Expectations", summary: "Strong iPhone sales drive record quarterly results" }]
        };
        break;
        
      default:
        return res.status(400).json({ error: "Unknown event type" });
    }
    
    const opportunities = await detector.detectOpportunities(publisherId, mockData);
    
    res.json({
      success: true,
      simulatedEvent: eventType,
      opportunitiesGenerated: opportunities.length,
      opportunities: opportunities.map(opp => ({
        title: opp.title,
        description: opp.description,
        type: opp.type,
        potentialValue: opp.potentialValue,
        probability: opp.probability,
        urgency: opp.context.urgency,
        expiresAt: opp.context.expiresAt
      }))
    });
  } catch (error) {
    console.error("Error simulating market event:", error);
    res.status(500).json({ error: "Failed to simulate market event" });
  }
});

export default router;