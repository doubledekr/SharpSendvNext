import { 
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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Subscribers
  getSubscribers(): Promise<Subscriber[]>;
  getSubscriber(id: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | undefined>;
  deleteSubscriber(id: string): Promise<boolean>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;

  // A/B Tests
  getABTests(): Promise<ABTest[]>;
  getABTest(id: string): Promise<ABTest | undefined>;
  createABTest(test: InsertABTest): Promise<ABTest>;
  updateABTest(id: string, updates: Partial<ABTest>): Promise<ABTest | undefined>;

  // Email Integrations
  getEmailIntegrations(): Promise<EmailIntegration[]>;
  getEmailIntegration(id: string): Promise<EmailIntegration | undefined>;
  createEmailIntegration(integration: InsertEmailIntegration): Promise<EmailIntegration>;
  updateEmailIntegration(id: string, updates: Partial<EmailIntegration>): Promise<EmailIntegration | undefined>;

  // Analytics
  getAnalytics(): Promise<Analytics[]>;
  getLatestAnalytics(): Promise<Analytics | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subscribers: Map<string, Subscriber>;
  private campaigns: Map<string, Campaign>;
  private abTests: Map<string, ABTest>;
  private emailIntegrations: Map<string, EmailIntegration>;
  private analytics: Map<string, Analytics>;

  constructor() {
    this.users = new Map();
    this.subscribers = new Map();
    this.campaigns = new Map();
    this.abTests = new Map();
    this.emailIntegrations = new Map();
    this.analytics = new Map();
    console.log("MemStorage initialized with NO MOCK DATA - only real integration data will be used");
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      createdAt: new Date(),
      ...user
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Subscribers - NO MOCK DATA
  async getSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values());
  }

  async getSubscriber(id: string): Promise<Subscriber | undefined> {
    return this.subscribers.get(id);
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const newSubscriber: Subscriber = {
      id: randomUUID(),
      ...subscriber
    };
    this.subscribers.set(newSubscriber.id, newSubscriber);
    return newSubscriber;
  }

  async updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | undefined> {
    const subscriber = this.subscribers.get(id);
    if (!subscriber) return undefined;

    const updatedSubscriber = { ...subscriber, ...updates };
    this.subscribers.set(id, updatedSubscriber);
    return updatedSubscriber;
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    return this.subscribers.delete(id);
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const newCampaign: Campaign = {
      id: randomUUID(),
      ...campaign
    };
    this.campaigns.set(newCampaign.id, newCampaign);
    return newCampaign;
  }

  // A/B Tests
  async getABTests(): Promise<ABTest[]> {
    return Array.from(this.abTests.values());
  }

  async getABTest(id: string): Promise<ABTest | undefined> {
    return this.abTests.get(id);
  }

  async createABTest(test: InsertABTest): Promise<ABTest> {
    const newTest: ABTest = {
      id: randomUUID(),
      ...test
    };
    this.abTests.set(newTest.id, newTest);
    return newTest;
  }

  async updateABTest(id: string, updates: Partial<ABTest>): Promise<ABTest | undefined> {
    const test = this.abTests.get(id);
    if (!test) return undefined;

    const updatedTest = { ...test, ...updates };
    this.abTests.set(id, updatedTest);
    return updatedTest;
  }

  // Email Integrations
  async getEmailIntegrations(): Promise<EmailIntegration[]> {
    return Array.from(this.emailIntegrations.values());
  }

  async getEmailIntegration(id: string): Promise<EmailIntegration | undefined> {
    return this.emailIntegrations.get(id);
  }

  async createEmailIntegration(integration: InsertEmailIntegration): Promise<EmailIntegration> {
    const newIntegration: EmailIntegration = {
      id: randomUUID(),
      ...integration
    };
    this.emailIntegrations.set(newIntegration.id, newIntegration);
    return newIntegration;
  }

  async updateEmailIntegration(id: string, updates: Partial<EmailIntegration>): Promise<EmailIntegration | undefined> {
    const integration = this.emailIntegrations.get(id);
    if (!integration) return undefined;

    const updatedIntegration = { ...integration, ...updates };
    this.emailIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  // Analytics - NO MOCK DATA
  async getAnalytics(): Promise<Analytics[]> {
    return Array.from(this.analytics.values());
  }

  async getLatestAnalytics(): Promise<Analytics | undefined> {
    const analytics = Array.from(this.analytics.values());
    if (analytics.length === 0) return undefined;
    
    return analytics.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }
}

export const storage = new MemStorage();