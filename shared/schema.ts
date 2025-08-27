import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Publishers - Multi-tenant root entity
export const publishers = pgTable("publishers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(), // e.g., "demopublisher" for demopublisher.sharpsend.io
  customDomain: text("custom_domain"), // optional custom domain
  cdnUrl: text("cdn_url"), // CDN URL for assets (e.g., cdn.demopublisher.sharpsend.io)
  tier: text("tier").notNull().default("starter"), // starter, growth, pro
  settings: jsonb("settings").$type<{
    pixelAutoAttach?: boolean;
    fatigueDetection?: boolean;
    segmentAutoDetect?: boolean;
    marketSentiment?: boolean;
    approvalWorkflow?: boolean;
  }>().default({ 
    pixelAutoAttach: true, 
    fatigueDetection: true, 
    segmentAutoDetect: true,
    marketSentiment: false,
    approvalWorkflow: false 
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("editor"), // admin, editor, reviewer, copywriter
  email: text("email"),
  name: text("name"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  segment: text("segment").notNull(),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  preferences: jsonb("preferences").$type<Record<string, any>>(),
  tags: text("tags").array(),
});

// Campaign hierarchy - top level container for multiple sends
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // marketing, editorial, fulfillment, paid_fulfillment, engagement, transactional
  description: text("description"),
  owner: varchar("owner"), // user id of campaign owner
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"), // active, paused, completed, archived
  // Summary stats (rolled up from sends)
  totalSends: integer("total_sends").default(0),
  totalOpens: integer("total_opens").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalConversions: integer("total_conversions").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  avgOpenRate: decimal("avg_open_rate", { precision: 5, scale: 2 }).default("0"),
  avgClickRate: decimal("avg_click_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual sends within a campaign
export const sends = pgTable("sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  campaignId: varchar("campaign_id").notNull(), // FK to campaigns
  name: text("name").notNull(),
  subjectLine: text("subject_line").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("suggested"), // suggested, draft, approved, scheduled, sent
  pipelineStage: text("pipeline_stage").notNull().default("suggested"), // suggested_sends, drafts, approved, scheduled, sent
  targetedSegments: jsonb("targeted_segments").$type<string[]>().default([]),
  assignedTo: varchar("assigned_to"), // copywriter user id
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  // Performance data
  recipientCount: integer("recipient_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  unsubscribeCount: integer("unsubscribe_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  // Pixel tracking
  pixelId: varchar("pixel_id"), // FK to pixels table
  pixelAttached: boolean("pixel_attached").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tracking pixels for each send - Enhanced with SharpSend Intelligence
export const pixels = pgTable("pixels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  sendId: varchar("send_id").notNull(), // FK to sends
  pixelCode: text("pixel_code").notNull().unique(), // unique tracking code
  pixelUrl: text("pixel_url").notNull(), // full tracking URL
  // SharpSend Intelligence - Behavioral context and predictions
  behavioralContext: jsonb("behavioral_context").$type<{
    subscriberId: string;
    publisherId: string;
    campaignId?: string;
    segmentContext: string[];
    expectedBehaviors: Array<{
      action: string;
      probability: number;
      expectedTimeframe: number;
      confidence: number;
    }>;
    abVariant?: string;
    personalizedContent?: boolean;
  }>(),
  predictedBehaviors: jsonb("predicted_behaviors").$type<Array<{
    action: string;
    probability: number;
    expectedTimeframe: number;
    confidence: number;
  }>>(),
  // Tracking data
  totalOpens: integer("total_opens").default(0),
  uniqueOpens: integer("unique_opens").default(0),
  totalClicks: integer("total_clicks").default(0),
  uniqueClicks: integer("unique_clicks").default(0),
  conversions: integer("conversions").default(0),
  unsubscribes: integer("unsubscribes").default(0),
  // Device & location tracking
  deviceData: jsonb("device_data").$type<{
    desktop: number;
    mobile: number;
    tablet: number;
  }>().default({ desktop: 0, mobile: 0, tablet: 0 }),
  locationData: jsonb("location_data").$type<Record<string, number>>().default({}),
  // Fatigue tracking
  fatigueScore: decimal("fatigue_score", { precision: 5, scale: 2 }).default("0"),
  fatigueAlerts: jsonb("fatigue_alerts").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at"),
});

export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  campaignId: varchar("campaign_id"),
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

// Publications discovered from publisher domains
export const publications = pgTable("publications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  cadence: text("cadence"), // daily, weekly, monthly
  topicTags: text("topic_tags").array(),
  rssUrl: text("rss_url"),
  discoveredAt: timestamp("discovered_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Master emails that generate segment variants
export const masterEmails = pgTable("master_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  publicationId: varchar("publication_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  emailType: text("email_type").notNull(), // marketing, editorial, fulfillment, paid_fulfillment, engagement, operational
  emailTypeConfidence: decimal("email_type_confidence", { precision: 3, scale: 2 }),
  assignedTo: varchar("assigned_to"), // user id for manual assignment
  isAutoGenerated: boolean("is_auto_generated").default(false),
  status: text("status").default("draft"), // draft, variants_generated, ready_to_send, sent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Segment-specific email variants
export const emailVariants = pgTable("email_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  masterEmailId: varchar("master_email_id").notNull(),
  segmentId: varchar("segment_id").notNull(),
  subjectLine: text("subject_line").notNull(),
  content: text("content").notNull(),
  pixelId: varchar("pixel_id").notNull(), // unique tracking pixel
  isEnabled: boolean("is_enabled").default(true),
  estimatedReach: integer("estimated_reach").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email segments (detected + user-defined)
export const emailSegments = pgTable("email_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isDetected: boolean("is_detected").default(false), // auto-detected from ESP
  isDynamic: boolean("is_dynamic").default(false), // dynamically calculated from data
  criteria: jsonb("criteria").$type<{
    espListId?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    behavioralTriggers?: string[];
    dynamicRules?: {
      engagement?: { min?: number; max?: number };
      revenue?: { min?: number; max?: number };
      activity?: { daysSinceLastOpen?: number };
      cohort?: string;
    };
  }>(),
  subscriberCount: integer("subscriber_count").default(0),
  growth: decimal("growth", { precision: 5, scale: 2 }).default("0"), // % growth
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignment Assets - Images and media for assignments
export const assignmentAssets = pgTable("assignment_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  assignmentId: varchar("assignment_id").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  fileSizeKb: integer("file_size_kb"),
  altText: text("alt_text"),
  credit: text("credit"),
  license: text("license"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignment Desk - Content planning and management
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  status: varchar("status").notNull().default("unassigned"), // unassigned, assigned, in_progress, review, approved, published
  dueDate: timestamp("due_date"),
  assignmentLink: varchar("assignment_link"), // Keep existing field
  copywriterId: varchar("copywriter_id"), // Keep existing field  
  marketContext: jsonb("market_context"), // Keep existing field
  // New fields to match frontend expectations
  type: text("type").default("newsletter"), // newsletter, article, research, analysis
  assignedTo: varchar("assigned_to"),
  assignedBy: varchar("assigned_by"),
  content: text("content"),
  brief: jsonb("brief").$type<{
    objective?: string;
    angle?: string;
    keyPoints?: string[];
    offer?: { label: string; url?: string };
    references?: string[];
  }>(),
  masterDraft: jsonb("master_draft").$type<{
    blocks: Array<{
      type: "paragraph" | "image" | "heading";
      md?: string;
      assetId?: string;
      alt?: string;
      caption?: string;
      align?: "left" | "center" | "right";
      size?: "full" | "half" | "thumb";
      level?: number;
    }>;
  }>(),
  notes: text("notes"),
  tags: text("tags").array(),
  shareableSlug: varchar("shareable_slug").unique(), // Unique slug for public sharing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opportunities - Revenue and growth opportunities
export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // market_alert, earnings_alert, volatility_alert, news_alert, segment_behavior
  status: text("status").notNull().default("identified"), // identified, qualified, proposal, negotiation, won, lost
  potentialValue: decimal("potential_value", { precision: 10, scale: 2 }),
  probability: integer("probability").default(50), // 0-100
  source: text("source"), // manual, ai_detected, partner_referral
  relatedAssignmentId: varchar("related_assignment_id"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactCompany: text("contact_company"),
  nextAction: text("next_action"),
  nextActionDate: timestamp("next_action_date"),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<{
    targetAudience?: string;
    proposalUrl?: string;
    contractUrl?: string;
    competitors?: string[];
    requirements?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

// Approval Workflows
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  entityType: text("entity_type").notNull(), // assignment, campaign, email_variant
  entityId: varchar("entity_id").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, changes_requested
  reviewedBy: varchar("reviewed_by"),
  feedback: text("feedback"),
  approvalLevel: integer("approval_level").default(1), // for multi-level approvals
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// North American news and sentiment data
export const naNewsBundle = pgTable("na_news_bundle", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  date: timestamp("date").notNull(),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
  topNarratives: text("top_narratives").array(),
  watchlistDeltas: jsonb("watchlist_deltas").$type<Record<string, number>>(),
  suggestedTopics: jsonb("suggested_topics").$type<Array<{
    topic: string;
    relevance: number;
    publicationId?: string;
    segmentIds?: string[];
  }>>(),
  refreshedAt: timestamp("refreshed_at").defaultNow(),
  ttl: timestamp("ttl").notNull(), // 24h cache TTL
});

// Tracking pixels for email variants
export const trackingPixels = pgTable("tracking_pixels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  variantId: varchar("variant_id").notNull(),
  publisherId: varchar("publisher_id").notNull(),
  emailType: text("email_type").notNull(),
  isUnique: boolean("is_unique").default(true),
  auditLog: jsonb("audit_log").$type<Array<{
    timestamp: string;
    event: string;
    metadata?: Record<string, any>;
  }>>(),
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailIntegrations = pgTable("email_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  platform: text("platform").notNull(), // mailchimp, hubspot, brevo
  isConnected: boolean("is_connected").default(false),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"), // For OAuth integrations
  refreshToken: text("refresh_token"), // For OAuth integrations
  tokenExpiresAt: timestamp("token_expires_at"), // Token expiration for OAuth
  lastSync: timestamp("last_sync"),
  campaignsSent: integer("campaigns_sent").default(0),
  status: text("status").default("inactive"),
  config: jsonb("config").$type<{
    // Common config
    webhookUrl?: string;
    listId?: string;
    fromEmail?: string;
    replyTo?: string;
    region?: string;
    // Platform specific configs
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  }>(),
  detectedSegments: jsonb("detected_segments").$type<Array<{
    id: string;
    name: string;
    subscriberCount: number;
    lastSync?: string;
  }>>(),
  lastError: text("last_error"),
  syncMetrics: jsonb("sync_metrics").$type<{
    totalContacts?: number;
    syncedContacts?: number;
    failedContacts?: number;
    lastSyncDuration?: number;
    avgResponseTime?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  date: timestamp("date").defaultNow(),
  totalSubscribers: integer("total_subscribers").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default("0"),
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0"),
  revenueGrowth: decimal("revenue_growth", { precision: 5, scale: 2 }).default("0"),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  unsubscribeRate: decimal("unsubscribe_rate", { precision: 5, scale: 2 }).default("0"),
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

// Email Send Queue for scheduled emails
export const emailSendQueue = pgTable("email_send_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
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
  }>(),
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
  publisherId: true,
  email: true,
  name: true,
  segment: true,
  engagementScore: true,
  revenue: true,
  metadata: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  publisherId: true,
  name: true,
  type: true,
  description: true,
  owner: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const insertSendSchema = createInsertSchema(sends).pick({
  publisherId: true,
  campaignId: true,
  name: true,
  subjectLine: true,
  content: true,
  status: true,
  pipelineStage: true,
  targetedSegments: true,
  assignedTo: true,
  scheduledAt: true,
});

export const insertPixelSchema = createInsertSchema(pixels).pick({
  publisherId: true,
  sendId: true,
  pixelCode: true,
  pixelUrl: true,
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
  detectedSegments: true,
});

// vNext schemas
export const insertPublicationSchema = createInsertSchema(publications).pick({
  publisherId: true,
  title: true,
  url: true,
  cadence: true,
  topicTags: true,
  rssUrl: true,
  isActive: true,
});

export const insertMasterEmailSchema = createInsertSchema(masterEmails).pick({
  publisherId: true,
  publicationId: true,
  title: true,
  content: true,
  emailType: true,
  emailTypeConfidence: true,
  assignedTo: true,
  isAutoGenerated: true,
  status: true,
});

export const insertEmailVariantSchema = createInsertSchema(emailVariants).pick({
  masterEmailId: true,
  segmentId: true,
  subjectLine: true,
  content: true,
  pixelId: true,
  isEnabled: true,
  estimatedReach: true,
});

export const insertEmailSegmentSchema = createInsertSchema(emailSegments).pick({
  publisherId: true,
  name: true,
  description: true,
  isDetected: true,
  criteria: true,
  subscriberCount: true,
});

export const insertNaNewsBundleSchema = createInsertSchema(naNewsBundle).pick({
  publisherId: true,
  date: true,
  sentimentScore: true,
  topNarratives: true,
  watchlistDeltas: true,
  suggestedTopics: true,
  ttl: true,
});

export const insertTrackingPixelSchema = createInsertSchema(trackingPixels).pick({
  variantId: true,
  publisherId: true,
  emailType: true,
  isUnique: true,
  auditLog: true,
  opens: true,
  clicks: true,
  conversions: true,
  revenue: true,
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

export type InsertSend = z.infer<typeof insertSendSchema>;
export type Send = typeof sends.$inferSelect;

export type InsertPixel = z.infer<typeof insertPixelSchema>;
export type Pixel = typeof pixels.$inferSelect;

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

export type InsertEmailSendQueue = z.infer<typeof insertEmailSendQueueSchema>;
export type EmailSendQueue = typeof emailSendQueue.$inferSelect;

// vNext types
export type InsertPublication = z.infer<typeof insertPublicationSchema>;
export type Publication = typeof publications.$inferSelect;

export type InsertMasterEmail = z.infer<typeof insertMasterEmailSchema>;
export type MasterEmail = typeof masterEmails.$inferSelect;

export type InsertEmailVariant = z.infer<typeof insertEmailVariantSchema>;
export type EmailVariant = typeof emailVariants.$inferSelect;

export type InsertEmailSegment = z.infer<typeof insertEmailSegmentSchema>;
export type EmailSegment = typeof emailSegments.$inferSelect;

export type InsertNaNewsBundle = z.infer<typeof insertNaNewsBundleSchema>;
export type NaNewsBundle = typeof naNewsBundle.$inferSelect;

export type InsertTrackingPixel = z.infer<typeof insertTrackingPixelSchema>;
export type TrackingPixel = typeof trackingPixels.$inferSelect;

// Campaign Projects Table
export const campaignProjects = pgTable("campaign_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
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

// Email Assignments Table
export const emailAssignments = pgTable("email_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignProjectId: varchar("campaign_project_id").notNull(),
  uniqueToken: varchar("unique_token").notNull().unique(),
  assigneeEmail: text("assignee_email").notNull(),
  assigneeName: text("assignee_name"),
  assignmentType: text("assignment_type").notNull(), // email_content, subject_line, email_design, content_review, fact_check
  status: text("status").notNull().default("pending"), // pending, in_progress, submitted, approved, revision_requested, completed
  briefing: jsonb("briefing").$type<{
    instructions: string;
    targetCohort: string;
    keyPoints: string[];
    tone: string;
    requirements: Record<string, any>;
  }>(),
  submittedContent: jsonb("submitted_content").$type<{
    subject: string;
    content: string;
    metadata: Record<string, any>;
    submittedAt: string;
  }>(),
  feedback: jsonb("feedback").$type<{
    comments: string;
    approved: boolean;
    revisionRequests: string[];
    reviewedBy: string;
    reviewedAt: string;
  }>(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment Links Table (for tracking unique URLs)
export const assignmentLinks = pgTable("assignment_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  token: varchar("token").notNull().unique(),
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  ipAddresses: jsonb("ip_addresses").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Collaborators Table
export const campaignCollaborators = pgTable("campaign_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignProjectId: varchar("campaign_project_id").notNull(),
  collaboratorEmail: text("collaborator_email").notNull(),
  collaboratorName: text("collaborator_name"),
  role: text("role").notNull(), // copywriter, editor, designer, reviewer, project_manager
  permissions: jsonb("permissions").$type<{
    canEdit: boolean;
    canReview: boolean;
    canApprove: boolean;
    canAssign: boolean;
  }>(),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  status: text("status").default("invited"), // invited, active, inactive
});

// Schema validators for the new tables
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
  campaignProjectId: true,
  uniqueToken: true,
  assigneeEmail: true,
  assigneeName: true,
  assignmentType: true,
  status: true,
  briefing: true,
  submittedContent: true,
  feedback: true,
  expiresAt: true,
});

export const insertAssignmentLinkSchema = createInsertSchema(assignmentLinks).pick({
  assignmentId: true,
  token: true,
  accessCount: true,
  lastAccessedAt: true,
  ipAddresses: true,
  isActive: true,
});

export const insertCampaignCollaboratorSchema = createInsertSchema(campaignCollaborators).pick({
  campaignProjectId: true,
  collaboratorEmail: true,
  collaboratorName: true,
  role: true,
  permissions: true,
  joinedAt: true,
  status: true,
});

// Types for the new tables
export type InsertCampaignProject = z.infer<typeof insertCampaignProjectSchema>;
export type CampaignProject = typeof campaignProjects.$inferSelect;

export type InsertEmailAssignment = z.infer<typeof insertEmailAssignmentSchema>;
export type EmailAssignment = typeof emailAssignments.$inferSelect;

export type InsertAssignmentLink = z.infer<typeof insertAssignmentLinkSchema>;
export type AssignmentLink = typeof assignmentLinks.$inferSelect;

export type InsertCampaignCollaborator = z.infer<typeof insertCampaignCollaboratorSchema>;
export type CampaignCollaborator = typeof campaignCollaborators.$inferSelect;

// Image Assets Table for Email Content
export const imageAssets = pgTable("image_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  fileName: text("file_name").notNull(),
  originalUrl: text("original_url"), // Original upload URL
  cdnUrl: text("cdn_url"), // CDN-optimized URL
  platformUrls: jsonb("platform_urls").$type<{
    sendgrid?: string;
    mailchimp?: string;
    exacttarget?: string;
    brevo?: string;
  }>(), // Platform-specific URLs
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"), // in bytes
  dimensions: jsonb("dimensions").$type<{
    width: number;
    height: number;
  }>(),
  altText: text("alt_text"),
  tags: text("tags").array(),
  category: text("category"), // logo, header, content, footer, signature
  usage: jsonb("usage").$type<{
    campaignIds: string[];
    templateIds: string[];
    lastUsed: string;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates Table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // newsletter, announcement, promotion, alert, digest
  platform: text("platform"), // sendgrid, mailchimp, exacttarget, brevo, universal
  platformTemplateId: text("platform_template_id"), // ID in the email platform
  structure: jsonb("structure").$type<{
    header: {
      type: string; // static, dynamic
      content: string;
      logoUrl?: string;
    };
    contentSections: Array<{
      id: string;
      type: string; // text, image, button, divider, social
      editable: boolean;
      defaultContent?: string;
    }>;
    footer: {
      type: string;
      content: string;
      includeUnsubscribe: boolean;
      includeSocial: boolean;
    };
  }>(),
  htmlTemplate: text("html_template").notNull(),
  textTemplate: text("text_template"),
  styles: jsonb("styles").$type<{
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: string;
    customCss?: string;
  }>(),
  brandAssets: jsonb("brand_assets").$type<{
    logoId: string;
    headerImageId?: string;
    footerImageId?: string;
    socialIcons?: Record<string, string>;
  }>(),
  legalContent: jsonb("legal_content").$type<{
    disclaimer?: string;
    privacyPolicy?: string;
    termsOfService?: string;
    complianceText?: string;
  }>(),
  variables: jsonb("variables").$type<Array<{
    name: string;
    type: string; // text, image, link, date
    defaultValue?: string;
    required: boolean;
  }>>(),
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  parentTemplateId: varchar("parent_template_id"), // For template versioning
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template Sections Table (for modular template building)
export const templateSections = pgTable("template_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // header, hero, content, cta, footer, social
  html: text("html").notNull(),
  css: text("css"),
  variables: jsonb("variables").$type<string[]>(),
  isReusable: boolean("is_reusable").default(true),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Image CDN Cache Table
export const imageCdnCache = pgTable("image_cdn_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageAssetId: varchar("image_asset_id").notNull(),
  platform: text("platform").notNull(),
  cdnUrl: text("cdn_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: text("status").notNull().default("active"), // active, expired, error
  errorMessage: text("error_message"),
});

// Schema validators for the new tables
export const insertImageAssetSchema = createInsertSchema(imageAssets).pick({
  publisherId: true,
  fileName: true,
  originalUrl: true,
  cdnUrl: true,
  platformUrls: true,
  mimeType: true,
  fileSize: true,
  dimensions: true,
  altText: true,
  tags: true,
  category: true,
  usage: true,
  metadata: true,
  uploadedBy: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).pick({
  publisherId: true,
  name: true,
  description: true,
  category: true,
  platform: true,
  platformTemplateId: true,
  structure: true,
  htmlTemplate: true,
  textTemplate: true,
  styles: true,
  brandAssets: true,
  legalContent: true,
  variables: true,
  isActive: true,
  version: true,
  parentTemplateId: true,
  createdBy: true,
});

export const insertTemplateSectionSchema = createInsertSchema(templateSections).pick({
  publisherId: true,
  name: true,
  type: true,
  html: true,
  css: true,
  variables: true,
  isReusable: true,
  tags: true,
});

export const insertImageCdnCacheSchema = createInsertSchema(imageCdnCache).pick({
  imageAssetId: true,
  platform: true,
  cdnUrl: true,
  expiresAt: true,
  status: true,
  errorMessage: true,
});

// SharpSend Intelligence Tables - Advanced Email Tracking & Behavioral Analysis

// Pixel Events - Individual tracking events from pixel hits
export const pixelEvents = pgTable("pixel_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pixelId: varchar("pixel_id").notNull(), // FK to pixels.pixelCode
  publisherId: varchar("publisher_id").notNull(),
  subscriberId: varchar("subscriber_id").notNull(),
  eventType: text("event_type").notNull(), // open, click, convert, unsubscribe
  timestamp: timestamp("timestamp").defaultNow(),
  deviceType: text("device_type"), // desktop, mobile, tablet, bot
  location: text("location"), // Approximate location
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<{
    referer?: string;
    ipAddress?: string;
    sessionId?: string;
    variant?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Behavioral Predictions - AI predictions for subscriber behavior
export const behavioralPredictions = pgTable("behavioral_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull(),
  predictions: jsonb("predictions").$type<Array<{
    action: string;
    probability: number;
    expectedTimeframe: number;
    confidence: number;
  }>>().notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // Calculated post-facto
  createdAt: timestamp("created_at").defaultNow(),
  evaluatedAt: timestamp("evaluated_at"),
});

// Segment Definitions - Master segment definitions with AI intelligence
export const segmentDefinitions = pgTable("segment_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fingerprint: integer("fingerprint").notNull().unique(), // Binary fingerprint
  taxonomyMapping: jsonb("taxonomy_mapping").$type<Record<string, string>>().notNull(),
  criteria: jsonb("criteria").$type<any>(),
  subscriberCount: integer("subscriber_count").default(0),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Segment Mappings - Maps segments to platform tags
export const segmentMappings = pgTable("segment_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  fingerprint: integer("fingerprint").notNull(),
  rawSegment: text("raw_segment").notNull(),
  taxonomyMapping: jsonb("taxonomy_mapping").$type<Record<string, string>>().notNull(),
  platformTags: jsonb("platform_tags").$type<Record<string, string[]>>().notNull(),
  confidence: varchar("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriber Segments - Many-to-many relationship
export const subscriberSegments = pgTable("subscriber_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull(),
  segmentId: varchar("segment_id").notNull(), // FK to segmentDefinitions
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("1"),
  addedAt: timestamp("added_at").defaultNow(),
  lastVerifiedAt: timestamp("last_verified_at"),
  source: text("source"), // ai_detected, manual, rule_based, imported
});

// Intelligence Loop Feedback - Continuous improvement data
export const intelligenceLoopFeedback = pgTable("intelligence_loop_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  subscriberId: varchar("subscriber_id"),
  feedbackType: text("feedback_type").notNull(), // prediction_accuracy, segment_performance, content_effectiveness
  feedbackData: jsonb("feedback_data").$type<any>().notNull(),
  modelVersion: text("model_version"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cross Platform Tag Sync - Track tag synchronization across platforms
export const crossPlatformTagSync = pgTable("cross_platform_tag_sync", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  subscriberId: varchar("subscriber_id").notNull(),
  platform: text("platform").notNull(), // mailchimp, convertkit, sendgrid, etc
  tags: text("tags").array().notNull(),
  syncStatus: text("sync_status").notNull(), // pending, synced, failed
  errorMessage: text("error_message"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add insert schemas for new tables
export const insertPixelEventSchema = createInsertSchema(pixelEvents).pick({
  pixelId: true,
  publisherId: true,
  subscriberId: true,
  eventType: true,
  deviceType: true,
  location: true,
  userAgent: true,
  metadata: true,
});

export const insertBehavioralPredictionSchema = createInsertSchema(behavioralPredictions).pick({
  subscriberId: true,
  predictions: true,
});

export const insertSegmentDefinitionSchema = createInsertSchema(segmentDefinitions).pick({
  publisherId: true,
  name: true,
  description: true,
  fingerprint: true,
  taxonomyMapping: true,
  criteria: true,
  confidence: true,
});

export const insertSegmentMappingSchema = createInsertSchema(segmentMappings).pick({
  publisherId: true,
  fingerprint: true,
  rawSegment: true,
  taxonomyMapping: true,
  platformTags: true,
  confidence: true,
});

export const insertSubscriberSegmentSchema = createInsertSchema(subscriberSegments).pick({
  subscriberId: true,
  segmentId: true,
  confidence: true,
  source: true,
});

// Types for the new tables
export type InsertImageAsset = z.infer<typeof insertImageAssetSchema>;
export type ImageAsset = typeof imageAssets.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertTemplateSection = z.infer<typeof insertTemplateSectionSchema>;
export type TemplateSection = typeof templateSections.$inferSelect;

export type InsertImageCdnCache = z.infer<typeof insertImageCdnCacheSchema>;
export type ImageCdnCache = typeof imageCdnCache.$inferSelect;

// SharpSend Intelligence Types
export type PixelEvent = typeof pixelEvents.$inferSelect;
export type InsertPixelEvent = z.infer<typeof insertPixelEventSchema>;

export type BehavioralPrediction = typeof behavioralPredictions.$inferSelect;
export type InsertBehavioralPrediction = z.infer<typeof insertBehavioralPredictionSchema>;

export type SegmentDefinition = typeof segmentDefinitions.$inferSelect;
export type InsertSegmentDefinition = z.infer<typeof insertSegmentDefinitionSchema>;

export type SegmentMapping = typeof segmentMappings.$inferSelect;
export type InsertSegmentMapping = z.infer<typeof insertSegmentMappingSchema>;

export type SubscriberSegment = typeof subscriberSegments.$inferSelect;
export type InsertSubscriberSegment = z.infer<typeof insertSubscriberSegmentSchema>;
