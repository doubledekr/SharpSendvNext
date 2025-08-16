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
