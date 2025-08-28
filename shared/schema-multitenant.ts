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

// A/B Tests table - now belongs to a publisher
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  assignmentId: varchar("assignment_id"), // Reference to assignments instead of campaigns
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
  assignmentId: varchar("assignment_id"), // Reference to assignments instead of campaigns
  prompt: text("prompt").notNull(),
  generatedContent: text("generated_content").notNull(),
  contentType: text("content_type").notNull(), // subject_line, body, personalization
  model: text("model").notNull().default("gpt-4"),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Projects Table
export const campaignProjects = pgTable("campaign_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, in_progress, review, approved, scheduled, sent, cancelled
  targetAudience: jsonb("target_audience").$type<{
    cohorts: string[];
    estimatedReach: number;
    segmentCriteria: Record<string, any>;
  }>(),
  timeline: jsonb("timeline").$type<{
    dueDate: string;
    publishDate: string;
    milestones: Array<{ name: string; date: string; completed: boolean }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

// Email Assignments for Copywriter Portal
export const emailAssignments = pgTable("email_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => campaignProjects.id, { onDelete: "cascade" }),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  assigneeEmail: text("assignee_email").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, submitted, approved, revision_requested
  content: text("content"),
  feedback: text("feedback"),
  marketTriggers: jsonb("market_triggers").$type<any[]>(),
  dueDate: timestamp("due_date"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Send Queue for scheduled emails
export const emailSendQueue = pgTable("email_send_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id"),
  emailType: text("email_type").notNull(), // campaign, newsletter, alert, etc
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // pending, sending, sent, failed, cancelled
  priority: integer("priority").default(0), // higher priority sends first
  retryCount: integer("retry_count").default(0),
  lastAttempt: timestamp("last_attempt"),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  metadata: jsonb("metadata").$type<{
    cohort?: string;
    personalizationData?: Record<string, any>;
    trackingEnabled?: boolean;
    platform?: string;
    abTest?: {
      variant: string;
      strategy: string;
      testType: string;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= Assignment Copywriter Workflow Tables =============

export const assignments = pgTable("assignments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  publisherId: varchar("publisher_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  assignmentLink: varchar("assignment_link", { length: 500 }),
  copywriterId: varchar("copywriter_id", { length: 255 }),
  marketContext: jsonb("market_context"),
  // Phase 1: Approval System Fields
  approvalStatus: varchar("approval_status", { length: 50 }).default("pending"), // pending, approved, rejected, changes_requested
  approvalComments: text("approval_comments"),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  approvalHistory: jsonb("approval_history").$type<Array<{
    action: string;
    userId: string;
    userName: string;
    comments?: string;
    timestamp: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const drafts = pgTable("drafts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 255 }),
  publisherId: varchar("publisher_id", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  content: text("content"),
  segments: jsonb("segments"), // Array of segment variations
  status: varchar("status", { length: 50 }).notNull().default('draft'),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 2: Broadcast Queue System
export const broadcastQueue = pgTable("broadcast_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  assignmentId: varchar("assignment_id").notNull(),
  title: text("title").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("ready"), // ready, scheduled, sending, sent, failed, cancelled
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  audienceCount: integer("audience_count").default(0),
  segments: jsonb("segments").$type<Array<{
    segmentId: string;
    segmentName: string;
    subscriberCount: number;
    platform: string;
  }>>(),
  sendSettings: jsonb("send_settings").$type<{
    sendType?: "immediate" | "scheduled" | "recurring";
    timeZone?: string;
    throttleRate?: number;
    retrySettings?: {
      maxRetries: number;
      retryDelay: number;
    };
  }>(),
  abTestConfig: jsonb("ab_test_config").$type<{
    enabled: boolean;
    testId?: string;
    variants?: Array<{
      name: string;
      percentage: number;
      content: any;
    }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Broadcast send logs for tracking
export const broadcastSendLogs = pgTable("broadcast_send_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  broadcastId: varchar("broadcast_id").notNull().references(() => broadcastQueue.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(), // started, progress, completed, failed
  message: text("message"),
  details: jsonb("details").$type<{
    totalRecipients?: number;
    sent?: number;
    failed?: number;
    bounced?: number;
    error?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sendQueue = pgTable("send_queue", {
  id: varchar("id", { length: 255 }).primaryKey(),
  publisherId: varchar("publisher_id", { length: 255 }).notNull(),
  assignmentId: varchar("assignment_id", { length: 255 }),
  segmentId: varchar("segment_id", { length: 255 }),
  segmentName: varchar("segment_name", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  content: text("content"),
  recipients: integer("recipients"),
  pixelId: varchar("pixel_id", { length: 255 }),
  platform: varchar("platform", { length: 50 }),
  scheduledTime: timestamp("scheduled_time"),
  status: varchar("status", { length: 50 }).notNull().$type<'queued' | 'sending' | 'sent' | 'failed'>(),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pixelTracking = pgTable("pixel_tracking", {
  id: varchar("id", { length: 255 }).primaryKey(),
  publisherId: varchar("publisher_id", { length: 255 }).notNull(),
  campaignId: varchar("campaign_id", { length: 255 }),
  segmentName: varchar("segment_name", { length: 255 }),
  recipientCount: integer("recipient_count"),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  opens: integer("opens").default(0),
  lastOpened: timestamp("last_opened"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailMetrics = pgTable("email_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  publisherId: varchar("publisher_id", { length: 255 }).notNull(),
  campaignId: varchar("campaign_id", { length: 255 }),
  pixelId: varchar("pixel_id", { length: 255 }),
  sent: integer("sent").default(0),
  delivered: integer("delivered").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  converted: integer("converted").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default('0'),
  date: timestamp("date").defaultNow(),
});

export const campaignEmailVersions = pgTable("campaign_email_versions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  campaignId: varchar("campaign_id", { length: 255 }).notNull(),
  segmentId: varchar("segment_id", { length: 255 }).notNull(),
  segmentName: varchar("segment_name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  previewText: varchar("preview_text", { length: 500 }),
  personalizationLevel: varchar("personalization_level", { length: 50 }).$type<'low' | 'medium' | 'high'>().default('high'),
  status: varchar("status", { length: 50 }).$type<'draft' | 'generated' | 'approved' | 'sent'>().default('generated'),
  generatedAt: timestamp("generated_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  estimatedOpenRate: decimal("estimated_open_rate", { precision: 5, scale: 2 }),
  estimatedClickRate: decimal("estimated_click_rate", { precision: 5, scale: 2 }),
});

// Types for assignments workflow
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = typeof drafts.$inferInsert;
export type SendQueueItem = typeof sendQueue.$inferSelect;
export type InsertSendQueueItem = typeof sendQueue.$inferInsert;
export type PixelTracking = typeof pixelTracking.$inferSelect;
export type InsertPixelTracking = typeof pixelTracking.$inferInsert;
export type EmailMetric = typeof emailMetrics.$inferSelect;
export type InsertEmailMetric = typeof emailMetrics.$inferInsert;

// Phase 2: Broadcast Queue Types
export type BroadcastQueueItem = typeof broadcastQueue.$inferSelect;
export type InsertBroadcastQueueItem = typeof broadcastQueue.$inferInsert;
export type BroadcastSendLog = typeof broadcastSendLogs.$inferSelect;
export type InsertBroadcastSendLog = typeof broadcastSendLogs.$inferInsert;

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

export const insertABTestSchema = createInsertSchema(abTests).pick({
  publisherId: true,
  assignmentId: true,
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

export const insertEmailSendQueueSchema = createInsertSchema(emailSendQueue).pick({
  publisherId: true,
  campaignId: true,
  emailType: true,
  recipientEmail: true,
  recipientName: true,
  subject: true,
  content: true,
  scheduledFor: true,
  status: true,
  priority: true,
  metadata: true,
});

export const insertCampaignProjectSchema = createInsertSchema(campaignProjects).pick({
  publisherId: true,
  name: true,
  description: true,
  status: true,
  targetAudience: true,
  timeline: true,
  createdBy: true,
});

export const insertEmailAssignmentSchema = createInsertSchema(emailAssignments).pick({
  projectId: true,
  publisherId: true,
  assigneeEmail: true,
  title: true,
  description: true,
  status: true,
  content: true,
  feedback: true,
  marketTriggers: true,
  dueDate: true,
});

// Phase 2: Broadcast Queue Insert Schemas
export const insertBroadcastQueueSchema = createInsertSchema(broadcastQueue).pick({
  publisherId: true,
  assignmentId: true,
  title: true,
  status: true,
  scheduledAt: true,
  audienceCount: true,
  segments: true,
  sendSettings: true,
  abTestConfig: true,
});

export const insertBroadcastSendLogSchema = createInsertSchema(broadcastSendLogs).pick({
  publisherId: true,
  broadcastId: true,
  status: true,
  message: true,
  details: true,
});

// Types
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type Publisher = typeof publishers.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;



export type InsertABTest = z.infer<typeof insertABTestSchema>;
export type ABTest = typeof abTests.$inferSelect;

export type InsertEmailIntegration = z.infer<typeof insertEmailIntegrationSchema>;
export type EmailIntegration = typeof emailIntegrations.$inferSelect;

export type InsertCrmIntegration = z.infer<typeof insertCrmIntegrationSchema>;
export type CrmIntegration = typeof crmIntegrations.$inferSelect;

export type InsertAiContentHistory = z.infer<typeof insertAiContentHistorySchema>;
export type AiContentHistory = typeof aiContentHistory.$inferSelect;

export type InsertEmailSendQueue = z.infer<typeof insertEmailSendQueueSchema>;
export type EmailSendQueue = typeof emailSendQueue.$inferSelect;

export type InsertCampaignProject = z.infer<typeof insertCampaignProjectSchema>;
export type CampaignProject = typeof campaignProjects.$inferSelect;

export type InsertEmailAssignment = z.infer<typeof insertEmailAssignmentSchema>;
export type EmailAssignment = typeof emailAssignments.$inferSelect;

// Phase 2: Broadcast Queue Zod Types
export type InsertBroadcastQueue = z.infer<typeof insertBroadcastQueueSchema>;
export type BroadcastQueue = typeof broadcastQueue.$inferSelect;

export type InsertBroadcastSendLogZod = z.infer<typeof insertBroadcastSendLogSchema>;
export type BroadcastSendLogType = typeof broadcastSendLogs.$inferSelect;

export type Analytics = typeof analytics.$inferSelect;

// Utility types for tenant-aware operations
export type TenantContext = {
  publisherId: string;
  publisher: Publisher;
  user: User;
};

