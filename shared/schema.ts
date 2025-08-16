import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  name: text("name").notNull(),
  segment: text("segment").notNull(),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subjectLine: text("subject_line").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at"),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  subscriberCount: integer("subscriber_count").default(0),
});

export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

export const emailIntegrations = pgTable("email_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  isConnected: boolean("is_connected").default(false),
  apiKey: text("api_key"),
  lastSync: timestamp("last_sync"),
  campaignsSent: integer("campaigns_sent").default(0),
  status: text("status").default("inactive"),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow(),
  totalSubscribers: integer("total_subscribers").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default("0"),
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0"),
  revenueGrowth: decimal("revenue_growth", { precision: 5, scale: 2 }).default("0"),
});

// Content Request System for Editorial Dashboard
export const contentRequests = pgTable("content_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, review, approved, in_progress, completed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  contentType: text("content_type").notNull(), // newsletter, email, article, campaign
  dueDate: timestamp("due_date"),
  assigneeId: varchar("assignee_id"),
  requestorId: varchar("requestor_id").notNull(),
  publisherId: varchar("publisher_id").notNull(),
  targetCohorts: text("target_cohorts").array(),
  marketTriggers: text("market_triggers").array(),
  estimatedReach: integer("estimated_reach").default(0),
  content: text("content"), // Draft content
  aiProcessed: boolean("ai_processed").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Drafts for Copywriter Portal
export const contentDrafts = pgTable("content_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentRequestId: varchar("content_request_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: integer("version").default(1),
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  authorId: varchar("author_id").notNull(),
  publisherId: varchar("publisher_id").notNull(),
  wordCount: integer("word_count"),
  aiAssistanceUsed: boolean("ai_assistance_used").default(false),
  feedback: text("feedback"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Campaigns for Preview & Processing
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentRequestId: varchar("content_request_id"),
  title: text("title").notNull(),
  baseSubject: text("base_subject").notNull(),
  baseContent: text("base_content").notNull(),
  status: text("status").notNull().default("draft"), // draft, pending_approval, approved, scheduled, sent
  targetCohorts: text("target_cohorts").array(),
  marketTriggers: text("market_triggers").array(),
  publisherId: varchar("publisher_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  variations: jsonb("variations").$type<{
    cohortId: string;
    cohortName: string;
    subscriberCount: number;
    personalizedSubject: string;
    personalizedContent: string;
    personalizedCTA: string;
    predictedOpenRate: number;
    predictedClickRate: number;
    optimalSendTime: string;
    reasoning: string;
    approved: boolean;
  }[]>(),
  performanceMetrics: jsonb("performance_metrics").$type<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  email: true,
  name: true,
  segment: true,
  engagementScore: true,
  revenue: true,
  metadata: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  name: true,
  subjectLine: true,
  content: true,
  openRate: true,
  clickRate: true,
  revenue: true,
  subscriberCount: true,
});

export const insertABTestSchema = createInsertSchema(abTests).pick({
  name: true,
  status: true,
  variantA: true,
  variantB: true,
  confidenceLevel: true,
});

export const insertEmailIntegrationSchema = createInsertSchema(emailIntegrations).pick({
  platform: true,
  isConnected: true,
  apiKey: true,
  campaignsSent: true,
  status: true,
});

export const insertContentRequestSchema = createInsertSchema(contentRequests).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  contentType: true,
  dueDate: true,
  assigneeId: true,
  requestorId: true,
  publisherId: true,
  targetCohorts: true,
  marketTriggers: true,
  estimatedReach: true,
  content: true,
  aiProcessed: true,
  metadata: true,
});

export const insertContentDraftSchema = createInsertSchema(contentDrafts).pick({
  contentRequestId: true,
  title: true,
  content: true,
  version: true,
  status: true,
  authorId: true,
  publisherId: true,
  wordCount: true,
  aiAssistanceUsed: true,
  feedback: true,
  metadata: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).pick({
  contentRequestId: true,
  title: true,
  baseSubject: true,
  baseContent: true,
  status: true,
  targetCohorts: true,
  marketTriggers: true,
  publisherId: true,
  createdBy: true,
  scheduledAt: true,
  sentAt: true,
  variations: true,
  performanceMetrics: true,
});

// Types
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

export type Analytics = typeof analytics.$inferSelect;

export type InsertContentRequest = z.infer<typeof insertContentRequestSchema>;
export type ContentRequest = typeof contentRequests.$inferSelect;

export type InsertContentDraft = z.infer<typeof insertContentDraftSchema>;
export type ContentDraft = typeof contentDrafts.$inferSelect;

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
