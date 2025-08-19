import OpenAI from "openai";
import { db } from "../db";
import { opportunities } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MarketTrigger {
  id: string;
  publisherId: string;
  type: "price_threshold" | "earnings_report" | "market_index" | "news_sentiment" | "volatility" | "custom";
  symbol?: string; // Stock symbol or index (SPY, AAPL, etc.)
  condition: "above" | "below" | "equals" | "crosses";
  threshold?: number;
  keywords?: string[];
  isActive: boolean;
  lastTriggered?: Date;
  description: string;
}

export interface DetectedOpportunity {
  title: string;
  description: string;
  type: "sponsorship" | "affiliate" | "premium_content" | "partnership" | "event";
  potentialValue: number;
  probability: number;
  source: "ai_detected";
  trigger: MarketTrigger;
  context: {
    marketEvent: string;
    relevantData: any;
    urgency: "low" | "medium" | "high";
    expiresAt?: Date;
  };
}

export class OpportunityDetector {
  private static instance: OpportunityDetector;
  private triggers: Map<string, MarketTrigger[]> = new Map();

  static getInstance(): OpportunityDetector {
    if (!OpportunityDetector.instance) {
      OpportunityDetector.instance = new OpportunityDetector();
    }
    return OpportunityDetector.instance;
  }

  // Initialize default triggers for financial publishers
  async initializeDefaultTriggers(publisherId: string): Promise<void> {
    const defaultTriggers: MarketTrigger[] = [
      {
        id: "dow-milestone",
        publisherId,
        type: "market_index",
        symbol: "DJI",
        condition: "crosses",
        threshold: 40000,
        isActive: true,
        description: "DOW crosses major milestone (40K, 41K, etc.)"
      },
      {
        id: "sp500-volatility",
        publisherId,
        type: "volatility",
        symbol: "SPY",
        condition: "above",
        threshold: 25, // VIX above 25
        isActive: true,
        description: "High volatility spike in S&P 500"
      },
      {
        id: "earnings-season",
        publisherId,
        type: "earnings_report",
        condition: "equals",
        keywords: ["earnings", "quarterly results", "guidance"],
        isActive: true,
        description: "Major earnings announcements"
      },
      {
        id: "fed-news",
        publisherId,
        type: "news_sentiment",
        condition: "equals",
        keywords: ["Federal Reserve", "interest rates", "Jerome Powell", "FOMC"],
        isActive: true,
        description: "Federal Reserve policy updates"
      },
      {
        id: "crypto-surge",
        publisherId,
        type: "price_threshold",
        symbol: "BTC-USD",
        condition: "above",
        threshold: 100000,
        isActive: true,
        description: "Bitcoin crosses $100K milestone"
      }
    ];

    this.triggers.set(publisherId, defaultTriggers);
  }

  // Detect opportunities based on market events
  async detectOpportunities(publisherId: string, marketData: any): Promise<DetectedOpportunity[]> {
    const triggers = this.triggers.get(publisherId) || [];
    const opportunities: DetectedOpportunity[] = [];

    for (const trigger of triggers) {
      if (!trigger.isActive) continue;

      const opportunity = await this.evaluateTrigger(trigger, marketData);
      if (opportunity) {
        opportunities.push(opportunity);
        
        // Update last triggered time
        trigger.lastTriggered = new Date();
        
        // Store in database
        await this.storeOpportunity(publisherId, opportunity);
      }
    }

    return opportunities;
  }

  private async evaluateTrigger(trigger: MarketTrigger, marketData: any): Promise<DetectedOpportunity | null> {
    try {
      switch (trigger.type) {
        case "price_threshold":
          return await this.evaluatePriceTrigger(trigger, marketData);
        
        case "market_index":
          return await this.evaluateIndexTrigger(trigger, marketData);
        
        case "earnings_report":
          return await this.evaluateEarningsTrigger(trigger, marketData);
        
        case "news_sentiment":
          return await this.evaluateNewsTrigger(trigger, marketData);
        
        case "volatility":
          return await this.evaluateVolatilityTrigger(trigger, marketData);
        
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error evaluating trigger ${trigger.id}:`, error);
      return null;
    }
  }

  private async evaluatePriceTrigger(trigger: MarketTrigger, marketData: any): Promise<DetectedOpportunity | null> {
    const currentPrice = marketData.prices?.[trigger.symbol!];
    if (!currentPrice || !trigger.threshold) return null;

    const triggered = this.checkCondition(currentPrice, trigger.condition, trigger.threshold);
    if (!triggered) return null;

    // Use AI to generate opportunity details
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial newsletter opportunity detector. Generate actionable revenue opportunities for financial publishers based on market events. Respond with JSON in this format: { 'title': string, 'description': string, 'type': string, 'potentialValue': number, 'probability': number, 'urgency': string }"
        },
        {
          role: "user",
          content: `${trigger.symbol} just ${trigger.condition} $${trigger.threshold}. Current price: $${currentPrice}. What revenue opportunity should a financial newsletter publisher pursue?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title,
      description: aiSuggestion.description,
      type: this.mapOpportunityType(aiSuggestion.type),
      potentialValue: aiSuggestion.potentialValue || 5000,
      probability: aiSuggestion.probability || 70,
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: `${trigger.symbol} ${trigger.condition} $${trigger.threshold}`,
        relevantData: { currentPrice, symbol: trigger.symbol },
        urgency: aiSuggestion.urgency || "medium",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    };
  }

  private async evaluateIndexTrigger(trigger: MarketTrigger, marketData: any): Promise<DetectedOpportunity | null> {
    const indexValue = marketData.indices?.[trigger.symbol!];
    if (!indexValue || !trigger.threshold) return null;

    const triggered = this.checkCondition(indexValue, trigger.condition, trigger.threshold);
    if (!triggered) return null;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial newsletter opportunity detector. Generate actionable revenue opportunities for financial publishers based on market milestones. Respond with JSON."
        },
        {
          role: "user",
          content: `The ${trigger.symbol} just crossed ${trigger.threshold}. Current value: ${indexValue}. What premium content or sponsorship opportunity should a financial publisher create?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || `${trigger.symbol} Milestone Alert - Premium Content Opportunity`,
      description: aiSuggestion.description || `Create premium analysis on ${trigger.symbol} crossing ${trigger.threshold}`,
      type: "premium_content",
      potentialValue: aiSuggestion.potentialValue || 3000,
      probability: aiSuggestion.probability || 80,
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: `${trigger.symbol} crosses ${trigger.threshold}`,
        relevantData: { indexValue, symbol: trigger.symbol },
        urgency: "high",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days for index milestones
      }
    };
  }

  private async evaluateEarningsTrigger(trigger: MarketTrigger, marketData: any): Promise<DetectedOpportunity | null> {
    const earnings = marketData.earnings || [];
    const relevantEarnings = earnings.filter((e: any) => 
      trigger.keywords?.some(keyword => 
        e.company?.toLowerCase().includes(keyword.toLowerCase()) ||
        e.description?.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (relevantEarnings.length === 0) return null;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate revenue opportunities for financial publishers around earnings events. Focus on sponsorships, premium analysis, or affiliate partnerships."
        },
        {
          role: "user",
          content: `Major earnings coming up: ${relevantEarnings.map((e: any) => e.company).join(', ')}. What revenue opportunities exist?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || "Earnings Season Sponsorship Opportunity",
      description: aiSuggestion.description || "Partner with trading platforms for earnings preview content",
      type: this.mapOpportunityType(aiSuggestion.type) || "sponsorship",
      potentialValue: aiSuggestion.potentialValue || 7500,
      probability: aiSuggestion.probability || 65,
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: "Major earnings announcements",
        relevantData: { earnings: relevantEarnings },
        urgency: "high",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
      }
    };
  }

  private async evaluateNewsTrigger(trigger: MarketTrigger, marketData: any): Promise<DetectedOpportunity | null> {
    const news = marketData.news || [];
    const relevantNews = news.filter((article: any) => 
      trigger.keywords?.some(keyword => 
        article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        article.summary?.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (relevantNews.length === 0) return null;

    // Analyze sentiment of relevant news
    const newsText = relevantNews.map((n: any) => n.title + ' ' + n.summary).join(' ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze financial news and suggest revenue opportunities for newsletter publishers. Consider the urgency and market impact."
        },
        {
          role: "user",
          content: `Recent financial news: ${newsText.substring(0, 500)}. What immediate revenue opportunity should a financial publisher pursue?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || "Breaking News Content Opportunity",
      description: aiSuggestion.description || "Create timely analysis on breaking financial news",
      type: this.mapOpportunityType(aiSuggestion.type) || "premium_content",
      potentialValue: aiSuggestion.potentialValue || 4000,
      probability: aiSuggestion.probability || 75,
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: "Breaking financial news",
        relevantData: { newsCount: relevantNews.length },
        urgency: "high",
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days for news
      }
    };
  }

  private async evaluateVolatilityTrigger(trigger: MarketTrigger, marketData: any): Promise<DetectedOpportunity | null> {
    const vix = marketData.volatility?.vix;
    if (!vix || !trigger.threshold) return null;

    const triggered = this.checkCondition(vix, trigger.condition, trigger.threshold);
    if (!triggered) return null;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate revenue opportunities for financial publishers during high volatility periods. Focus on defensive strategies and risk management content."
        },
        {
          role: "user",
          content: `VIX just spiked to ${vix}, indicating high market volatility. What revenue opportunity should a financial publisher create?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || "Volatility Spike - Risk Management Content",
      description: aiSuggestion.description || "Create premium content on navigating market volatility",
      type: "premium_content",
      potentialValue: aiSuggestion.potentialValue || 6000,
      probability: aiSuggestion.probability || 85,
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: `VIX spike to ${vix}`,
        relevantData: { vix, symbol: trigger.symbol },
        urgency: "high",
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days
      }
    };
  }

  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case "above":
        return value > threshold;
      case "below":
        return value < threshold;
      case "equals":
        return Math.abs(value - threshold) < 0.01;
      case "crosses":
        // For crosses, we'd need historical data to compare
        // For now, treat as "equals" for milestone detection
        return Math.abs(value - threshold) < (threshold * 0.005); // 0.5% tolerance
      default:
        return false;
    }
  }

  private mapOpportunityType(aiType: string): "sponsorship" | "affiliate" | "premium_content" | "partnership" | "event" {
    const type = aiType?.toLowerCase() || "";
    if (type.includes("sponsor")) return "sponsorship";
    if (type.includes("affiliate")) return "affiliate";
    if (type.includes("premium") || type.includes("content")) return "premium_content";
    if (type.includes("partner")) return "partnership";
    if (type.includes("event")) return "event";
    return "premium_content"; // default
  }

  private async storeOpportunity(publisherId: string, opportunity: DetectedOpportunity): Promise<void> {
    try {
      await db.insert(opportunities).values({
        publisherId,
        title: opportunity.title,
        description: opportunity.description,
        type: opportunity.type,
        status: "identified",
        potentialValue: opportunity.potentialValue.toString(),
        probability: opportunity.probability,
        source: opportunity.source,
        notes: `Auto-detected from ${opportunity.trigger.description}`,
        metadata: {
          trigger: opportunity.trigger,
          context: opportunity.context,
          aiGenerated: true,
          detectedAt: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error storing opportunity:", error);
    }
  }

  // Add custom trigger
  async addTrigger(publisherId: string, trigger: Omit<MarketTrigger, "id" | "publisherId">): Promise<string> {
    const id = `custom-${Date.now()}`;
    const newTrigger: MarketTrigger = {
      ...trigger,
      id,
      publisherId
    };

    const publisherTriggers = this.triggers.get(publisherId) || [];
    publisherTriggers.push(newTrigger);
    this.triggers.set(publisherId, publisherTriggers);

    return id;
  }

  // Get active triggers for a publisher
  getTriggers(publisherId: string): MarketTrigger[] {
    return this.triggers.get(publisherId) || [];
  }

  // Toggle trigger active state
  toggleTrigger(publisherId: string, triggerId: string, active: boolean): boolean {
    const publisherTriggers = this.triggers.get(publisherId) || [];
    const trigger = publisherTriggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.isActive = active;
      return true;
    }
    return false;
  }
}