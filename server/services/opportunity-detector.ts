import OpenAI from "openai";
import { db } from "../db";
import { opportunities } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
  type: "market_alert" | "earnings_alert" | "volatility_alert" | "news_alert" | "segment_behavior";
  potentialValue: number; // Estimated engagement value from sending this email
  probability: number; // Likelihood of high engagement
  source: "ai_detected";
  trigger: MarketTrigger;
  context: {
    marketEvent: string;
    relevantData: any;
    urgency: "low" | "medium" | "high";
    expiresAt?: Date;
    suggestedSegments?: string[]; // Which subscriber segments to target
    emailTiming?: string; // Best time to send
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

    // Use AI to identify email send opportunity
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying when financial newsletters should send emails based on market events. Generate email send opportunities in JSON format with: { 'title': string, 'description': string, 'urgency': 'low'|'medium'|'high', 'suggestedSegments': string[], 'emailTiming': string, 'estimatedOpenRate': number, 'estimatedClickRate': number }"
        },
        {
          role: "user",
          content: `${trigger.symbol} just ${trigger.condition} $${trigger.threshold}. Current price: $${currentPrice}. When should we send an email alert to subscribers about this price movement and which segments would be most interested?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || `Send Alert: ${trigger.symbol} ${trigger.condition} $${trigger.threshold}`,
      description: aiSuggestion.description || `Time-sensitive email opportunity for ${trigger.symbol} price movement`,
      type: "market_alert",
      potentialValue: Math.round((aiSuggestion.estimatedOpenRate || 25) * (aiSuggestion.estimatedClickRate || 5) * 4), // Engagement value score
      probability: Math.round((aiSuggestion.estimatedOpenRate || 25) * 3), // Based on expected open rate
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: `${trigger.symbol} ${trigger.condition} $${trigger.threshold}`,
        relevantData: { currentPrice, symbol: trigger.symbol },
        urgency: aiSuggestion.urgency || "medium",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for price alerts
        suggestedSegments: aiSuggestion.suggestedSegments || ["Active Traders", "Growth Investors"],
        emailTiming: aiSuggestion.emailTiming || "Send immediately"
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
          content: "You are an expert at identifying when to send financial newsletter emails based on market milestones. Generate email send opportunities in JSON format with: { 'title': string, 'description': string, 'urgency': 'low'|'medium'|'high', 'suggestedSegments': string[], 'emailTiming': string, 'estimatedOpenRate': number, 'estimatedClickRate': number }"
        },
        {
          role: "user",
          content: `The ${trigger.symbol} just crossed ${trigger.threshold}. Current value: ${indexValue}. This is a major market milestone. When should we send an email alert and which subscriber segments would be most interested?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || `Send Alert: ${trigger.symbol} Crosses ${trigger.threshold}`,
      description: aiSuggestion.description || `Market milestone email opportunity - ${trigger.symbol} at historic level`,
      type: "market_alert",
      potentialValue: Math.round((aiSuggestion.estimatedOpenRate || 35) * (aiSuggestion.estimatedClickRate || 8) * 3), // Higher engagement for milestones
      probability: Math.round((aiSuggestion.estimatedOpenRate || 35) * 2.5), // High probability for milestone events
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: `${trigger.symbol} crosses ${trigger.threshold}`,
        relevantData: { indexValue, symbol: trigger.symbol },
        urgency: aiSuggestion.urgency || "high",
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours for market milestones
        suggestedSegments: aiSuggestion.suggestedSegments || ["All Subscribers", "Active Investors"],
        emailTiming: aiSuggestion.emailTiming || "Send within 1 hour"
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
          content: "You are an expert at identifying when to send earnings-related newsletter emails. Generate email send opportunities in JSON format with: { 'title': string, 'description': string, 'urgency': 'low'|'medium'|'high', 'suggestedSegments': string[], 'emailTiming': string, 'estimatedOpenRate': number, 'estimatedClickRate': number }"
        },
        {
          role: "user",
          content: `Major earnings coming up: ${relevantEarnings.map((e: any) => e.company).join(', ')}. When should we send an earnings preview email and which segments would be most interested?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || "Send Earnings Preview Email",
      description: aiSuggestion.description || `Earnings announcements for ${relevantEarnings.length} companies - send preview analysis`,
      type: "earnings_alert",
      potentialValue: Math.round((aiSuggestion.estimatedOpenRate || 30) * (aiSuggestion.estimatedClickRate || 7) * 3.5), // Good engagement for earnings
      probability: Math.round((aiSuggestion.estimatedOpenRate || 30) * 2.2),
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: "Major earnings announcements",
        relevantData: { earnings: relevantEarnings },
        urgency: aiSuggestion.urgency || "high",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours before earnings
        suggestedSegments: aiSuggestion.suggestedSegments || ["Stock Holders", "Options Traders", "Value Investors"],
        emailTiming: aiSuggestion.emailTiming || "Send 1-2 days before earnings"
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
          content: "You are an expert at identifying when to send breaking news emails to financial newsletter subscribers. Generate email send opportunities in JSON format with: { 'title': string, 'description': string, 'urgency': 'low'|'medium'|'high', 'suggestedSegments': string[], 'emailTiming': string, 'estimatedOpenRate': number, 'estimatedClickRate': number }"
        },
        {
          role: "user",
          content: `Breaking financial news: ${newsText.substring(0, 500)}. When should we send an alert email and which segments need this information immediately?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || "Send Breaking News Alert",
      description: aiSuggestion.description || `${relevantNews.length} breaking news items - immediate email opportunity`,
      type: "news_alert",
      potentialValue: Math.round((aiSuggestion.estimatedOpenRate || 40) * (aiSuggestion.estimatedClickRate || 10) * 2.5), // High engagement for breaking news
      probability: Math.round((aiSuggestion.estimatedOpenRate || 40) * 2), // High open rates for news
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: "Breaking financial news",
        relevantData: { newsCount: relevantNews.length },
        urgency: aiSuggestion.urgency || "high",
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours for breaking news
        suggestedSegments: aiSuggestion.suggestedSegments || ["All Active Subscribers", "News Alerts List"],
        emailTiming: aiSuggestion.emailTiming || "Send within 30 minutes"
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
          content: "You are an expert at identifying when to send volatility alert emails to financial newsletter subscribers. Generate email send opportunities in JSON format with: { 'title': string, 'description': string, 'urgency': 'low'|'medium'|'high', 'suggestedSegments': string[], 'emailTiming': string, 'estimatedOpenRate': number, 'estimatedClickRate': number }"
        },
        {
          role: "user",
          content: `VIX just spiked to ${vix}, indicating high market volatility. When should we send a volatility alert and which segments need risk management guidance?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiSuggestion = JSON.parse(response.choices[0].message.content!);
    
    return {
      title: aiSuggestion.title || "Send Volatility Alert: VIX at ${vix}",
      description: aiSuggestion.description || "Market volatility spike - send risk management guidance email",
      type: "volatility_alert",
      potentialValue: Math.round((aiSuggestion.estimatedOpenRate || 45) * (aiSuggestion.estimatedClickRate || 12) * 2), // Very high engagement during volatility
      probability: Math.round((aiSuggestion.estimatedOpenRate || 45) * 1.9), // High probability during fear
      source: "ai_detected",
      trigger,
      context: {
        marketEvent: `VIX spike to ${vix}`,
        relevantData: { vix, symbol: trigger.symbol },
        urgency: aiSuggestion.urgency || "high",
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours for volatility alerts
        suggestedSegments: aiSuggestion.suggestedSegments || ["Risk-Averse Investors", "Options Traders", "Retirees"],
        emailTiming: aiSuggestion.emailTiming || "Send immediately"
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

  // Map opportunity type is no longer needed since we focus on email send opportunities
  // Types are now: market_alert, earnings_alert, volatility_alert, news_alert, segment_behavior

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