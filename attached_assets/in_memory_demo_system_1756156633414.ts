// In-Memory Demo System for SharpSend Email Variations Engine
// This provides a complete demo environment without database dependencies

import { randomUUID } from 'crypto';

// Demo Data Types
interface DemoPublisher {
  id: string;
  name: string;
  email: string;
  subdomain: string;
  plan: string;
  createdAt: Date;
}

interface DemoUser {
  id: string;
  publisherId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}

interface DemoSubscriber {
  id: string;
  publisherId: string;
  email: string;
  name: string;
  segment: string;
  engagementScore: number;
  revenue: number;
  createdAt: Date;
}

interface DemoCampaign {
  id: string;
  publisherId: string;
  title: string;
  baseSubject: string;
  baseContent: string;
  status: string;
  createdAt: Date;
  variations: DemoEmailVariation[];
}

interface DemoEmailVariation {
  id: string;
  campaignId: string;
  segmentId: string;
  segmentName: string;
  subject: string;
  content: string;
  previewText: string;
  estimatedOpenRate: number;
  estimatedClickRate: number;
  predictedLift: number;
  createdAt: Date;
}

interface DemoAnalytics {
  publisherId: string;
  totalSubscribers: number;
  engagementRate: number;
  monthlyRevenue: number;
  churnRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

interface DemoABTest {
  id: string;
  publisherId: string;
  name: string;
  status: string;
  variantA: {
    subjectLine: string;
    content: string;
    openRate: number;
    clickRate: number;
    sent: number;
  };
  variantB: {
    subjectLine: string;
    content: string;
    openRate: number;
    clickRate: number;
    sent: number;
  };
  confidenceLevel: number;
  createdAt: Date;
}

// In-Memory Data Store
class InMemoryDemoStore {
  private publishers: Map<string, DemoPublisher> = new Map();
  private users: Map<string, DemoUser> = new Map();
  private subscribers: Map<string, DemoSubscriber> = new Map();
  private campaigns: Map<string, DemoCampaign> = new Map();
  private emailVariations: Map<string, DemoEmailVariation> = new Map();
  private analytics: Map<string, DemoAnalytics> = new Map();
  private abTests: Map<string, DemoABTest> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    if (this.initialized) return;

    console.log('🎭 Initializing in-memory demo data...');

    // Create demo publisher
    const demoPublisher: DemoPublisher = {
      id: 'demo-publisher-001',
      name: 'Demo Financial Publisher',
      email: 'admin@demo.sharpsend.io',
      subdomain: 'demo',
      plan: 'premium',
      createdAt: new Date()
    };
    this.publishers.set(demoPublisher.id, demoPublisher);

    // Create demo user
    const demoUser: DemoUser = {
      id: 'demo-user-001',
      publisherId: demoPublisher.id,
      username: 'demo',
      email: 'demo@sharpsend.io',
      password: 'demo123', // In real app, this would be hashed
      role: 'admin',
      createdAt: new Date()
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo subscribers
    const demoSubscribers: DemoSubscriber[] = [
      {
        id: randomUUID(),
        publisherId: demoPublisher.id,
        email: 'sarah.chen@techcorp.com',
        name: 'Sarah Chen',
        segment: 'High Value Investors',
        engagementScore: 89.5,
        revenue: 2450.00,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        publisherId: demoPublisher.id,
        email: 'michael.rodriguez@startup.io',
        name: 'Michael Rodriguez',
        segment: 'Day Traders',
        engagementScore: 76.3,
        revenue: 1250.00,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        publisherId: demoPublisher.id,
        email: 'emily.johnson@consulting.com',
        name: 'Emily Johnson',
        segment: 'Long-term Investors',
        engagementScore: 92.1,
        revenue: 3200.00,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        publisherId: demoPublisher.id,
        email: 'david.kim@fintech.ai',
        name: 'David Kim',
        segment: 'Options Traders',
        engagementScore: 68.7,
        revenue: 850.00,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        publisherId: demoPublisher.id,
        email: 'alex.crypto@defi.com',
        name: 'Alex Thompson',
        segment: 'Crypto Enthusiasts',
        engagementScore: 84.2,
        revenue: 1800.00,
        createdAt: new Date()
      }
    ];

    demoSubscribers.forEach(subscriber => {
      this.subscribers.set(subscriber.id, subscriber);
    });

    // Create demo analytics
    const demoAnalytics: DemoAnalytics = {
      publisherId: demoPublisher.id,
      totalSubscribers: 12847,
      engagementRate: 74.20,
      monthlyRevenue: 89450.00,
      churnRate: 2.80,
      openRate: 31.50,
      clickRate: 6.20,
      unsubscribeRate: 0.85
    };
    this.analytics.set(demoPublisher.id, demoAnalytics);

    // Create demo A/B test
    const demoABTest: DemoABTest = {
      id: randomUUID(),
      publisherId: demoPublisher.id,
      name: 'Subject Line Optimization Test',
      status: 'active',
      variantA: {
        subjectLine: '🚀 Tech Stock Alert: Major Breakthrough',
        content: 'Traditional market analysis format...',
        openRate: 24.5,
        clickRate: 4.2,
        sent: 1000
      },
      variantB: {
        subjectLine: 'AI Revolution: Your Portfolio\'s Next Move',
        content: 'AI-personalized insights and recommendations...',
        openRate: 31.8,
        clickRate: 6.7,
        sent: 1000
      },
      confidenceLevel: 92.3,
      createdAt: new Date()
    };
    this.abTests.set(demoABTest.id, demoABTest);

    this.initialized = true;
    console.log('✅ In-memory demo data initialized successfully');
  }

  // Publisher methods
  getPublisher(id: string): DemoPublisher | undefined {
    return this.publishers.get(id);
  }

  getPublisherBySubdomain(subdomain: string): DemoPublisher | undefined {
    return Array.from(this.publishers.values()).find(p => p.subdomain === subdomain);
  }

  // User methods
  getUser(id: string): DemoUser | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): DemoUser | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  // Subscriber methods
  getSubscribersByPublisher(publisherId: string): DemoSubscriber[] {
    return Array.from(this.subscribers.values()).filter(s => s.publisherId === publisherId);
  }

  getSubscribersBySegment(publisherId: string, segment: string): DemoSubscriber[] {
    return this.getSubscribersByPublisher(publisherId).filter(s => s.segment === segment);
  }

  // Campaign methods
  createCampaign(campaign: Omit<DemoCampaign, 'id' | 'createdAt' | 'variations'>): DemoCampaign {
    const newCampaign: DemoCampaign = {
      ...campaign,
      id: randomUUID(),
      createdAt: new Date(),
      variations: []
    };
    this.campaigns.set(newCampaign.id, newCampaign);
    return newCampaign;
  }

  getCampaign(id: string): DemoCampaign | undefined {
    return this.campaigns.get(id);
  }

  getCampaignsByPublisher(publisherId: string): DemoCampaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.publisherId === publisherId);
  }

  // Email variation methods
  createEmailVariation(variation: Omit<DemoEmailVariation, 'id' | 'createdAt'>): DemoEmailVariation {
    const newVariation: DemoEmailVariation = {
      ...variation,
      id: randomUUID(),
      createdAt: new Date()
    };
    this.emailVariations.set(newVariation.id, newVariation);

    // Add to campaign variations
    const campaign = this.campaigns.get(variation.campaignId);
    if (campaign) {
      campaign.variations.push(newVariation);
    }

    return newVariation;
  }

  getEmailVariation(id: string): DemoEmailVariation | undefined {
    return this.emailVariations.get(id);
  }

  getEmailVariationsByCampaign(campaignId: string): DemoEmailVariation[] {
    return Array.from(this.emailVariations.values()).filter(v => v.campaignId === campaignId);
  }

  // Analytics methods
  getAnalytics(publisherId: string): DemoAnalytics | undefined {
    return this.analytics.get(publisherId);
  }

  // A/B Test methods
  getABTestsByPublisher(publisherId: string): DemoABTest[] {
    return Array.from(this.abTests.values()).filter(t => t.publisherId === publisherId);
  }

  // Demo cohorts (hardcoded for demo purposes)
  getDemoCohorts(publisherId: string) {
    return [
      {
        id: 'day-traders',
        name: 'Day Traders',
        description: 'Active traders focused on intraday opportunities',
        subscriberCount: 4250,
        characteristics: 'High risk tolerance, technical analysis focused, prefer quick actionable insights',
        avgEngagement: 76.3,
        avgRevenue: 1250
      },
      {
        id: 'long-term-investors',
        name: 'Long-term Investors',
        description: 'Value-focused investors with 5+ year horizons',
        subscriberCount: 8500,
        characteristics: 'Risk-averse, fundamental analysis focused, dividend-oriented',
        avgEngagement: 92.1,
        avgRevenue: 3200
      },
      {
        id: 'options-traders',
        name: 'Options Traders',
        description: 'Derivatives specialists who understand Greeks',
        subscriberCount: 3200,
        characteristics: 'Moderate to high risk tolerance, prefer premium strategies',
        avgEngagement: 68.7,
        avgRevenue: 850
      },
      {
        id: 'crypto-enthusiasts',
        name: 'Crypto Enthusiasts',
        description: 'Digital asset investors and DeFi participants',
        subscriberCount: 5700,
        characteristics: 'High risk tolerance, tech-savvy, prefer innovative strategies',
        avgEngagement: 84.2,
        avgRevenue: 1800
      }
    ];
  }

  // Demo token generation
  generateDemoToken(): string {
    const demoPublisher = this.getPublisherBySubdomain('demo');
    const demoUser = this.getUserByEmail('demo@sharpsend.io');
    
    if (!demoPublisher || !demoUser) {
      throw new Error('Demo data not initialized');
    }

    return Buffer.from(JSON.stringify({
      publisherId: demoPublisher.id,
      userId: demoUser.id,
      email: demoUser.email,
      demo: true,
      timestamp: Date.now()
    })).toString('base64');
  }

  // Reset demo data (useful for testing)
  reset() {
    this.publishers.clear();
    this.users.clear();
    this.subscribers.clear();
    this.campaigns.clear();
    this.emailVariations.clear();
    this.analytics.clear();
    this.abTests.clear();
    this.initialized = false;
    this.initializeDemoData();
  }
}

// Global instance
export const inMemoryDemoStore = new InMemoryDemoStore();

// Helper functions for demo mode detection
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo';
}

export function getDemoPublisherId(): string {
  return 'demo-publisher-001';
}

export function getDemoUserId(): string {
  return 'demo-user-001';
}

// Demo middleware for routes
export function useDemoData<T>(
  demoDataFn: () => T,
  realDataFn: () => Promise<T>
): Promise<T> {
  if (isDemoMode()) {
    return Promise.resolve(demoDataFn());
  }
  return realDataFn();
}

export default inMemoryDemoStore;

