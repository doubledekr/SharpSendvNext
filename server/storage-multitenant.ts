import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  publishers,
  users,
  subscribers,
  campaigns,
  abTests,
  emailIntegrations,
  crmIntegrations,
  analytics,
  aiContentHistory,
  type Publisher,
  type User,
  type Subscriber,
  type Campaign,
  type ABTest,
  type EmailIntegration,
  type CrmIntegration,
  type Analytics,
  type AiContentHistory,
  type InsertPublisher,
  type InsertUser,
  type InsertSubscriber,
  type InsertCampaign,
  type InsertABTest,
  type InsertEmailIntegration,
  type InsertCrmIntegration,
  type InsertAiContentHistory,
} from "../shared/schema-multitenant";

// Database connection
const connectionString = process.env.DATABASE_URL || "postgresql://sharpsend:sharpsend123@localhost:5432/sharpsend";
const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Tenant-aware storage class that ensures all operations are scoped to the correct publisher
 */
class TenantAwareStorage {
  // Publisher operations
  async createPublisher(data: InsertPublisher): Promise<Publisher> {
    const [publisher] = await db.insert(publishers).values(data).returning();
    return publisher;
  }

  async getPublisherById(id: string): Promise<Publisher | null> {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.id, id));
    return publisher || null;
  }

  async getPublisherBySubdomain(subdomain: string): Promise<Publisher | null> {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.subdomain, subdomain));
    return publisher || null;
  }

  async getPublisherByEmail(email: string): Promise<Publisher | null> {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.email, email));
    return publisher || null;
  }

  async updatePublisher(id: string, updates: Partial<Publisher>): Promise<Publisher | null> {
    const [publisher] = await db
      .update(publishers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(publishers.id, id))
      .returning();
    return publisher || null;
  }

  // User operations (tenant-aware)
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string, publisherId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.publisherId, publisherId)));
    return user || null;
  }

  async getUsers(publisherId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.publisherId, publisherId));
  }

  async updateUser(id: string, publisherId: string, updates: Partial<User>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(and(eq(users.id, id), eq(users.publisherId, publisherId)))
      .returning();
    return user || null;
  }

  // Subscriber operations (tenant-aware)
  async createSubscriber(data: InsertSubscriber): Promise<Subscriber> {
    const [subscriber] = await db.insert(subscribers).values(data).returning();
    return subscriber;
  }

  async getSubscribers(publisherId: string): Promise<Subscriber[]> {
    return await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.publisherId, publisherId))
      .orderBy(desc(subscribers.joinedAt));
  }

  async getSubscriber(id: string, publisherId: string): Promise<Subscriber | null> {
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(and(eq(subscribers.id, id), eq(subscribers.publisherId, publisherId)));
    return subscriber || null;
  }

  async getSubscriberByEmail(email: string, publisherId: string): Promise<Subscriber | null> {
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(and(eq(subscribers.email, email), eq(subscribers.publisherId, publisherId)));
    return subscriber || null;
  }

  async updateSubscriber(id: string, publisherId: string, updates: Partial<Subscriber>): Promise<Subscriber | null> {
    const [subscriber] = await db
      .update(subscribers)
      .set(updates)
      .where(and(eq(subscribers.id, id), eq(subscribers.publisherId, publisherId)))
      .returning();
    return subscriber || null;
  }

  async deleteSubscriber(id: string, publisherId: string): Promise<boolean> {
    const result = await db
      .delete(subscribers)
      .where(and(eq(subscribers.id, id), eq(subscribers.publisherId, publisherId)));
    return result.rowCount > 0;
  }

  async bulkImportSubscribers(subscriberData: InsertSubscriber[]): Promise<Subscriber[]> {
    return await db.insert(subscribers).values(subscriberData).returning();
  }

  // Campaign operations (tenant-aware)
  async createCampaign(data: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(data).returning();
    return campaign;
  }

  async getCampaigns(publisherId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.publisherId, publisherId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string, publisherId: string): Promise<Campaign | null> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.publisherId, publisherId)));
    return campaign || null;
  }

  async updateCampaign(id: string, publisherId: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.publisherId, publisherId)))
      .returning();
    return campaign || null;
  }

  async deleteCampaign(id: string, publisherId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.publisherId, publisherId)));
    return result.rowCount > 0;
  }

  // A/B Test operations (tenant-aware)
  async createABTest(data: InsertABTest): Promise<ABTest> {
    const [abTest] = await db.insert(abTests).values(data).returning();
    return abTest;
  }

  async getABTests(publisherId: string): Promise<ABTest[]> {
    return await db
      .select()
      .from(abTests)
      .where(eq(abTests.publisherId, publisherId))
      .orderBy(desc(abTests.createdAt));
  }

  async getABTest(id: string, publisherId: string): Promise<ABTest | null> {
    const [abTest] = await db
      .select()
      .from(abTests)
      .where(and(eq(abTests.id, id), eq(abTests.publisherId, publisherId)));
    return abTest || null;
  }

  async updateABTest(id: string, publisherId: string, updates: Partial<ABTest>): Promise<ABTest | null> {
    const [abTest] = await db
      .update(abTests)
      .set(updates)
      .where(and(eq(abTests.id, id), eq(abTests.publisherId, publisherId)))
      .returning();
    return abTest || null;
  }

  // Email Integration operations (tenant-aware)
  async createEmailIntegration(data: InsertEmailIntegration): Promise<EmailIntegration> {
    const [integration] = await db.insert(emailIntegrations).values(data).returning();
    return integration;
  }

  async getEmailIntegrations(publisherId: string): Promise<EmailIntegration[]> {
    return await db
      .select()
      .from(emailIntegrations)
      .where(eq(emailIntegrations.publisherId, publisherId));
  }

  async getEmailIntegration(id: string, publisherId: string): Promise<EmailIntegration | null> {
    const [integration] = await db
      .select()
      .from(emailIntegrations)
      .where(and(eq(emailIntegrations.id, id), eq(emailIntegrations.publisherId, publisherId)));
    return integration || null;
  }

  async updateEmailIntegration(id: string, publisherId: string, updates: Partial<EmailIntegration>): Promise<EmailIntegration | null> {
    const [integration] = await db
      .update(emailIntegrations)
      .set(updates)
      .where(and(eq(emailIntegrations.id, id), eq(emailIntegrations.publisherId, publisherId)))
      .returning();
    return integration || null;
  }

  // CRM Integration operations (tenant-aware)
  async createCrmIntegration(data: InsertCrmIntegration): Promise<CrmIntegration> {
    const [integration] = await db.insert(crmIntegrations).values(data).returning();
    return integration;
  }

  async getCrmIntegrations(publisherId: string): Promise<CrmIntegration[]> {
    return await db
      .select()
      .from(crmIntegrations)
      .where(eq(crmIntegrations.publisherId, publisherId));
  }

  async getCrmIntegration(id: string, publisherId: string): Promise<CrmIntegration | null> {
    const [integration] = await db
      .select()
      .from(crmIntegrations)
      .where(and(eq(crmIntegrations.id, id), eq(crmIntegrations.publisherId, publisherId)));
    return integration || null;
  }

  async updateCrmIntegration(id: string, publisherId: string, updates: Partial<CrmIntegration>): Promise<CrmIntegration | null> {
    const [integration] = await db
      .update(crmIntegrations)
      .set(updates)
      .where(and(eq(crmIntegrations.id, id), eq(crmIntegrations.publisherId, publisherId)))
      .returning();
    return integration || null;
  }

  // Analytics operations (tenant-aware)
  async createAnalytics(data: Partial<Analytics> & { publisherId: string }): Promise<Analytics> {
    const [analyticsRecord] = await db.insert(analytics).values(data).returning();
    return analyticsRecord;
  }

  async getLatestAnalytics(publisherId: string): Promise<Analytics | null> {
    const [analyticsRecord] = await db
      .select()
      .from(analytics)
      .where(eq(analytics.publisherId, publisherId))
      .orderBy(desc(analytics.date))
      .limit(1);
    return analyticsRecord || null;
  }

  async getAnalyticsHistory(publisherId: string, days: number = 30): Promise<Analytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db
      .select()
      .from(analytics)
      .where(and(
        eq(analytics.publisherId, publisherId),
        sql`${analytics.date} >= ${startDate}`
      ))
      .orderBy(desc(analytics.date));
  }

  // AI Content History operations (tenant-aware)
  async createAiContentHistory(data: InsertAiContentHistory): Promise<AiContentHistory> {
    const [record] = await db.insert(aiContentHistory).values(data).returning();
    return record;
  }

  async getAiContentHistory(publisherId: string, limit: number = 50): Promise<AiContentHistory[]> {
    return await db
      .select()
      .from(aiContentHistory)
      .where(eq(aiContentHistory.publisherId, publisherId))
      .orderBy(desc(aiContentHistory.createdAt))
      .limit(limit);
  }

  // Utility methods for analytics calculation
  async calculateAnalytics(publisherId: string): Promise<Analytics> {
    // Get subscriber count
    const subscriberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscribers)
      .where(and(eq(subscribers.publisherId, publisherId), eq(subscribers.isActive, true)));

    // Get recent campaign performance
    const recentCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.publisherId, publisherId),
        sql`${campaigns.sentAt} >= NOW() - INTERVAL '30 days'`
      ));

    // Calculate metrics
    const totalSubscribers = subscriberCount[0]?.count || 0;
    const totalCampaigns = recentCampaigns.length;
    const avgOpenRate = totalCampaigns > 0 
      ? recentCampaigns.reduce((sum, c) => sum + parseFloat(c.openRate || "0"), 0) / totalCampaigns 
      : 0;
    const avgClickRate = totalCampaigns > 0 
      ? recentCampaigns.reduce((sum, c) => sum + parseFloat(c.clickRate || "0"), 0) / totalCampaigns 
      : 0;
    const totalRevenue = recentCampaigns.reduce((sum, c) => sum + parseFloat(c.revenue || "0"), 0);

    // Create analytics record
    return await this.createAnalytics({
      publisherId,
      totalSubscribers,
      engagementRate: avgOpenRate.toString(),
      churnRate: "2.5", // This would be calculated based on unsubscribes
      monthlyRevenue: totalRevenue.toString(),
      revenueGrowth: "0", // This would be calculated based on previous period
      openRate: avgOpenRate.toString(),
      clickRate: avgClickRate.toString(),
      unsubscribeRate: "1.2", // This would be calculated based on actual data
    });
  }
}

export const tenantStorage = new TenantAwareStorage();

