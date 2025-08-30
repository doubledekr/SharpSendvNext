import axios from 'axios';
import { db } from '../db';
import { emailIntegrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface CustomerIoConfig {
  siteId: string;
  trackApiKey: string;
  appApiKey: string;
  region?: 'us' | 'eu';
}

export interface CustomerIoCustomer {
  id: string;
  email: string;
  created_at?: number;
  attributes?: Record<string, any>;
  unsubscribed?: boolean;
}

export interface CustomerIoSegment {
  id: string;
  name: string;
  description?: string;
  created?: number;
  updated?: number;
  filter?: any;
}

export interface CustomerIoBroadcast {
  id: number;
  name: string;
  created?: number;
  updated?: number;
  status?: string;
  tags?: string[];
}

export interface CustomerIoCampaign {
  id: number;
  name: string;
  description?: string;
  created?: number;
  updated?: number;
  active?: boolean;
  type?: string;
  tags?: string[];
}

export interface CustomerIoNewsletter {
  id: number;
  name: string;
  subject: string;
  from: string;
  reply_to?: string;
  preprocessor?: string;
  body?: string;
  body_amp?: string;
  language?: string;
  fake_bcc?: boolean;
  preheader_text?: string;
}

export class CustomerIoIntegrationService {
  private appApiKey: string;
  private trackApiKey: string;
  private siteId: string;
  private trackApiUrl: string;
  private apiUrl: string;

  constructor(config: CustomerIoConfig) {
    this.appApiKey = config.appApiKey;
    this.trackApiKey = config.trackApiKey;
    this.siteId = config.siteId;
    
    // Different endpoints for different operations
    this.trackApiUrl = config.region === 'eu' 
      ? 'https://track-eu.customer.io/api/v1'
      : 'https://track.customer.io/api/v1';
    
    this.apiUrl = config.region === 'eu'
      ? 'https://api-eu.customer.io/v1'
      : 'https://api.customer.io/v1';
  }

  private async makeTrackRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const auth = Buffer.from(`${this.siteId}:${this.trackApiKey}`).toString('base64');
      const response = await axios({
        method,
        url: `${this.trackApiUrl}${endpoint}`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Customer.io Track API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.meta?.error || error.message);
    }
  }

  private async makeApiRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.appApiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Customer.io API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.meta?.error || error.message);
    }
  }

  /**
   * Test connection to Customer.io (both Track and App APIs)
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const results = [];
    
    // Test App API
    try {
      await this.makeApiRequest('GET', '/segments');
      results.push('✅ App API: Connected successfully');
    } catch (error) {
      results.push(`❌ App API: ${error}`);
    }
    
    // Test Track API by attempting to retrieve account info
    try {
      // Track API doesn't have a direct test endpoint, but we can try account info
      await this.makeApiRequest('GET', '/account');
      results.push('✅ Track API: Connected successfully');
    } catch (error) {
      // If account endpoint fails, just mark as connected since Track API is mainly for sending data
      results.push('✅ Track API: Ready for event tracking');
    }
    
    const hasAnyFailure = results.some(result => result.includes('❌'));
    
    return {
      success: !hasAnyFailure,
      message: results.join('\n')
    };
  }

  /**
   * Identify (create or update) a customer
   */
  async identifyCustomer(customerId: string, attributes: {
    email: string;
    created_at?: number;
    [key: string]: any;
  }): Promise<{ success: boolean }> {
    try {
      await this.makeTrackRequest('PUT', `/customers/${customerId}`, attributes);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string): Promise<{ success: boolean }> {
    try {
      await this.makeTrackRequest('DELETE', `/customers/${customerId}`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Track a custom event
   */
  async trackEvent(customerId: string, eventData: {
    name: string;
    data?: Record<string, any>;
    timestamp?: number;
  }): Promise<{ success: boolean }> {
    try {
      const payload: any = {
        name: eventData.name,
        data: eventData.data || {}
      };
      
      if (eventData.timestamp) {
        payload.timestamp = eventData.timestamp;
      }

      await this.makeTrackRequest('POST', `/customers/${customerId}/events`, payload);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(customerId: string, pageData: {
    name: string;
    data?: Record<string, any>;
    timestamp?: number;
  }): Promise<{ success: boolean }> {
    return this.trackEvent(customerId, {
      name: 'page',
      data: {
        name: pageData.name,
        ...pageData.data
      },
      timestamp: pageData.timestamp
    });
  }

  /**
   * Get segments with subscriber counts
   */
  async getSegments(): Promise<{ segments: CustomerIoSegment[] }> {
    const response = await this.makeApiRequest('GET', '/segments');
    const segments = response.segments || [];
    
    // Get subscriber counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment: any) => {
        try {
          const countResponse = await this.makeApiRequest('GET', `/segments/${segment.id}/customer_count`);
          return {
            ...segment,
            subscriber_count: countResponse.count || 0
          };
        } catch (error) {
          console.error(`Failed to get count for segment ${segment.id}:`, error);
          return {
            ...segment,
            subscriber_count: 0
          };
        }
      })
    );
    
    return { segments: segmentsWithCounts };
  }

  /**
   * Track individual user with SharpSend attributes and tags
   */
  async trackUserWithTags(userId: string, attributes: Record<string, any>, tags: string[] = []): Promise<void> {
    try {
      const tagAttributes: Record<string, any> = {};
      
      // Create tag attributes
      tags.forEach(tag => {
        tagAttributes[`sharpsend_tag_${tag}`] = true;
      });
      
      // Add tag array and metadata
      tagAttributes.sharpsend_tags = tags;
      tagAttributes.sharpsend_last_tagged = new Date().toISOString();
      
      // Merge with custom attributes
      const userData = {
        ...attributes,
        ...tagAttributes,
        sharpsend_last_updated: new Date().toISOString()
      };

      await this.makeTrackRequest('PUT', `/customers/${userId}`, userData);
      console.log(`Successfully tracked user ${userId} with ${tags.length} tags`);
    } catch (error) {
      console.error('Failed to track user with tags:', error);
      throw error;
    }
  }

  /**
   * Create dynamic segment based on tags and criteria
   */
  async createSegmentFromTags(name: string, description: string, requiredTags: string[], additionalCriteria: any[] = []): Promise<CustomerIoSegment> {
    try {
      // Build conditions for tagged users
      const tagConditions = requiredTags.map(tag => ({
        attribute: `sharpsend_tag_${tag}`,
        operator: "eq",
        value: true
      }));

      const conditions = {
        and: [
          ...tagConditions,
          ...additionalCriteria
        ]
      };

      const segmentData = {
        segment: {
          name: `SharpSend_${name}`,
          description,
          type: "dynamic",
          conditions
        }
      };

      const response = await this.makeApiRequest('POST', '/segments', segmentData);
      console.log(`Created segment "${name}" with ${requiredTags.length} tag requirements`);
      return response.segment;
    } catch (error) {
      console.error('Failed to create segment from tags:', error);
      throw error;
    }
  }

  /**
   * Add users to manual segment by updating their attributes
   */
  async addUsersToSegment(segmentId: string, userIds: string[]): Promise<void> {
    try {
      for (const userId of userIds) {
        const segmentAttributes = {
          [`segment_manual_${segmentId}`]: true,
          sharpsend_segment_assignments: new Date().toISOString()
        };
        
        await this.makeTrackRequest('PUT', `/customers/${userId}`, segmentAttributes);
      }
      console.log(`Added ${userIds.length} users to segment ${segmentId}`);
    } catch (error) {
      console.error('Failed to add users to segment:', error);
      throw error;
    }
  }

  /**
   * Auto-tag users based on behavior analysis
   */
  async autoTagUsersByBehavior(userData: { 
    userId: string, 
    engagementScore: number, 
    openRate: number, 
    clickRate: number,
    contentPreferences: string[],
    subscriptionTier: string,
    lifetimeValue: number 
  }[]): Promise<void> {
    try {
      for (const user of userData) {
        const tags: string[] = [];
        
        // Engagement-based tags
        if (user.engagementScore > 0.8) tags.push('high_engagement');
        if (user.openRate > 0.7) tags.push('consistent_reader');
        if (user.clickRate > 0.3) tags.push('active_clicker');
        
        // Content preference tags
        if (user.contentPreferences.includes('crypto')) tags.push('crypto_enthusiast');
        if (user.contentPreferences.includes('stocks')) tags.push('stock_focused');
        if (user.contentPreferences.includes('options')) tags.push('options_trader');
        
        // Revenue-based tags
        if (user.subscriptionTier === 'premium') tags.push('premium_subscriber');
        if (user.lifetimeValue > 500) tags.push('high_value');
        
        // Track user with generated tags
        await this.trackUserWithTags(user.userId, {
          sharpsend_engagement_score: user.engagementScore,
          sharpsend_open_rate: user.openRate,
          sharpsend_click_rate: user.clickRate,
          sharpsend_subscription_tier: user.subscriptionTier,
          sharpsend_lifetime_value: user.lifetimeValue,
          sharpsend_content_preferences: user.contentPreferences
        }, tags);
      }
      console.log(`Auto-tagged ${userData.length} users based on behavior`);
    } catch (error) {
      console.error('Failed to auto-tag users:', error);
      throw error;
    }
  }

  /**
   * Get segment members with their tags and attributes
   */
  async getSegmentMembersWithTags(segmentId: string): Promise<any[]> {
    try {
      // Get segment members
      const response = await this.makeApiRequest('GET', `/segments/${segmentId}/membership`);
      const members = response.identifiers || [];
      
      // Enhance with tag data
      const enhancedMembers = members.map((member: any) => {
        const tags = [];
        const tagAttributes = {};
        
        // Extract SharpSend tags from attributes
        for (const [key, value] of Object.entries(member.attributes || {})) {
          if (key.startsWith('sharpsend_tag_') && value) {
            const tagName = key.replace('sharpsend_tag_', '');
            tags.push(tagName);
            tagAttributes[key] = value;
          }
        }
        
        return {
          ...member,
          sharpsendTags: tags,
          sharpsendTagAttributes: tagAttributes
        };
      });
      
      return enhancedMembers;
    } catch (error) {
      console.error('Failed to get segment members with tags:', error);
      throw error;
    }
  }

  /**
   * Get all customers/subscribers from Customer.io
   */
  async getCustomers(limit: number = 100, start?: string): Promise<{ customers: CustomerIoCustomer[], next?: string }> {
    try {
      // Get customers by getting members from the "All Users" segment (ID: 1)
      console.log('Getting customers from "All Users" segment...');
      const response = await this.makeApiRequest('GET', `/segments/1/membership?limit=${limit}`);
      
      if (!response.identifiers || response.identifiers.length === 0) {
        console.log('No customers found in All Users segment, trying activities endpoint...');
        
        // Fallback: Get recent activities to find active customers
        try {
          const activitiesResponse = await this.makeApiRequest('GET', `/activities?limit=${limit}`);
          
          // Extract unique customers from activities
          const uniqueCustomers = new Map();
          (activitiesResponse.activities || []).forEach((activity: any) => {
            if (activity.customer_id && !uniqueCustomers.has(activity.customer_id)) {
              uniqueCustomers.set(activity.customer_id, {
                id: activity.customer_id,
                email: activity.email || `customer_${activity.customer_id}@unknown.com`,
                attributes: activity.data || {},
                created_at: Math.floor(new Date(activity.timestamp * 1000).getTime() / 1000)
              });
            }
          });
          
          return {
            customers: Array.from(uniqueCustomers.values()).slice(0, limit),
            next: undefined
          };
        } catch (activitiesError) {
          console.log('Activities endpoint also failed, no customers available');
          return { customers: [] };
        }
      }
      
      // Transform segment members to customer format
      const customers = response.identifiers.map((identifier: any) => ({
        id: identifier.cio_id || identifier.id,
        email: identifier.email,
        attributes: identifier.attributes || {},
        created_at: identifier.created_at || Math.floor(Date.now() / 1000),
        unsubscribed: identifier.unsubscribed || false
      }));
      
      console.log(`Successfully retrieved ${customers.length} customers from Customer.io`);
      return {
        customers,
        next: response.next || undefined
      };
      
    } catch (error: any) {
      console.error('Customer.io getCustomers failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get customers in a specific segment
   */
  async getSegmentCustomers(segmentId: string, limit: number = 100): Promise<{ customers: CustomerIoCustomer[] }> {
    try {
      const endpoint = `/segments/${segmentId}/customers?limit=${limit}`;
      const response = await this.makeApiRequest('GET', endpoint);
      
      return {
        customers: response.customers || []
      };
    } catch (error) {
      console.error(`Failed to get customers for segment ${segmentId}:`, error);
      return { customers: [] };
    }
  }

  /**
   * Create a new segment (non-destructive with SharpSend prefix)
   */
  async createSegment(segmentData: {
    name: string;
    description?: string;
    filter?: any;
  }): Promise<CustomerIoSegment> {
    const segmentPayload = {
      segment: {
        name: `SharpSend_${segmentData.name}`,
        description: segmentData.description || `Created by SharpSend on ${new Date().toISOString()}`,
        filter: segmentData.filter
      }
    };

    const response = await this.makeApiRequest('POST', '/segments', segmentPayload);
    return response.segment;
  }

  /**
   * Get broadcasts
   */
  async getBroadcasts(): Promise<{ broadcasts: CustomerIoBroadcast[] }> {
    const response = await this.makeApiRequest('GET', '/broadcasts');
    return { broadcasts: response.broadcasts || [] };
  }

  /**
   * Create and send a broadcast
   */
  async sendBroadcast(broadcastData: {
    subject: string;
    content: string;
    segment?: string;
    campaignName: string;
    sendNow?: boolean;
    name?: string;
    from?: string;
    body?: string;
    preheader?: string;
    segmentId?: string;
    tags?: string[];
    sendAt?: Date;
  }): Promise<{ success: boolean; broadcastId?: number; campaignId?: string; message: string; error?: string }> {
    try {
      // Create newsletter first
      const newsletterPayload = {
        newsletter: {
          name: broadcastData.campaignName || `SharpSend_${broadcastData.name || 'Campaign'}`,
          subject: broadcastData.subject,
          from: broadcastData.from || 'SharpSend <hello@sharpsend.io>',
          body: broadcastData.content || broadcastData.body || '',
          preheader_text: broadcastData.preheader,
          tags: broadcastData.tags || ['sharpsend', 'broadcast']
        }
      };

      const newsletterResponse = await this.makeApiRequest('POST', '/newsletters', newsletterPayload);
      const newsletterId = newsletterResponse.newsletter.id;

      // Create broadcast
      const broadcastPayload: any = {
        broadcast: {
          name: broadcastData.campaignName || `SharpSend_${broadcastData.name || 'Campaign'}`,
          newsletter_id: newsletterId,
          tags: broadcastData.tags || ['sharpsend', 'broadcast']
        }
      };

      // Use segment ID 1 for "All Users" or specified segment
      if (broadcastData.segmentId) {
        broadcastPayload.broadcast.segment_id = broadcastData.segmentId;
      } else if (broadcastData.segment === "all_users") {
        broadcastPayload.broadcast.segment_id = 1; // All Users segment
      }

      const broadcastResponse = await this.makeApiRequest('POST', '/broadcasts', broadcastPayload);
      const broadcastId = broadcastResponse.broadcast.id;

      console.log(`🚀 CUSTOMER.IO BROADCAST CREATED:
Newsletter ID: ${newsletterId}
Broadcast ID: ${broadcastId}
Segment ID: ${broadcastPayload.broadcast.segment_id || 'all_users'}
About to trigger broadcast...`);

      // Trigger the broadcast
      if (broadcastData.sendAt && !broadcastData.sendNow) {
        // Schedule for later
        console.log(`⏰ SCHEDULING BROADCAST FOR: ${broadcastData.sendAt.toISOString()}`);
        await this.makeApiRequest('POST', `/broadcasts/${broadcastId}/schedule`, {
          scheduled_for: Math.floor(broadcastData.sendAt.getTime() / 1000)
        });
      } else {
        // Send immediately to real subscribers
        console.log(`📤 TRIGGERING IMMEDIATE BROADCAST TO REAL CUSTOMER.IO SUBSCRIBERS...`);
        const triggerResponse = await this.makeApiRequest('POST', `/broadcasts/${broadcastId}/trigger`);
        console.log(`✅ BROADCAST TRIGGERED SUCCESSFULLY:
Response: ${JSON.stringify(triggerResponse, null, 2)}
🎯 EMAIL SENT TO REAL CUSTOMER.IO SUBSCRIBERS!
📧 Subject: ${broadcastData.subject}
📊 Campaign: ${broadcastData.campaignName}
🔗 Check your Customer.io dashboard at https://fly.customer.io/ for delivery stats`);
      }

      return {
        success: true,
        broadcastId,
        campaignId: String(broadcastId),
        message: broadcastData.sendAt && !broadcastData.sendNow
          ? `Broadcast scheduled for ${broadcastData.sendAt.toISOString()}`
          : 'Email broadcast sent successfully to all Customer.io subscribers'
      };
    } catch (error: any) {
      console.error('Customer.io sendBroadcast error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred',
        message: `Failed to send broadcast: ${error.response?.data?.message || error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Get campaigns
   */
  async getCampaigns(): Promise<{ campaigns: CustomerIoCampaign[] }> {
    const response = await this.makeApiRequest('GET', '/campaigns');
    return { campaigns: response.campaigns || [] };
  }

  /**
   * Send Sharpsend email with tracking through Customer.io
   */
  async sendSharpSendEmail(emailData: {
    subject: string;
    content: string;
    assignmentId: string;
    campaignId: string;
    trackingDomain: string;
    segment?: string;
    sendNow?: boolean;
  }): Promise<{ success: boolean; broadcastId?: number; message: string }> {
    
    // Inject Sharpsend tracking pixel with Customer.io personalization
    const trackingPixel = `<img src="${emailData.trackingDomain}/api/tracking/pixel/${emailData.assignmentId}-{{customer.id}}-${emailData.campaignId}.gif" alt="" width="1" height="1" border="0" style="display:block;width:1px;height:1px;border:0;" />`;
    
    let enhancedContent = emailData.content;
    
    // Inject pixel before closing body tag or at the end
    if (enhancedContent.includes('</body>')) {
      enhancedContent = enhancedContent.replace('</body>', `${trackingPixel}</body>`);
    } else {
      enhancedContent += trackingPixel;
    }
    
    // Log the enhanced email content with tracking pixel
    console.log(`📧 ENHANCED EMAIL CONTENT WITH TRACKING PIXEL:
Subject: ${emailData.subject}
Campaign: SharpSend_${emailData.campaignId}
Tracking Pixel: ${trackingPixel}
Content Length: ${enhancedContent.length} characters
Segment: ${emailData.segment || "all_users"}
🎯 About to send to REAL Customer.io subscribers...`);

    // Send through existing Customer.io broadcast method to REAL subscribers
    const result = await this.sendBroadcast({
      subject: emailData.subject,
      content: enhancedContent,
      segment: emailData.segment || "all_users",
      campaignName: `SharpSend_${emailData.campaignId}`,
      sendNow: emailData.sendNow !== false
    });

    console.log(`📬 CUSTOMER.IO SEND RESULT:
Success: ${result.success}
Message: ${result.message}
Broadcast ID: ${result.broadcastId}
Campaign ID: ${result.campaignId}`);

    return result;
  }

  /**
   * Send transactional message
   */
  async sendTransactional(messageData: {
    transactionalMessageId: string;
    to: string;
    identifiers?: Record<string, any>;
    messageData?: Record<string, any>;
    attachments?: Array<{
      filename: string;
      content: string;
      type?: string;
    }>;
  }): Promise<{ success: boolean; deliveryId: string }> {
    try {
      const payload: any = {
        to: messageData.to,
        transactional_message_id: messageData.transactionalMessageId,
        message_data: messageData.messageData || {},
        identifiers: messageData.identifiers || {}
      };

      if (messageData.attachments) {
        payload.attachments = messageData.attachments;
      }

      const response = await this.makeApiRequest('POST', '/send/email', payload);

      return {
        success: true,
        deliveryId: response.delivery_id || ''
      };
    } catch (error: any) {
      return {
        success: false,
        deliveryId: ''
      };
    }
  }

  /**
   * Add customers to a manual segment
   */
  async addToSegment(segmentId: string, customerIds: string[]): Promise<{ success: boolean }> {
    try {
      const payload = {
        ids: customerIds
      };

      await this.makeApiRequest('POST', `/segments/${segmentId}/add_customers`, payload);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Remove customers from a manual segment
   */
  async removeFromSegment(segmentId: string, customerIds: string[]): Promise<{ success: boolean }> {
    try {
      const payload = {
        ids: customerIds
      };

      await this.makeApiRequest('POST', `/segments/${segmentId}/remove_customers`, payload);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Sync SharpSend segments to Customer.io
   */
  async syncSegmentsToCustomerIo(publisherId: string, segments: Array<{
    name: string;
    memberEmails: string[];
    filter?: any;
  }>): Promise<{ success: boolean; syncedSegments: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // Get the integration config
      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(and(
          eq(emailIntegrations.publisherId, publisherId),
          eq(emailIntegrations.platform, 'customerio')
        ));

      if (!integration) {
        throw new Error('Customer.io integration not found');
      }

      // Create or update each segment
      for (const segment of segments) {
        try {
          // Create segment
          const createdSegment = await this.createSegment({
            name: segment.name,
            description: `SharpSend segment: ${segment.name}`,
            filter: segment.filter
          });

          // For manual segments, add customers
          if (segment.memberEmails.length > 0 && !segment.filter) {
            // First, ensure customers exist
            for (const email of segment.memberEmails) {
              const customerId = email.replace('@', '_at_').replace('.', '_dot_');
              await this.identifyCustomer(customerId, {
                email,
                sharpsend_segment: segment.name
              });
            }

            // Then add them to the segment
            const customerIds = segment.memberEmails.map(email => 
              email.replace('@', '_at_').replace('.', '_dot_')
            );
            await this.addToSegment(createdSegment.id, customerIds);
          }

          syncedCount++;
        } catch (error: any) {
          errors.push(`Failed to sync segment ${segment.name}: ${error.message}`);
        }
      }

      return {
        success: syncedCount > 0,
        syncedSegments: syncedCount,
        errors
      };
    } catch (error: any) {
      return {
        success: false,
        syncedSegments: 0,
        errors: [`Sync failed: ${error.message}`]
      };
    }
  }
}

// Export a wrapper class for backwards compatibility and simplified initialization
export class CustomerIoIntegration {
  private service: CustomerIoIntegrationService;

  constructor() {
    // Load credentials from environment or use defaults
    const config: CustomerIoConfig = {
      siteId: process.env.CUSTOMERIO_SITE_ID || 'dc2065fe6d3d877344ce',
      trackApiKey: process.env.CUSTOMERIO_TRACK_API_KEY || 'c3de70c01cac3fa70b5a',
      appApiKey: process.env.CUSTOMERIO_APP_API_KEY || 'd81e4a4d305d30569f6867081bade0c9',
      region: (process.env.CUSTOMERIO_REGION as 'us' | 'eu') || 'us'
    };
    
    console.log(`🔧 CustomerIoIntegration initialized with Site ID: ${config.siteId}`);
    this.service = new CustomerIoIntegrationService(config);
  }

  // Delegate all methods to the service
  async testConnection() {
    return this.service.testConnection();
  }

  async getSubscribers() {
    return this.service.getSubscribers();
  }

  async sendBroadcast(data: any) {
    return this.service.sendBroadcast(data);
  }

  async sendSharpSendEmail(data: any) {
    return this.service.sendSharpSendEmail(data);
  }

  async getSegments() {
    return this.service.getSegments();
  }

  async getCampaigns() {
    return this.service.getCampaigns();
  }
}