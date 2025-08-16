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
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data for the SharpSend.io demo scenario
    const currentDate = new Date();
    
    // Sample analytics data
    const analyticsData: Analytics = {
      id: randomUUID(),
      date: currentDate,
      totalSubscribers: 47842,
      engagementRate: "34.7",
      churnRate: "2.1",
      monthlyRevenue: "89450.00",
      revenueGrowth: "23.8"
    };
    this.analytics.set(analyticsData.id, analyticsData);

    // Sample email integrations
    const mailchimpIntegration: EmailIntegration = {
      id: randomUUID(),
      platform: "Mailchimp",
      isConnected: true,
      apiKey: "mc_key_xxx",
      lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      campaignsSent: 284,
      status: "active"
    };
    this.emailIntegrations.set(mailchimpIntegration.id, mailchimpIntegration);

    const sendgridIntegration: EmailIntegration = {
      id: randomUUID(),
      platform: "SendGrid",
      isConnected: true,
      apiKey: "sg_key_xxx",
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      campaignsSent: 1200,
      status: "active"
    };
    this.emailIntegrations.set(sendgridIntegration.id, sendgridIntegration);

    // Sample subscribers
    const subscriberData = [
      {
        email: "john.davidson@email.com",
        name: "John Davidson",
        segment: "High-Value Investor",
        engagementScore: "85.0",
        revenue: "2450.00"
      },
      {
        email: "sarah.chen@email.com",
        name: "Sarah Chen",
        segment: "Day Trader",
        engagementScore: "72.5",
        revenue: "1850.00"
      },
      {
        email: "mike.thompson@email.com",
        name: "Mike Thompson",
        segment: "Long-term Investor",
        engagementScore: "91.2",
        revenue: "3200.00"
      }
    ];

    subscriberData.forEach(data => {
      const subscriber: Subscriber = {
        id: randomUUID(),
        email: data.email,
        name: data.name,
        segment: data.segment,
        engagementScore: data.engagementScore,
        revenue: data.revenue,
        joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
        isActive: true,
        metadata: {}
      };
      this.subscribers.set(subscriber.id, subscriber);
    });

    // Sample A/B test
    const abTest: ABTest = {
      id: randomUUID(),
      name: "Subject Line Test: Market Update",
      status: "active",
      variantA: {
        subjectLine: "Weekly Market Analysis: Key Trends to Watch",
        content: "Traditional market analysis content...",
        openRate: 28.4,
        clickRate: 8.2,
        sent: 12456
      },
      variantB: {
        subjectLine: "🚨 URGENT: Market Shifts That Could Impact Your Portfolio",
        content: "Urgent market update content...",
        openRate: 34.7,
        clickRate: 12.8,
        sent: 12386
      },
      confidenceLevel: "95.2",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    };
    this.abTests.set(abTest.id, abTest);

    // Sample campaigns
    const campaignData = [
      {
        name: "Tesla Stock Analysis",
        subjectLine: "TSLA Breakthrough: What Investors Need to Know",
        content: "Deep dive into Tesla's latest developments...",
        openRate: "47.2",
        clickRate: "18.5",
        revenue: "8500.00",
        subscriberCount: 15000
      },
      {
        name: "Crypto Market Update",
        subjectLine: "Bitcoin Surge: Portfolio Implications",
        content: "Cryptocurrency market analysis...",
        openRate: "41.8",
        clickRate: "15.2",
        revenue: "6200.00",
        subscriberCount: 18000
      }
    ];

    campaignData.forEach(data => {
      const campaign: Campaign = {
        id: randomUUID(),
        name: data.name,
        subjectLine: data.subjectLine,
        content: data.content,
        sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        openRate: data.openRate,
        clickRate: data.clickRate,
        revenue: data.revenue,
        subscriberCount: data.subscriberCount
      };
      this.campaigns.set(campaign.id, campaign);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Subscriber methods
  async getSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values());
  }

  async getSubscriber(id: string): Promise<Subscriber | undefined> {
    return this.subscribers.get(id);
  }

  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const id = randomUUID();
    const subscriber: Subscriber = {
      ...insertSubscriber,
      id,
      joinedAt: new Date(),
      isActive: true
    };
    this.subscribers.set(id, subscriber);
    return subscriber;
  }

  async updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | undefined> {
    const subscriber = this.subscribers.get(id);
    if (!subscriber) return undefined;
    
    const updated = { ...subscriber, ...updates };
    this.subscribers.set(id, updated);
    return updated;
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    return this.subscribers.delete(id);
  }

  // Campaign methods
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      sentAt: new Date()
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  // A/B Test methods
  async getABTests(): Promise<ABTest[]> {
    return Array.from(this.abTests.values());
  }

  async getABTest(id: string): Promise<ABTest | undefined> {
    return this.abTests.get(id);
  }

  async createABTest(insertABTest: InsertABTest): Promise<ABTest> {
    const id = randomUUID();
    const abTest: ABTest = {
      ...insertABTest,
      id,
      createdAt: new Date()
    };
    this.abTests.set(id, abTest);
    return abTest;
  }

  async updateABTest(id: string, updates: Partial<ABTest>): Promise<ABTest | undefined> {
    const abTest = this.abTests.get(id);
    if (!abTest) return undefined;
    
    const updated = { ...abTest, ...updates };
    this.abTests.set(id, updated);
    return updated;
  }

  // Email Integration methods
  async getEmailIntegrations(): Promise<EmailIntegration[]> {
    return Array.from(this.emailIntegrations.values());
  }

  async getEmailIntegration(id: string): Promise<EmailIntegration | undefined> {
    return this.emailIntegrations.get(id);
  }

  async createEmailIntegration(insertIntegration: InsertEmailIntegration): Promise<EmailIntegration> {
    const id = randomUUID();
    const integration: EmailIntegration = {
      ...insertIntegration,
      id,
      lastSync: new Date()
    };
    this.emailIntegrations.set(id, integration);
    return integration;
  }

  async updateEmailIntegration(id: string, updates: Partial<EmailIntegration>): Promise<EmailIntegration | undefined> {
    const integration = this.emailIntegrations.get(id);
    if (!integration) return undefined;
    
    const updated = { ...integration, ...updates };
    this.emailIntegrations.set(id, updated);
    return updated;
  }

  // Analytics methods
  async getAnalytics(): Promise<Analytics[]> {
    return Array.from(this.analytics.values());
  }

  async getLatestAnalytics(): Promise<Analytics | undefined> {
    const analytics = Array.from(this.analytics.values());
    return analytics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }
}

import { DatabaseStorage } from "./db-storage";

export const storage = new DatabaseStorage();
