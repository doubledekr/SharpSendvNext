import { eq } from "drizzle-orm";
import { db } from "./database";
import { 
  users, 
  subscribers, 
  campaigns, 
  abTests, 
  emailIntegrations, 
  analytics,
  type User, 
  type InsertUser, 
  type Subscriber, 
  type InsertSubscriber,
  type Campaign,
  type InsertCampaign,
  type ABTest,
  type InsertABTest,
  type EmailIntegration,
  type InsertEmailIntegration,
  type Analytics
} from "@shared/schema-multitenant";
import { type IStorage } from "./storage";
import bcrypt from "bcrypt";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userWithHashedPassword = { ...user, password: hashedPassword };
    
    const result = await db.insert(users).values(userWithHashedPassword).returning();
    return result[0];
  }

  // Subscribers
  async getSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers);
  }

  async getSubscriber(id: string): Promise<Subscriber | undefined> {
    const result = await db.select().from(subscribers).where(eq(subscribers.id, id)).limit(1);
    return result[0];
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const result = await db.insert(subscribers).values(subscriber).returning();
    return result[0];
  }

  async updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | undefined> {
    const result = await db.update(subscribers)
      .set(updates)
      .where(eq(subscribers.id, id))
      .returning();
    return result[0];
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const result = await db.delete(subscribers).where(eq(subscribers.id, id));
    return result.length > 0;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns);
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const result = await db.insert(campaigns).values(campaign).returning();
    return result[0];
  }

  // A/B Tests
  async getABTests(): Promise<ABTest[]> {
    return await db.select().from(abTests);
  }

  async getABTest(id: string): Promise<ABTest | undefined> {
    const result = await db.select().from(abTests).where(eq(abTests.id, id)).limit(1);
    return result[0];
  }

  async createABTest(test: InsertABTest): Promise<ABTest> {
    const result = await db.insert(abTests).values(test).returning();
    return result[0];
  }

  async updateABTest(id: string, updates: Partial<ABTest>): Promise<ABTest | undefined> {
    const result = await db.update(abTests)
      .set(updates)
      .where(eq(abTests.id, id))
      .returning();
    return result[0];
  }

  // Email Integrations
  async getEmailIntegrations(): Promise<EmailIntegration[]> {
    return await db.select().from(emailIntegrations);
  }

  async getEmailIntegration(id: string): Promise<EmailIntegration | undefined> {
    const result = await db.select().from(emailIntegrations).where(eq(emailIntegrations.id, id)).limit(1);
    return result[0];
  }

  async createEmailIntegration(integration: InsertEmailIntegration): Promise<EmailIntegration> {
    const result = await db.insert(emailIntegrations).values(integration).returning();
    return result[0];
  }

  async updateEmailIntegration(id: string, updates: Partial<EmailIntegration>): Promise<EmailIntegration | undefined> {
    const result = await db.update(emailIntegrations)
      .set(updates)
      .where(eq(emailIntegrations.id, id))
      .returning();
    return result[0];
  }

  // Analytics
  async getAnalytics(): Promise<Analytics[]> {
    return await db.select().from(analytics);
  }

  async getLatestAnalytics(): Promise<Analytics | undefined> {
    const result = await db.select().from(analytics).orderBy(analytics.date).limit(1);
    return result[0];
  }
}