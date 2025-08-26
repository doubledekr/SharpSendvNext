// Enhanced Demo Data Service for SharpSend Platform
// Provides comprehensive in-memory demo data for showcasing all platform features

import { randomUUID } from 'crypto';

interface DemoSegment {
  id: string;
  publisherId: string;
  name: string;
  description: string;
  subscriberCount: number;
  engagementRate: number;
  avgRevenue: number;
  type: 'ai_detected' | 'user_defined';
  createdAt: Date;
}

interface DemoAssignment {
  id: string;
  publisherId: string;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'ready_for_approval' | 'approved' | 'completed';
  segment: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  assignee: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DemoPixelEvent {
  id: string;
  publisherId: string;
  subscriberEmail: string;
  eventType: 'open' | 'click' | 'purchase' | 'visit';
  metadata: any;
  timestamp: Date;
}

interface DemoEmailTemplate {
  id: string;
  publisherId: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  performanceScore: number;
  usageCount: number;
  createdAt: Date;
}

interface DemoIntegration {
  id: string;
  publisherId: string;
  platform: string;
  status: 'connected' | 'disconnected';
  subscriberCount: number;
  lastSync: Date;
  credentials?: any;
}

interface DemoOpportunity {
  id: string;
  publisherId: string;
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestedAction: string;
  potentialRevenue: number;
  confidence: number;
  createdAt: Date;
}

class DemoDataService {
  private static instance: DemoDataService;
  // Use the actual demo publisher ID from the database
  private demoPublisherId = '189ce086-e6c1-441e-ba0a-5e9bc2fe314e';
  private demoUserId = '18427442-c24d-440a-a8e0-89dd2394923a';
  
  // Data stores
  private segments: Map<string, DemoSegment> = new Map();
  private assignments: Map<string, DemoAssignment> = new Map();
  private pixelEvents: DemoPixelEvent[] = [];
  private emailTemplates: Map<string, DemoEmailTemplate> = new Map();
  private integrations: Map<string, DemoIntegration> = new Map();
  private opportunities: Map<string, DemoOpportunity> = new Map();
  private initialized = false;

  private constructor() {
    this.initializeAllDemoData();
  }

  public static getInstance(): DemoDataService {
    if (!DemoDataService.instance) {
      DemoDataService.instance = new DemoDataService();
    }
    return DemoDataService.instance;
  }

  private initializeAllDemoData() {
    if (this.initialized) return;
    
    console.log('📊 Initializing comprehensive demo data for medium-sized publisher...');
    
    this.initializeSegments();
    this.initializeAssignments();
    this.initializePixelEvents();
    this.initializeEmailTemplates();
    this.initializeIntegrations();
    this.initializeOpportunities();
    
    this.initialized = true;
    console.log('✅ Demo data fully initialized');
  }

  private initializeSegments() {
    const segments: DemoSegment[] = [
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'High-Value Tech Investors',
        description: 'Subscribers with $10k+ portfolios focused on technology stocks',
        subscriberCount: 3847,
        engagementRate: 82.5,
        avgRevenue: 4250,
        type: 'ai_detected',
        createdAt: new Date('2024-11-15')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Day Traders',
        description: 'Active traders making 5+ trades per week',
        subscriberCount: 2156,
        engagementRate: 76.3,
        avgRevenue: 1850,
        type: 'user_defined',
        createdAt: new Date('2024-10-20')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Crypto Enthusiasts',
        description: 'Digital asset investors interested in DeFi and blockchain',
        subscriberCount: 4892,
        engagementRate: 88.7,
        avgRevenue: 2750,
        type: 'ai_detected',
        createdAt: new Date('2024-12-01')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Retirement Planners',
        description: 'Long-term investors focused on retirement savings',
        subscriberCount: 6234,
        engagementRate: 71.2,
        avgRevenue: 3100,
        type: 'user_defined',
        createdAt: new Date('2024-09-10')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'ESG Investors',
        description: 'Environmentally and socially conscious investors',
        subscriberCount: 1945,
        engagementRate: 79.8,
        avgRevenue: 2200,
        type: 'ai_detected',
        createdAt: new Date('2024-12-10')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Options Traders',
        description: 'Advanced traders using derivatives strategies',
        subscriberCount: 1623,
        engagementRate: 84.3,
        avgRevenue: 3850,
        type: 'user_defined',
        createdAt: new Date('2024-11-01')
      }
    ];

    segments.forEach(segment => {
      this.segments.set(segment.id, segment);
    });
  }

  private initializeAssignments() {
    const assignments: DemoAssignment[] = [
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        title: 'Q1 2025 Tech Stock Analysis',
        description: 'Deep dive into FAANG earnings and AI sector opportunities',
        status: 'approved',
        segment: 'High-Value Tech Investors',
        priority: 'high',
        dueDate: new Date('2025-01-15'),
        assignee: 'Sarah Chen',
        content: 'Tech sector analysis with focus on AI breakthroughs...',
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-12')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        title: 'Bitcoin Halving Impact Report',
        description: 'Analysis of upcoming BTC halving and market implications',
        status: 'in_progress',
        segment: 'Crypto Enthusiasts',
        priority: 'high',
        dueDate: new Date('2025-02-01'),
        assignee: 'Michael Rodriguez',
        content: 'Bitcoin halving historical patterns and predictions...',
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-22')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        title: 'Weekly Options Strategy Guide',
        description: 'Iron condor and butterfly spread opportunities',
        status: 'ready_for_approval',
        segment: 'Options Traders',
        priority: 'medium',
        dueDate: new Date('2025-01-25'),
        assignee: 'David Kim',
        content: 'Advanced options strategies for volatile markets...',
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-23')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        title: 'ESG Portfolio Rebalancing',
        description: 'Quarterly update on sustainable investment opportunities',
        status: 'draft',
        segment: 'ESG Investors',
        priority: 'medium',
        dueDate: new Date('2025-02-10'),
        assignee: 'Emily Johnson',
        createdAt: new Date('2025-01-23'),
        updatedAt: new Date('2025-01-23')
      }
    ];

    assignments.forEach(assignment => {
      this.assignments.set(assignment.id, assignment);
    });
  }

  private initializePixelEvents() {
    // Generate realistic pixel events for the last 30 days
    const eventTypes = ['open', 'click', 'purchase', 'visit'];
    const subscribers = [
      'sarah.chen@techcorp.com',
      'michael.rodriguez@startup.io',
      'emily.johnson@consulting.com',
      'david.kim@fintech.ai',
      'alex.thompson@defi.com',
      'lisa.wang@investments.com',
      'john.smith@trading.net',
      'maria.garcia@wealth.com'
    ];

    for (let i = 0; i < 500; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      this.pixelEvents.push({
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        subscriberEmail: subscribers[Math.floor(Math.random() * subscribers.length)],
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
        metadata: {
          campaignId: randomUUID(),
          source: 'email',
          device: Math.random() > 0.5 ? 'mobile' : 'desktop',
          location: 'US'
        },
        timestamp
      });
    }
  }

  private initializeEmailTemplates() {
    const templates: DemoEmailTemplate[] = [
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Market Alert Template',
        subject: '🚨 {{STOCK}} Alert: {{ACTION}} Signal Triggered',
        content: 'AI-powered market alert with personalized recommendations...',
        category: 'alerts',
        performanceScore: 87.5,
        usageCount: 342,
        createdAt: new Date('2024-09-15')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Weekly Digest',
        subject: 'Your Weekly Investment Digest - {{DATE}}',
        content: 'Comprehensive weekly market analysis and portfolio updates...',
        category: 'newsletter',
        performanceScore: 72.3,
        usageCount: 52,
        createdAt: new Date('2024-10-01')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Earnings Report',
        subject: '📊 {{COMPANY}} Earnings: Beat/Miss Analysis',
        content: 'Detailed earnings analysis with AI-powered predictions...',
        category: 'analysis',
        performanceScore: 91.2,
        usageCount: 128,
        createdAt: new Date('2024-11-10')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        name: 'Portfolio Recommendation',
        subject: '💼 Personalized Portfolio Update for {{NAME}}',
        content: 'AI-driven portfolio rebalancing suggestions...',
        category: 'personalized',
        performanceScore: 94.7,
        usageCount: 867,
        createdAt: new Date('2024-12-05')
      }
    ];

    templates.forEach(template => {
      this.emailTemplates.set(template.id, template);
    });
  }

  private initializeIntegrations() {
    const integrations: DemoIntegration[] = [
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        platform: 'Mailchimp',
        status: 'connected',
        subscriberCount: 12847,
        lastSync: new Date('2025-01-23T10:30:00'),
        credentials: { apiKey: '***masked***' }
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        platform: 'SendGrid',
        status: 'connected',
        subscriberCount: 12843,
        lastSync: new Date('2025-01-23T09:15:00'),
        credentials: { apiKey: '***masked***' }
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        platform: 'ConvertKit',
        status: 'disconnected',
        subscriberCount: 0,
        lastSync: new Date('2024-12-15'),
        credentials: null
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        platform: 'Brevo',
        status: 'connected',
        subscriberCount: 12845,
        lastSync: new Date('2025-01-23T11:00:00'),
        credentials: { apiKey: '***masked***' }
      }
    ];

    integrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });
  }

  private initializeOpportunities() {
    const opportunities: DemoOpportunity[] = [
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        type: 'segment_growth',
        title: 'Crypto Segment Showing 45% Growth',
        description: 'Your crypto enthusiast segment has grown 45% this month. Consider increasing crypto-related content.',
        impact: 'high',
        suggestedAction: 'Launch targeted crypto education series',
        potentialRevenue: 18500,
        confidence: 92.3,
        createdAt: new Date('2025-01-22')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        type: 'engagement_opportunity',
        title: 'Options Traders Peak Activity Detected',
        description: 'Options traders showing 3x normal engagement on earnings weeks',
        impact: 'medium',
        suggestedAction: 'Create earnings calendar with options strategies',
        potentialRevenue: 8200,
        confidence: 87.5,
        createdAt: new Date('2025-01-21')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        type: 'reactivation',
        title: '847 Dormant High-Value Subscribers',
        description: 'High-value subscribers haven\'t engaged in 30+ days',
        impact: 'high',
        suggestedAction: 'Launch win-back campaign with exclusive insights',
        potentialRevenue: 25300,
        confidence: 78.9,
        createdAt: new Date('2025-01-20')
      },
      {
        id: randomUUID(),
        publisherId: this.demoPublisherId,
        type: 'content_optimization',
        title: 'AI Analysis Outperforming by 156%',
        description: 'AI-powered content getting 2.5x more engagement than standard newsletters',
        impact: 'medium',
        suggestedAction: 'Increase AI-generated content ratio to 60%',
        potentialRevenue: 12400,
        confidence: 94.2,
        createdAt: new Date('2025-01-19')
      }
    ];

    opportunities.forEach(opportunity => {
      this.opportunities.set(opportunity.id, opportunity);
    });
  }

  // Public getter methods
  public getDemoPublisherId(): string {
    return this.demoPublisherId;
  }

  public getDemoUserId(): string {
    return this.demoUserId;
  }

  public getSegments(publisherId: string): DemoSegment[] {
    if (publisherId !== this.demoPublisherId) return [];
    return Array.from(this.segments.values());
  }

  public getAssignments(publisherId: string): DemoAssignment[] {
    if (publisherId !== this.demoPublisherId) return [];
    return Array.from(this.assignments.values());
  }

  public getPixelEvents(publisherId: string, limit: number = 100): DemoPixelEvent[] {
    if (publisherId !== this.demoPublisherId) return [];
    return this.pixelEvents.slice(0, limit);
  }

  public getEmailTemplates(publisherId: string): DemoEmailTemplate[] {
    if (publisherId !== this.demoPublisherId) return [];
    return Array.from(this.emailTemplates.values());
  }

  public getIntegrations(publisherId: string): DemoIntegration[] {
    if (publisherId !== this.demoPublisherId) return [];
    return Array.from(this.integrations.values());
  }

  public getOpportunities(publisherId: string): DemoOpportunity[] {
    if (publisherId !== this.demoPublisherId) return [];
    return Array.from(this.opportunities.values());
  }

  public getAnalytics(publisherId: string) {
    if (publisherId !== this.demoPublisherId) return null;
    
    return {
      totalSubscribers: 12847,
      activeSubscribers: 10234,
      engagementRate: 74.2,
      openRate: 31.5,
      clickRate: 6.2,
      conversionRate: 2.8,
      monthlyRevenue: 89450,
      revenueGrowth: 23.5,
      churnRate: 2.8,
      lifetimeValue: 487,
      segmentPerformance: [
        { segment: 'High-Value Tech Investors', performance: 92.3 },
        { segment: 'Crypto Enthusiasts', performance: 88.7 },
        { segment: 'Options Traders', performance: 84.3 },
        { segment: 'Day Traders', performance: 76.3 },
        { segment: 'ESG Investors', performance: 79.8 },
        { segment: 'Retirement Planners', performance: 71.2 }
      ]
    };
  }

  public getCampaigns(publisherId: string) {
    if (publisherId !== this.demoPublisherId) return [];
    
    return [
      {
        id: randomUUID(),
        title: 'Tech Earnings Week Alert',
        status: 'sent',
        sentDate: new Date('2025-01-20'),
        recipients: 3847,
        openRate: 42.3,
        clickRate: 8.7,
        revenue: 12450
      },
      {
        id: randomUUID(),
        title: 'Crypto Market Update - BTC Rally',
        status: 'sent',
        sentDate: new Date('2025-01-18'),
        recipients: 4892,
        openRate: 51.2,
        clickRate: 12.3,
        revenue: 18750
      },
      {
        id: randomUUID(),
        title: 'Options Expiry Strategy Guide',
        status: 'scheduled',
        scheduledDate: new Date('2025-01-25'),
        recipients: 1623,
        estimatedOpenRate: 38.5,
        estimatedClickRate: 7.2
      },
      {
        id: randomUUID(),
        title: 'Q1 Portfolio Rebalancing',
        status: 'draft',
        recipients: 12847,
        estimatedOpenRate: 35.7,
        estimatedClickRate: 6.8
      }
    ];
  }

  public getABTests(publisherId: string) {
    if (publisherId !== this.demoPublisherId) return [];
    
    return [
      {
        id: randomUUID(),
        name: 'Subject Line Emoji Test',
        status: 'active',
        variantA: {
          name: 'No Emoji',
          subject: 'Market Alert: NVDA Breaks Resistance',
          sent: 1000,
          openRate: 28.5,
          clickRate: 5.2
        },
        variantB: {
          name: 'With Emoji',
          subject: '🚀 Market Alert: NVDA Breaks Resistance',
          sent: 1000,
          openRate: 34.7,
          clickRate: 6.8
        },
        confidence: 94.2,
        winner: 'variantB'
      },
      {
        id: randomUUID(),
        name: 'Personalization Test',
        status: 'completed',
        variantA: {
          name: 'Generic',
          subject: 'Your Weekly Investment Update',
          sent: 2000,
          openRate: 25.3,
          clickRate: 4.1
        },
        variantB: {
          name: 'Personalized',
          subject: 'John, Your Tech Portfolio Update',
          sent: 2000,
          openRate: 38.9,
          clickRate: 8.3
        },
        confidence: 98.7,
        winner: 'variantB'
      }
    ];
  }

  // Check if a user/publisher is the demo account
  public isDemoAccount(identifier: string): boolean {
    return identifier === this.demoPublisherId || identifier === this.demoUserId;
  }

  // Reset method for testing
  public reset() {
    this.segments.clear();
    this.assignments.clear();
    this.pixelEvents = [];
    this.emailTemplates.clear();
    this.integrations.clear();
    this.opportunities.clear();
    this.initialized = false;
    this.initializeAllDemoData();
  }
}

// Export singleton instance
export const demoDataService = DemoDataService.getInstance();
export default demoDataService;