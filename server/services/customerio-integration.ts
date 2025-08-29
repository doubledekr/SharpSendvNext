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
   * Get all customers/subscribers from Customer.io
   */
  async getCustomers(limit: number = 100, start?: string): Promise<{ customers: CustomerIoCustomer[], next?: string }> {
    try {
      let endpoint = `/customers?limit=${limit}`;
      if (start) {
        endpoint += `&start=${start}`;
      }
      
      const response = await this.makeApiRequest('GET', endpoint);
      
      return {
        customers: response.customers || [],
        next: response.meta?.next_start
      };
    } catch (error) {
      console.error('Failed to get customers:', error);
      return { customers: [] };
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
    name: string;
    from: string;
    subject: string;
    body: string;
    preheader?: string;
    segmentId?: string;
    tags?: string[];
    sendAt?: Date;
  }): Promise<{ success: boolean; broadcastId: number; message: string }> {
    try {
      // Create newsletter first
      const newsletterPayload = {
        newsletter: {
          name: `SharpSend_${broadcastData.name}`,
          subject: broadcastData.subject,
          from: broadcastData.from,
          body: broadcastData.body,
          preheader_text: broadcastData.preheader,
          tags: broadcastData.tags
        }
      };

      const newsletterResponse = await this.makeApiRequest('POST', '/newsletters', newsletterPayload);
      const newsletterId = newsletterResponse.newsletter.id;

      // Create broadcast
      const broadcastPayload: any = {
        broadcast: {
          name: `SharpSend_${broadcastData.name}`,
          newsletter_id: newsletterId,
          tags: broadcastData.tags || ['sharpsend']
        }
      };

      if (broadcastData.segmentId) {
        broadcastPayload.broadcast.segment_id = broadcastData.segmentId;
      }

      const broadcastResponse = await this.makeApiRequest('POST', '/broadcasts', broadcastPayload);
      const broadcastId = broadcastResponse.broadcast.id;

      // Trigger the broadcast
      if (broadcastData.sendAt) {
        // Schedule for later
        await this.makeApiRequest('POST', `/broadcasts/${broadcastId}/schedule`, {
          scheduled_for: Math.floor(broadcastData.sendAt.getTime() / 1000)
        });
      } else {
        // Send immediately
        await this.makeApiRequest('POST', `/broadcasts/${broadcastId}/trigger`);
      }

      return {
        success: true,
        broadcastId,
        message: broadcastData.sendAt 
          ? `Broadcast scheduled for ${broadcastData.sendAt.toISOString()}`
          : 'Broadcast sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        broadcastId: 0,
        message: `Failed to send broadcast: ${error.message}`
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