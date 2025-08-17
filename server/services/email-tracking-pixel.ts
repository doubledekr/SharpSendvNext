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
}

export class EmailTrackingPixel {
  private static instance: EmailTrackingPixel;
  
  // In-memory storage for demo (would use database in production)
  private trackingData: Map<string, EmailOpenEvent> = new Map();
  private subscriberOpens: Map<string, Set<string>> = new Map();
  private campaignOpens: Map<string, Set<string>> = new Map();
  
  // Privacy settings
  private privacyCompliant: boolean = true;
  private trackingEnabled: boolean = true;
  
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
  public generatePixelTag(emailId: string, subscriberId: string, baseUrl: string, campaignId?: string): string {
    if (!this.trackingEnabled) {
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
   * Track an email open event
   */
  public trackOpen(trackingId: string, userAgent?: string, ipAddress?: string): boolean {
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
  public getDashboardStats() {
    const totalTracked = this.trackingData.size;
    const totalOpens = Array.from(this.trackingData.values())
      .reduce((sum, e) => sum + e.openCount, 0);
    const uniqueOpeners = this.subscriberOpens.size;
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOpens = Array.from(this.trackingData.values())
      .filter(e => e.lastOpenedAt && e.lastOpenedAt > last24Hours).length;
    
    return {
      trackingEnabled: this.trackingEnabled,
      privacyCompliant: this.privacyCompliant,
      totalEmailsTracked: totalTracked,
      totalOpens,
      uniqueOpeners,
      averageOpenRate: totalTracked > 0 ? ((uniqueOpeners / totalTracked) * 100).toFixed(1) : '0',
      opensLast24Hours: recentOpens,
      topCampaigns: this.getTopCampaigns(3)
    };
  }
  
  /**
   * Toggle tracking on/off
   */
  public setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;
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
  private getTopCampaigns(limit: number) {
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
    
    return Array.from(campaigns.entries())
      .map(([id, stats]) => ({
        campaignId: id,
        uniqueOpens: stats.unique,
        totalOpens: stats.opens,
        openRate: `${((stats.unique / 1000) * 100).toFixed(1)}%`
      }))
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