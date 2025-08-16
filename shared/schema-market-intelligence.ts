import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, sql, date, inet } from "drizzle-orm/pg-core";
import { sql as sqlOperator } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { publishers, subscribers, users } from "./schema-multitenant";

// Market News Cache - Store MarketAux news data
export const marketNews = pgTable("market_news", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  newsId: varchar("news_id").notNull().unique(), // MarketAux news ID
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at").notNull(),
  source: text("source"),
  entities: jsonb("entities").$type<{
    symbols?: string[];
    companies?: string[];
    people?: string[];
    topics?: string[];
  }>(),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }), // -1 to 1
  categories: text("categories").array(),
  symbols: text("symbols").array(),
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }),
  cachedAt: timestamp("cached_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Market Data Cache - Store Polygon financial data
export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  dataType: text("data_type").notNull(), // 'price', 'volume', 'technical_indicator', 'options'
  timestamp: timestamp("timestamp").notNull(),
  data: jsonb("data").notNull().$type<{
    price?: number;
    change?: number;
    changePercent?: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    close?: number;
    marketCap?: number;
    technicalIndicators?: Record<string, number>;
    [key: string]: any;
  }>(),
  source: text("source").default("polygon"),
  cachedAt: timestamp("cached_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Market Events - Track significant market events
export const marketEvents = pgTable("market_events", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // 'earnings', 'dividend', 'split', 'merger', 'ipo', 'fed_announcement'
  symbol: varchar("symbol"),
  eventDate: date("event_date"),
  eventData: jsonb("event_data").$type<{
    title?: string;
    description?: string;
    expectedImpact?: string;
    actualImpact?: string;
    relatedSymbols?: string[];
    marketSector?: string;
    [key: string]: any;
  }>(),
  impactScore: decimal("impact_score", { precision: 3, scale: 2 }), // Predicted market impact
  newsReferences: text("news_references").array(), // Related news article IDs
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriber Market Interests - Enhanced subscriber preferences
export const subscriberMarketInterests = pgTable("subscriber_market_interests", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull().references(() => subscribers.id, { onDelete: "cascade" }),
  symbols: text("symbols").array(), // Stocks of interest
  sectors: text("sectors").array(), // Sector preferences
  newsCategories: text("news_categories").array(), // Preferred news types
  sentimentPreference: text("sentiment_preference"), // 'bullish', 'bearish', 'neutral'
  marketTimingPreference: text("market_timing_preference"), // 'pre_market', 'market_hours', 'after_hours'
  volatilityTolerance: text("volatility_tolerance"), // 'low', 'medium', 'high'
  portfolioValue: text("portfolio_value"), // 'under_10k', '10k_50k', '50k_100k', '100k_500k', 'over_500k'
  tradingExperience: text("trading_experience"), // 'beginner', 'intermediate', 'advanced', 'professional'
  investmentGoals: text("investment_goals").array(), // 'growth', 'income', 'preservation', 'speculation'
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Content Templates with Market Intelligence
export const contentTemplatesEnhanced = pgTable("content_templates_enhanced", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // 'newsletter', 'campaign', 'editorial', 'standalone', 'market_alert'
  baseContent: jsonb("base_content").notNull().$type<{
    subject?: string;
    body?: string;
    personalizationMarkers?: string[];
    marketDataPlaceholders?: string[];
    newsPlaceholders?: string[];
    dynamicElements?: Record<string, any>;
  }>(),
  personalizationMarkers: jsonb("personalization_markers").$type<{
    riskLevel?: string[];
    investmentGoal?: string[];
    experienceLevel?: string[];
    portfolioSize?: string[];
    marketSentiment?: string[];
    newsContext?: string[];
  }>(),
  marketTriggers: jsonb("market_triggers").$type<{
    priceMovements?: { symbol: string; threshold: number; direction: string }[];
    newsKeywords?: string[];
    sentimentThresholds?: { min: number; max: number };
    volatilityTriggers?: { threshold: number; timeframe: string };
    eventTypes?: string[];
  }>(),
  metadata: jsonb("metadata").$type<{
    author?: string;
    tags?: string[];
    category?: string;
    targetAudience?: string;
    estimatedReadTime?: number;
    complexity?: string;
  }>(),
  status: text("status").default("draft"), // 'draft', 'review', 'approved', 'published', 'archived'
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Content Market Context - Link content to market conditions
export const contentMarketContext = pgTable("content_market_context", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  contentTemplateId: varchar("content_template_id").notNull().references(() => contentTemplatesEnhanced.id, { onDelete: "cascade" }),
  marketConditions: jsonb("market_conditions").$type<{
    overallSentiment?: number;
    volatilityIndex?: number;
    marketTrend?: string;
    sectorPerformance?: Record<string, number>;
    majorIndices?: Record<string, number>;
    tradingSession?: string;
  }>(),
  relevantNews: text("relevant_news").array(), // Related news article IDs
  marketDataReferences: jsonb("market_data_references").$type<{
    referencedSymbols?: string[];
    priceData?: Record<string, any>;
    technicalIndicators?: Record<string, any>;
    marketEvents?: string[];
  }>(),
  sentimentContext: text("sentiment_context"), // Overall market sentiment when content created
  timingRelevance: jsonb("timing_relevance").$type<{
    optimalSendTime?: string;
    marketEventAlignment?: string;
    urgencyScore?: number;
    timeDecayFactor?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Variations with Market Context
export const contentVariationsEnhanced = pgTable("content_variations_enhanced", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => contentTemplatesEnhanced.id, { onDelete: "cascade" }),
  subscriberSegment: text("subscriber_segment"), // Target segment for this variation
  personalizedContent: jsonb("personalized_content").notNull().$type<{
    subject?: string;
    body?: string;
    marketData?: Record<string, any>;
    newsInserts?: any[];
    personalizedElements?: Record<string, any>;
  }>(),
  personalizationStrategy: jsonb("personalization_strategy").$type<{
    strategicLevel?: {
      contentFraming?: string;
      toneAdjustment?: string;
      complexityLevel?: string;
    };
    tacticalLevel?: {
      subjectLineStyle?: string;
      openingPersonalization?: string;
      callToActionType?: string;
      contentLength?: string;
    };
    marketContext?: {
      includedMarketData?: string[];
      newsReferences?: string[];
      sentimentAlignment?: string;
      timingOptimization?: string;
    };
  }>(),
  marketContext: jsonb("market_context").$type<{
    marketConditions?: Record<string, any>;
    relevantNews?: any[];
    priceData?: Record<string, any>;
    sentimentScore?: number;
  }>(),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }), // AI-calculated effectiveness score
  engagementPrediction: decimal("engagement_prediction", { precision: 5, scale: 2 }), // Predicted engagement rate
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Behavioral Events with Market Context
export const behavioralEventsEnhanced = pgTable("behavioral_events_enhanced", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull().references(() => subscribers.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'open', 'click', 'read_time', 'forward', 'unsubscribe', 'purchase', 'portfolio_update'
  eventData: jsonb("event_data").$type<{
    contentId?: string;
    linkUrl?: string;
    readTime?: number;
    deviceType?: string;
    location?: string;
    marketContext?: Record<string, any>;
    [key: string]: any;
  }>(),
  contentId: varchar("content_id"), // Related content if applicable
  sessionId: varchar("session_id"), // User session identifier
  marketContext: jsonb("market_context").$type<{
    marketConditions?: Record<string, any>;
    relevantNews?: string[];
    portfolioImpact?: Record<string, any>;
    sentimentAtTime?: number;
  }>(),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
});

// Market Intelligence Cache - Store processed market insights
export const marketIntelligenceCache = pgTable("market_intelligence_cache", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  cacheKey: varchar("cache_key").notNull().unique(),
  dataType: text("data_type").notNull(), // 'sentiment_analysis', 'trend_analysis', 'correlation_data', 'prediction'
  data: jsonb("data").notNull().$type<{
    analysis?: any;
    insights?: string[];
    recommendations?: any[];
    confidence?: number;
    [key: string]: any;
  }>(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// API Usage Tracking - Monitor MarketAux and Polygon API usage
export const apiUsageTracking = pgTable("api_usage_tracking", {
  id: varchar("id").primaryKey().default(sqlOperator`gen_random_uuid()`),
  publisherId: varchar("publisher_id").references(() => publishers.id, { onDelete: "cascade" }),
  apiProvider: text("api_provider").notNull(), // 'marketaux', 'polygon'
  endpoint: text("endpoint").notNull(),
  requestCount: integer("request_count").default(1),
  responseTime: integer("response_time"), // milliseconds
  status: text("status"), // 'success', 'error', 'rate_limited'
  errorMessage: text("error_message"),
  date: date("date").defaultNow(),
  hour: integer("hour"), // 0-23 for hourly tracking
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas for validation
export const insertMarketNewsSchema = createInsertSchema(marketNews);
export const insertMarketDataSchema = createInsertSchema(marketData);
export const insertMarketEventsSchema = createInsertSchema(marketEvents);
export const insertSubscriberMarketInterestsSchema = createInsertSchema(subscriberMarketInterests);
export const insertContentMarketContextSchema = createInsertSchema(contentMarketContext);
export const insertContentTemplatesEnhancedSchema = createInsertSchema(contentTemplatesEnhanced);
export const insertContentVariationsEnhancedSchema = createInsertSchema(contentVariationsEnhanced);
export const insertBehavioralEventsEnhancedSchema = createInsertSchema(behavioralEventsEnhanced);
export const insertMarketIntelligenceCacheSchema = createInsertSchema(marketIntelligenceCache);
export const insertApiUsageTrackingSchema = createInsertSchema(apiUsageTracking);

// Type exports for TypeScript
export type MarketNews = typeof marketNews.$inferSelect;
export type NewMarketNews = typeof marketNews.$inferInsert;
export type MarketData = typeof marketData.$inferSelect;
export type NewMarketData = typeof marketData.$inferInsert;
export type MarketEvent = typeof marketEvents.$inferSelect;
export type NewMarketEvent = typeof marketEvents.$inferInsert;
export type SubscriberMarketInterests = typeof subscriberMarketInterests.$inferSelect;
export type NewSubscriberMarketInterests = typeof subscriberMarketInterests.$inferInsert;
export type ContentMarketContext = typeof contentMarketContext.$inferSelect;
export type NewContentMarketContext = typeof contentMarketContext.$inferInsert;
export type ContentTemplateEnhanced = typeof contentTemplatesEnhanced.$inferSelect;
export type NewContentTemplateEnhanced = typeof contentTemplatesEnhanced.$inferInsert;
export type ContentVariationEnhanced = typeof contentVariationsEnhanced.$inferSelect;
export type NewContentVariationEnhanced = typeof contentVariationsEnhanced.$inferInsert;
export type BehavioralEventEnhanced = typeof behavioralEventsEnhanced.$inferSelect;
export type NewBehavioralEventEnhanced = typeof behavioralEventsEnhanced.$inferInsert;
export type MarketIntelligenceCache = typeof marketIntelligenceCache.$inferSelect;
export type NewMarketIntelligenceCache = typeof marketIntelligenceCache.$inferInsert;
export type ApiUsageTracking = typeof apiUsageTracking.$inferSelect;
export type NewApiUsageTracking = typeof apiUsageTracking.$inferInsert;

