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

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  name: text("name").notNull(),
  subjectLine: text("subject_line").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  subscriberCount: integer("subscriber_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const emailIntegrations = pgTable("email_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").notNull(),
  platform: text("platform").notNull(),
  isConnected: boolean("is_connected").default(false),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  lastSync: timestamp("last_sync"),
  campaignsSent: integer("campaigns_sent").default(0),
  status: text("status").default("inactive"),
  config: jsonb("config").$type<{
    webhookUrl?: string;
    listId?: string;
    fromEmail?: string;
    replyTo?: string;
    region?: string;
  }>(),
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
  subjectLine: true,
  content: true,
  status: true,
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

// Types for the new tables
export type InsertImageAsset = z.infer<typeof insertImageAssetSchema>;
export type ImageAsset = typeof imageAssets.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertTemplateSection = z.infer<typeof insertTemplateSectionSchema>;
export type TemplateSection = typeof templateSections.$inferSelect;

export type InsertImageCdnCache = z.infer<typeof insertImageCdnCacheSchema>;
export type ImageCdnCache = typeof imageCdnCache.$inferSelect;
