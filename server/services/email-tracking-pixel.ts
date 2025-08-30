import crypto from 'crypto';

interface PixelTrackingData {
  emailId: string;
  subscriberId: string;
  campaignId?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  emailClient?: string;
}

interface EmailOpenEvent {
  trackingId: string;
  emailId: string;
  subscriberId: string;
  campaignId?: string;
  openedAt: Date;
  openCount: number;
  firstOpenedAt?: Date;
  lastOpenedAt?: Date;
  devices: Set<string>;
  locations: Set<string>;
  // Conversion tracking
  pageVisits?: PageVisit[];
  purchases?: Purchase[];
  clickedLinks?: ClickedLink[];
  conversionValue?: number;
}

interface PageVisit {
  url: string;
  visitedAt: Date;
  duration?: number;
  source: 'email' | 'direct' | 'search' | 'social';
  sessionId: string;
}

interface Purchase {
  orderId: string;
  amount: number;
  purchasedAt: Date;
  products: string[];
  attributedToEmail: boolean;
}

interface ClickedLink {
  url: string;
  clickedAt: Date;
  linkPosition: string;
  linkText: string;
}

export class EmailTrackingPixel {
  private static instance: EmailTrackingPixel;
  
  // In-memory storage for demo (would use database in production)
  private trackingData: Map<string, EmailOpenEvent> = new Map();
  private subscriberOpens: Map<string, Set<string>> = new Map();
  private campaignOpens: Map<string, Set<string>> = new Map();
  
  // Platform-wide settings
  private platformTrackingEnabled: boolean = true;
  private privacyCompliant: boolean = true;
  
  // Per-email tracking overrides (emailId -> enabled)
  private emailTrackingOverrides: Map<string, boolean> = new Map();
  
  // Conversion tracking storage
  private sessionTracking: Map<string, string> = new Map(); // sessionId -> subscriberId
  private conversionWindows: Map<string, Date> = new Map(); // subscriberId -> email opened date
  
  private constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }
  
  public static getInstance(): EmailTrackingPixel {
    if (!EmailTrackingPixel.instance) {
      EmailTrackingPixel.instance = new EmailTrackingPixel();
    }
    return EmailTrackingPixel.instance;
  }
  
  /**
   * Generate a unique tracking ID for an email
   */
  public generateTrackingId(emailId: string, subscriberId: string, campaignId?: string): string {
    const data = `${emailId}-${subscriberId}-${campaignId || 'direct'}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }
  
  /**
   * Generate the tracking pixel URL
   */
  public generatePixelUrl(trackingId: string, baseUrl: string): string {
    return `${baseUrl}/api/tracking/pixel/${trackingId}.gif`;
  }
  
  /**
   * Generate the complete pixel HTML tag
   */
  public generatePixelTag(emailId: string, subscriberId: string, baseUrl: string, campaignId?: string, forceTracking?: boolean): string {
    // Check if tracking should be applied for this email
    const shouldTrack = this.shouldTrackEmail(emailId, forceTracking);
    
    if (!shouldTrack) {
      return ''; // No tracking if disabled
    }
    
    const trackingId = this.generateTrackingId(emailId, subscriberId, campaignId);
    const pixelUrl = this.generatePixelUrl(trackingId, baseUrl);
    
    // Store tracking data
    this.trackingData.set(trackingId, {
      trackingId,
      emailId,
      subscriberId,
      campaignId,
      openedAt: new Date(),
      openCount: 0,
      devices: new Set(),
      locations: new Set()
    });
    
    // Return pixel tag with privacy-compliant attributes
    return `<img src="${pixelUrl}" alt="" width="1" height="1" border="0" style="display:block;width:1px;height:1px;border:0;" />`;
  }
  
  /**
   * Determine if an email should be tracked based on platform and email-specific settings
   */
  public shouldTrackEmail(emailId: string, forceTracking?: boolean): boolean {
    // If force tracking is specified, use that
    if (forceTracking !== undefined) {
      return forceTracking;
    }
    
    // Check if there's an email-specific override
    if (this.emailTrackingOverrides.has(emailId)) {
      return this.emailTrackingOverrides.get(emailId)!;
    }
    
    // Otherwise use platform-wide setting
    return this.platformTrackingEnabled;
  }
  
  /**
   * Set email-specific tracking preference
   */
  public setEmailTracking(emailId: string, enabled: boolean): void {
    this.emailTrackingOverrides.set(emailId, enabled);
  }
  
  /**
   * Get email-specific tracking preference
   */
  public getEmailTrackingStatus(emailId: string): { platformEnabled: boolean; emailOverride?: boolean; effectiveStatus: boolean } {
    const emailOverride = this.emailTrackingOverrides.get(emailId);
    
    return {
      platformEnabled: this.platformTrackingEnabled,
      emailOverride,
      effectiveStatus: this.shouldTrackEmail(emailId)
    };
  }
  
  /**
   * Track an email open event
   */
  public trackOpen(trackingId: string, userAgent?: string, ipAddress?: string, metadata?: any): boolean {
    const trackingEvent = this.trackingData.get(trackingId);
    
    if (!trackingEvent) {
      return false; // Invalid tracking ID
    }
    
    // Update open count
    trackingEvent.openCount++;
    trackingEvent.lastOpenedAt = new Date();
    
    if (trackingEvent.openCount === 1) {
      trackingEvent.firstOpenedAt = new Date();
    }
    
    // Parse device type from user agent
    if (userAgent) {
      const deviceType = this.detectDeviceType(userAgent);
      trackingEvent.devices.add(deviceType);
    }
    
    // Store location if privacy settings allow
    if (ipAddress && this.privacyCompliant) {
      // In production, would use IP geolocation service
      const location = this.getLocationFromIP(ipAddress);
      if (location) {
        trackingEvent.locations.add(location);
      }
    }
    
    // Update subscriber opens
    if (!this.subscriberOpens.has(trackingEvent.subscriberId)) {
      this.subscriberOpens.set(trackingEvent.subscriberId, new Set());
    }
    this.subscriberOpens.get(trackingEvent.subscriberId)!.add(trackingEvent.emailId);
    
    // Update campaign opens if applicable
    if (trackingEvent.campaignId) {
      if (!this.campaignOpens.has(trackingEvent.campaignId)) {
        this.campaignOpens.set(trackingEvent.campaignId, new Set());
      }
      this.campaignOpens.get(trackingEvent.campaignId)!.add(trackingEvent.subscriberId);
    }
    
    // Store Customer.io specific metadata if provided
    if (metadata) {
      trackingEvent.metadata = { ...trackingEvent.metadata, ...metadata };
    }
    
    return true;
  }
  
  /**
   * Get tracking statistics for a campaign
   */
  public getCampaignStats(campaignId: string) {
    const opens = this.campaignOpens.get(campaignId) || new Set();
    const events = Array.from(this.trackingData.values())
      .filter(e => e.campaignId === campaignId);
    
    const totalOpens = events.reduce((sum, e) => sum + e.openCount, 0);
    const uniqueOpens = opens.size;
    const devices = new Map<string, number>();
    const openTimes: Date[] = [];
    
    events.forEach(event => {
      event.devices.forEach(device => {
        devices.set(device, (devices.get(device) || 0) + 1);
      });
      if (event.firstOpenedAt) {
        openTimes.push(event.firstOpenedAt);
      }
    });
    
    return {
      campaignId,
      uniqueOpens,
      totalOpens,
      openRate: uniqueOpens > 0 ? ((uniqueOpens / 1000) * 100).toFixed(1) : '0',
      avgOpensPerUser: uniqueOpens > 0 ? (totalOpens / uniqueOpens).toFixed(1) : '0',
      deviceBreakdown: Object.fromEntries(devices),
      peakOpenTime: this.calculatePeakTime(openTimes),
      lastTracked: new Date()
    };
  }
  
  /**
   * Get subscriber engagement metrics
   */
  public getSubscriberEngagement(subscriberId: string) {
    const opens = this.subscriberOpens.get(subscriberId) || new Set();
    const events = Array.from(this.trackingData.values())
      .filter(e => e.subscriberId === subscriberId);
    
    const recentOpens = events
      .filter(e => e.lastOpenedAt && e.lastOpenedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length;
    
    return {
      subscriberId,
      totalEmailsOpened: opens.size,
      recentOpens30Days: recentOpens,
      avgOpenTime: this.calculateAvgOpenTime(events),
      preferredDevice: this.getMostUsedDevice(events),
      engagementScore: this.calculateEngagementScore(events)
    };
  }
  
  /**
   * Get dashboard statistics
   */
  public async getDashboardStats() {
    const totalTracked = this.trackingData.size;
    const totalOpens = Array.from(this.trackingData.values())
      .reduce((sum, e) => sum + e.openCount, 0);
    const uniqueOpeners = this.subscriberOpens.size;
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOpens = Array.from(this.trackingData.values())
      .filter(e => e.lastOpenedAt && e.lastOpenedAt > last24Hours).length;
    
    // Count emails with tracking overrides
    const emailsWithOverrides = this.emailTrackingOverrides.size;
    const overridesDisabled = Array.from(this.emailTrackingOverrides.values())
      .filter(enabled => !enabled).length;
    
    return {
      trackingEnabled: this.platformTrackingEnabled,
      privacyCompliant: this.privacyCompliant,
      totalEmailsTracked: totalTracked,
      totalOpens,
      uniqueOpeners,
      averageOpenRate: totalTracked > 0 ? ((uniqueOpeners / totalTracked) * 100).toFixed(1) : '0',
      opensLast24Hours: recentOpens,
      topCampaigns: await this.getTopCampaigns(3),
      emailOverrides: {
        total: emailsWithOverrides,
        disabled: overridesDisabled
      }
    };
  }
  
  /**
   * Toggle platform-wide tracking on/off
   */
  public setPlatformTrackingEnabled(enabled: boolean): void {
    this.platformTrackingEnabled = enabled;
  }
  
  /**
   * Get platform tracking status
   */
  public getPlatformTrackingEnabled(): boolean {
    return this.platformTrackingEnabled;
  }
  
  /**
   * Track a page visit from an email recipient
   */
  public trackPageVisit(subscriberId: string, pageData: {
    url: string;
    sessionId: string;
    duration?: number;
    source?: string;
  }): void {
    // Link session to subscriber
    this.sessionTracking.set(pageData.sessionId, subscriberId);
    
    // Find recent email opens for this subscriber
    const subscriberEmails = this.subscriberOpens.get(subscriberId);
    if (!subscriberEmails) return;
    
    // Add page visit to most recent email open event
    subscriberEmails.forEach(trackingId => {
      const event = this.trackingData.get(trackingId);
      if (event && this.isWithinAttributionWindow(event.lastOpenedAt || event.openedAt)) {
        if (!event.pageVisits) {
          event.pageVisits = [];
        }
        event.pageVisits.push({
          url: pageData.url,
          visitedAt: new Date(),
          duration: pageData.duration,
          source: (pageData.source as any) || 'email',
          sessionId: pageData.sessionId
        });
      }
    });
  }
  
  /**
   * Track a purchase and attribute to email if applicable
   */
  public trackPurchase(subscriberId: string, purchaseData: {
    orderId: string;
    amount: number;
    products: string[];
    sessionId?: string;
  }): boolean {
    // Check if this purchase can be attributed to an email
    const subscriberEmails = this.subscriberOpens.get(subscriberId);
    if (!subscriberEmails) return false;
    
    let attributed = false;
    
    // Look for recent email opens within attribution window (7 days)
    subscriberEmails.forEach(trackingId => {
      const event = this.trackingData.get(trackingId);
      if (event && this.isWithinAttributionWindow(event.lastOpenedAt || event.openedAt)) {
        if (!event.purchases) {
          event.purchases = [];
        }
        event.purchases.push({
          orderId: purchaseData.orderId,
          amount: purchaseData.amount,
          purchasedAt: new Date(),
          products: purchaseData.products,
          attributedToEmail: true
        });
        
        // Update conversion value
        event.conversionValue = (event.conversionValue || 0) + purchaseData.amount;
        attributed = true;
      }
    });
    
    return attributed;
  }
  
  /**
   * Track link clicks in emails
   */
  public trackLinkClick(trackingId: string, linkData: {
    url: string;
    linkPosition: string;
    linkText: string;
  }): void {
    const event = this.trackingData.get(trackingId);
    if (!event) return;
    
    if (!event.clickedLinks) {
      event.clickedLinks = [];
    }
    
    event.clickedLinks.push({
      url: linkData.url,
      clickedAt: new Date(),
      linkPosition: linkData.linkPosition,
      linkText: linkData.linkText
    });
  }
  
  /**
   * Check if an event is within attribution window (7 days)
   */
  private isWithinAttributionWindow(date: Date): boolean {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return date > sevenDaysAgo;
  }
  
  /**
   * Get conversion analytics for a campaign
   */
  public getCampaignConversionStats(campaignId: string): any {
    const campaignEmails = this.campaignOpens.get(campaignId);
    if (!campaignEmails) {
      return {
        campaignId,
        totalSent: 0,
        totalOpens: 0,
        conversions: 0,
        conversionRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        conversionFunnel: {
          emailSent: 0,
          emailOpened: 0,
          linkClicked: 0,
          pageVisited: 0,
          purchaseMade: 0
        }
      };
    }
    
    let totalRevenue = 0;
    let conversions = 0;
    let pageVisits = 0;
    let linkClicks = 0;
    const productCounts = new Map<string, number>();
    
    campaignEmails.forEach(trackingId => {
      const event = this.trackingData.get(trackingId);
      if (event) {
        if (event.purchases && event.purchases.length > 0) {
          conversions++;
          event.purchases.forEach(purchase => {
            totalRevenue += purchase.amount;
            purchase.products.forEach(product => {
              productCounts.set(product, (productCounts.get(product) || 0) + 1);
            });
          });
        }
        if (event.pageVisits && event.pageVisits.length > 0) {
          pageVisits++;
        }
        if (event.clickedLinks && event.clickedLinks.length > 0) {
          linkClicks++;
        }
      }
    });
    
    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }));
    
    const totalOpens = campaignEmails.size;
    
    return {
      campaignId,
      totalSent: totalOpens * 1.5, // Estimate
      totalOpens,
      conversions,
      conversionRate: totalOpens > 0 ? ((conversions / totalOpens) * 100).toFixed(2) : '0',
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: conversions > 0 ? (totalRevenue / conversions).toFixed(2) : '0',
      topProducts,
      conversionFunnel: {
        emailSent: Math.floor(totalOpens * 1.5),
        emailOpened: totalOpens,
        linkClicked: linkClicks,
        pageVisited: pageVisits,
        purchaseMade: conversions
      }
    };
  }
  
  /**
   * Get subscriber journey analytics
   */
  public getSubscriberJourney(subscriberId: string): any {
    const subscriberEmails = this.subscriberOpens.get(subscriberId);
    if (!subscriberEmails) {
      return {
        subscriberId,
        emailsOpened: 0,
        totalPageVisits: 0,
        totalPurchases: 0,
        totalSpent: 0,
        journey: []
      };
    }
    
    const journey: any[] = [];
    let totalPageVisits = 0;
    let totalPurchases = 0;
    let totalSpent = 0;
    
    subscriberEmails.forEach(trackingId => {
      const event = this.trackingData.get(trackingId);
      if (event) {
        // Email open event
        journey.push({
          type: 'email_open',
          timestamp: event.firstOpenedAt || event.openedAt,
          details: {
            emailId: event.emailId,
            campaignId: event.campaignId,
            openCount: event.openCount
          }
        });
        
        // Page visits
        if (event.pageVisits) {
          totalPageVisits += event.pageVisits.length;
          event.pageVisits.forEach(visit => {
            journey.push({
              type: 'page_visit',
              timestamp: visit.visitedAt,
              details: visit
            });
          });
        }
        
        // Link clicks
        if (event.clickedLinks) {
          event.clickedLinks.forEach(click => {
            journey.push({
              type: 'link_click',
              timestamp: click.clickedAt,
              details: click
            });
          });
        }
        
        // Purchases
        if (event.purchases) {
          totalPurchases += event.purchases.length;
          event.purchases.forEach(purchase => {
            totalSpent += purchase.amount;
            journey.push({
              type: 'purchase',
              timestamp: purchase.purchasedAt,
              details: purchase
            });
          });
        }
      }
    });
    
    // Sort journey by timestamp
    journey.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return {
      subscriberId,
      emailsOpened: subscriberEmails.size,
      totalPageVisits,
      totalPurchases,
      totalSpent: totalSpent.toFixed(2),
      averageOrderValue: totalPurchases > 0 ? (totalSpent / totalPurchases).toFixed(2) : '0',
      journey: journey.slice(-20) // Last 20 events
    };
  }
  
  /**
   * Set privacy compliance mode
   */
  public setPrivacyCompliant(compliant: boolean): void {
    this.privacyCompliant = compliant;
  }
  
  /**
   * Helper: Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }
  
  /**
   * Helper: Get location from IP (simplified for demo)
   */
  private getLocationFromIP(ip: string): string {
    // In production, would use a real IP geolocation service
    // For demo, return mock locations
    const locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Paris'];
    return locations[Math.floor(Math.random() * locations.length)];
  }
  
  /**
   * Helper: Calculate peak open time
   */
  private calculatePeakTime(times: Date[]): string {
    if (times.length === 0) return 'N/A';
    
    const hours = times.map(t => t.getHours());
    const hourCounts = new Map<number, number>();
    
    hours.forEach(h => {
      hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
    });
    
    const peakHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    
    return `${peakHour}:00 - ${peakHour + 1}:00`;
  }
  
  /**
   * Helper: Calculate average time to open
   */
  private calculateAvgOpenTime(events: EmailOpenEvent[]): string {
    const validEvents = events.filter(e => e.firstOpenedAt);
    if (validEvents.length === 0) return 'N/A';
    
    const totalMinutes = validEvents.reduce((sum, e) => {
      const created = new Date(e.openedAt);
      const opened = e.firstOpenedAt!;
      const diff = (opened.getTime() - created.getTime()) / (1000 * 60);
      return sum + diff;
    }, 0);
    
    const avgMinutes = totalMinutes / validEvents.length;
    
    if (avgMinutes < 60) return `${Math.round(avgMinutes)} min`;
    if (avgMinutes < 1440) return `${Math.round(avgMinutes / 60)} hours`;
    return `${Math.round(avgMinutes / 1440)} days`;
  }
  
  /**
   * Helper: Get most used device
   */
  private getMostUsedDevice(events: EmailOpenEvent[]): string {
    const devices = new Map<string, number>();
    
    events.forEach(e => {
      e.devices.forEach(d => {
        devices.set(d, (devices.get(d) || 0) + 1);
      });
    });
    
    if (devices.size === 0) return 'unknown';
    
    return Array.from(devices.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  /**
   * Helper: Calculate engagement score
   */
  private calculateEngagementScore(events: EmailOpenEvent[]): number {
    if (events.length === 0) return 0;
    
    const factors = {
      openRate: Math.min(events.length / 10, 1) * 40, // Max 40 points
      frequency: Math.min(events.filter(e => e.openCount > 1).length / events.length, 1) * 30, // Max 30 points
      recency: events.some(e => e.lastOpenedAt && e.lastOpenedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ? 30 : 0 // Max 30 points
    };
    
    return Math.round(factors.openRate + factors.frequency + factors.recency);
  }
  
  /**
   * Helper: Get top performing campaigns
   */
  private async getTopCampaigns(limit: number) {
    const campaigns = new Map<string, { opens: number; unique: number }>();
    
    this.campaignOpens.forEach((subscribers, campaignId) => {
      const events = Array.from(this.trackingData.values())
        .filter(e => e.campaignId === campaignId);
      
      const totalOpens = events.reduce((sum, e) => sum + e.openCount, 0);
      
      campaigns.set(campaignId, {
        opens: totalOpens,
        unique: subscribers.size
      });
    });
    
    // Get campaign names from campaign management service
    const { CampaignManagementService } = await import('./campaign-management');
    const campaignService = new CampaignManagementService();
    
    const campaignDetails = await Promise.all(
      Array.from(campaigns.entries()).map(async ([id, stats]) => {
        try {
          const campaign = await campaignService.getCampaignProject(id);
          const displayName = campaign?.name || `Campaign ${id.slice(-3).toUpperCase()}`;
          
          return {
            campaignId: id,
            campaignName: displayName,
            uniqueOpens: stats.unique,
            totalOpens: stats.opens,
            openRate: `${((stats.unique / Math.max(1000, stats.unique)) * 100).toFixed(1)}%`
          };
        } catch (error) {
          // Fallback to descriptive name if campaign not found
          return {
            campaignId: id,
            campaignName: `Financial Newsletter ${id.slice(-3).toUpperCase()}`,
            uniqueOpens: stats.unique,
            totalOpens: stats.opens,
            openRate: `${((stats.unique / Math.max(1000, stats.unique)) * 100).toFixed(1)}%`
          };
        }
      })
    );
    
    return campaignDetails
      .sort((a, b) => b.uniqueOpens - a.uniqueOpens)
      .slice(0, limit);
  }
  
  /**
   * Initialize demo data
   */
  private initializeDemoData() {
    // Add some demo tracking data
    const demoEmails = [
      { emailId: 'em-001', subscriberId: 'sub-101', campaignId: 'camp-001' },
      { emailId: 'em-002', subscriberId: 'sub-102', campaignId: 'camp-001' },
      { emailId: 'em-003', subscriberId: 'sub-103', campaignId: 'camp-002' }
    ];
    
    demoEmails.forEach(({ emailId, subscriberId, campaignId }) => {
      const trackingId = this.generateTrackingId(emailId, subscriberId, campaignId);
      this.trackingData.set(trackingId, {
        trackingId,
        emailId,
        subscriberId,
        campaignId,
        openedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        openCount: Math.floor(Math.random() * 5) + 1,
        firstOpenedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        lastOpenedAt: new Date(),
        devices: new Set(['desktop', 'mobile']),
        locations: new Set(['New York', 'London'])
      });
      
      // Update subscriber opens
      if (!this.subscriberOpens.has(subscriberId)) {
        this.subscriberOpens.set(subscriberId, new Set());
      }
      this.subscriberOpens.get(subscriberId)!.add(emailId);
      
      // Update campaign opens
      if (!this.campaignOpens.has(campaignId)) {
        this.campaignOpens.set(campaignId, new Set());
      }
      this.campaignOpens.get(campaignId)!.add(subscriberId);
    });
  }
}