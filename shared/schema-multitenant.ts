import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Publishers (Tenants) table - each publisher is a separate tenant
export const publishers = pgTable("publishers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  domain: text("domain"), // Optional custom domain
  subdomain: text("subdomain").notNull().unique(), // e.g., "acme" for acme.sharpsend.com
  plan: text("plan").notNull().default("starter"), // starter, pro, enterprise
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  settings: jsonb("settings").$type<{
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
    features?: {
      aiPersonalization?: boolean;
      abTesting?: boolean;
      advancedAnalytics?: boolean;
    };
    limits?: {
      maxSubscribers?: number;
      maxCampaigns?: number;
      maxEmailsPerMonth?: number;
    };
  }>(),
});

// Users table - now belongs to a publisher
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, editor, viewer
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// Subscribers table - now belongs to a publisher
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  segment: text("segment").notNull(),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  // Additional fields for better personalization
  preferences: jsonb("preferences").$type<{
    topics?: string[];
    frequency?: string;
    format?: string;
  }>(),
  tags: text("tags").array(),
});

// Campaigns table - now belongs to a publisher
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subjectLine: text("subject_line").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // draft, scheduled, sent, cancelled
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  subscriberCount: integer("subscriber_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// A/B Tests table - now belongs to a publisher
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  variantA: jsonb("variant_a").$type<{
    subjectLine: string;
    content: string;
    openRate: number;
    clickRate: number;
    sent: number;
  }>(),
  variantB: jsonb("variant_b").$type<{
    subjectLine: string;
    content: string;
    openRate: number;
    clickRate: number;
    sent: number;
  }>(),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Email Integrations table - now belongs to a publisher
export const emailIntegrations = pgTable("email_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // mailchimp, sendgrid, exacttarget, etc.
  isConnected: boolean("is_connected").default(false),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  lastSync: timestamp("last_sync"),
  campaignsSent: integer("campaigns_sent").default(0),
  status: text("status").default("inactive"),
  config: jsonb("config").$type<Record<string, any>>(),
});

// CRM Integrations table - new for Salesforce integration
export const crmIntegrations = pgTable("crm_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // salesforce, hubspot, etc.
  isConnected: boolean("is_connected").default(false),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  instanceUrl: text("instance_url"),
  lastSync: timestamp("last_sync"),
  status: text("status").default("inactive"),
  config: jsonb("config").$type<Record<string, any>>(),
});

// Analytics table - now belongs to a publisher
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow(),
  totalSubscribers: integer("total_subscribers").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default("0"),
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0"),
  revenueGrowth: decimal("revenue_growth", { precision: 5, scale: 2 }).default("0"),
  // Additional metrics
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  unsubscribeRate: decimal("unsubscribe_rate", { precision: 5, scale: 2 }).default("0"),
});

// AI Content Generation History
export const aiContentHistory = pgTable("ai_content_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  generatedContent: text("generated_content").notNull(),
  contentType: text("content_type").notNull(), // subject_line, body, personalization
  model: text("model").notNull().default("gpt-4"),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertPublisherSchema = createInsertSchema(publishers).pick({
  name: true,
  email: true,
  domain: true,
  subdomain: true,
  plan: true,
  settings: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  publisherId: true,
  username: true,
  email: true,
  password: true,
  role: true,
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  publisherId: true,
  email: true,
  name: true,
  segment: true,
  engagementScore: true,
  revenue: true,
  metadata: true,
  preferences: true,
  tags: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  publisherId: true,
  name: true,
  subjectLine: true,
  content: true,
  status: true,
  scheduledAt: true,
  openRate: true,
  clickRate: true,
  revenue: true,
  subscriberCount: true,
});

export const insertABTestSchema = createInsertSchema(abTests).pick({
  publisherId: true,
  campaignId: true,
  name: true,
  status: true,
  variantA: true,
  variantB: true,
  confidenceLevel: true,
});

export const insertEmailIntegrationSchema = createInsertSchema(emailIntegrations).pick({
  publisherId: true,
  platform: true,
  isConnected: true,
  apiKey: true,
  apiSecret: true,
  campaignsSent: true,
  status: true,
  config: true,
});

export const insertCrmIntegrationSchema = createInsertSchema(crmIntegrations).pick({
  publisherId: true,
  platform: true,
  isConnected: true,
  accessToken: true,
  refreshToken: true,
  instanceUrl: true,
  status: true,
  config: true,
});

export const insertAiContentHistorySchema = createInsertSchema(aiContentHistory).pick({
  publisherId: true,
  campaignId: true,
  prompt: true,
  generatedContent: true,
  contentType: true,
  model: true,
  tokensUsed: true,
});

// Types
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type Publisher = typeof publishers.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertABTest = z.infer<typeof insertABTestSchema>;
export type ABTest = typeof abTests.$inferSelect;

export type InsertEmailIntegration = z.infer<typeof insertEmailIntegrationSchema>;
export type EmailIntegration = typeof emailIntegrations.$inferSelect;

export type InsertCrmIntegration = z.infer<typeof insertCrmIntegrationSchema>;
export type CrmIntegration = typeof crmIntegrations.$inferSelect;

export type InsertAiContentHistory = z.infer<typeof insertAiContentHistorySchema>;
export type AiContentHistory = typeof aiContentHistory.$inferSelect;

export type Analytics = typeof analytics.$inferSelect;

// Utility types for tenant-aware operations
export type TenantContext = {
  publisherId: string;
  publisher: Publisher;
  user: User;
};

