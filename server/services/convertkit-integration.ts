import axios from 'axios';
import { db } from '../db';
import { emailIntegrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface ConvertKitConfig {
  apiKey: string;
  apiSecret?: string;
}

export interface ConvertKitSubscriber {
  id: number;
  first_name: string | null;
  email_address: string;
  state: string;
  created_at: string;
  fields: Record<string, any>;
}

export interface ConvertKitTag {
  id: number;
  name: string;
  created_at: string;
}

export interface ConvertKitSegment {
  id: number;
  name: string;
  created_at: string;
  subscriber_count?: number;
}

export interface ConvertKitForm {
  id: number;
  name: string;
  created_at: string;
  type: string;
  format: string;
  embed_js: string;
  embed_url: string;
  archived: boolean;
  uid: string;
}

export interface ConvertKitSequence {
  id: number;
  name: string;
  hold: boolean;
  repeat: boolean;
  created_at: string;
}

export interface ConvertKitBroadcast {
  id: number;
  subject: string;
  created_at: string;
  published_at: string | null;
  send_at: string | null;
  content: string;
  public: boolean;
  draft: boolean;
  email_address: string;
  email_name: string;
  email_layout_id: number | null;
  thumbnail_url: string | null;
  preview_text: string | null;
}

export class ConvertKitIntegrationService {
  private apiKey: string;
  private apiSecret?: string;
  private baseUrl: string = 'https://api.convertkit.com/v3';

  constructor(config: ConvertKitConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const params = method === 'GET' ? { api_key: this.apiKey, ...data } : { api_key: this.apiKey };
      
      const response = await axios({
        method,
        url,
        params,
        data: method !== 'GET' ? { ...data, api_key: this.apiKey } : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`ConvertKit API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  /**
   * Test connection to ConvertKit
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('GET', '/account');
      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error}`
      };
    }
  }

  /**
   * Get all subscribers
   */
  async getSubscribers(): Promise<{ subscribers: ConvertKitSubscriber[] }> {
    const response = await this.makeRequest('GET', '/subscribers');
    return { subscribers: response.subscribers || [] };
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<{ tags: ConvertKitTag[] }> {
    const response = await this.makeRequest('GET', '/tags');
    return { tags: response.tags || [] };
  }

  /**
   * Create a new tag (non-destructive with SharpSend prefix)
   */
  async createTag(tagName: string): Promise<ConvertKitTag> {
    const response = await this.makeRequest('POST', '/tags', {
      tag: {
        name: `SharpSend_${tagName}`
      }
    });
    return response;
  }

  /**
   * Get segments (ConvertKit uses tags as segments)
   */
  async getSegments(): Promise<{ segments: ConvertKitSegment[] }> {
    const tags = await this.getTags();
    const segments = await Promise.all(
      tags.tags.map(async (tag) => {
        const subscribers = await this.makeRequest('GET', `/tags/${tag.id}/subscribers`);
        return {
          id: tag.id,
          name: tag.name,
          created_at: tag.created_at,
          subscriber_count: subscribers.total_subscribers || 0
        };
      })
    );
    return { segments };
  }

  /**
   * Create a segment (creates a tag in ConvertKit)
   */
  async createSegment(segmentData: {
    name: string;
    subscriberEmails?: string[];
  }): Promise<ConvertKitSegment> {
    // Create the tag
    const tag = await this.createTag(segmentData.name);
    
    // Add subscribers to the tag if provided
    if (segmentData.subscriberEmails && segmentData.subscriberEmails.length > 0) {
      for (const email of segmentData.subscriberEmails) {
        await this.addSubscriberToTag(email, tag.id);
      }
    }

    return {
      id: tag.id,
      name: tag.name,
      created_at: tag.created_at,
      subscriber_count: segmentData.subscriberEmails?.length || 0
    };
  }

  /**
   * Add subscriber to a tag
   */
  async addSubscriberToTag(email: string, tagId: number): Promise<void> {
    await this.makeRequest('POST', `/tags/${tagId}/subscribe`, {
      email,
      api_key: this.apiKey
    });
  }

  /**
   * Remove subscriber from a tag
   */
  async removeSubscriberFromTag(email: string, tagId: number): Promise<void> {
    await this.makeRequest('POST', `/tags/${tagId}/unsubscribe`, {
      email,
      api_key: this.apiKey
    });
  }

  /**
   * Get forms
   */
  async getForms(): Promise<{ forms: ConvertKitForm[] }> {
    const response = await this.makeRequest('GET', '/forms');
    return { forms: response.forms || [] };
  }

  /**
   * Get sequences
   */
  async getSequences(): Promise<{ sequences: ConvertKitSequence[] }> {
    const response = await this.makeRequest('GET', '/sequences');
    return { sequences: response.courses || [] };
  }

  /**
   * Get broadcasts (campaigns)
   */
  async getBroadcasts(): Promise<{ broadcasts: ConvertKitBroadcast[] }> {
    const response = await this.makeRequest('GET', '/broadcasts');
    return { broadcasts: response.broadcasts || [] };
  }

  /**
   * Create and send a broadcast (campaign)
   */
  async sendCampaign(campaignData: {
    subject: string;
    content: string;
    fromEmail?: string;
    fromName?: string;
    previewText?: string;
    tagIds?: number[];
    excludeTagIds?: number[];
    sendImmediately?: boolean;
    sendAt?: Date;
  }): Promise<{ success: boolean; broadcastId: number; message: string }> {
    try {
      if (!this.apiSecret) {
        throw new Error('API Secret is required for sending broadcasts');
      }

      // Create the broadcast
      const broadcastPayload: any = {
        subject: campaignData.subject,
        content: campaignData.content,
        description: campaignData.previewText,
        public: false,
        published_at: campaignData.sendImmediately ? new Date().toISOString() : null,
        send_at: campaignData.sendAt ? campaignData.sendAt.toISOString() : null,
        api_secret: this.apiSecret
      };

      if (campaignData.fromEmail) {
        broadcastPayload.email_address = campaignData.fromEmail;
      }
      if (campaignData.fromName) {
        broadcastPayload.email_name = campaignData.fromName;
      }

      const broadcast = await this.makeRequest('POST', '/broadcasts', broadcastPayload);

      // Add filters for tags if specified
      if (campaignData.tagIds && campaignData.tagIds.length > 0) {
        // ConvertKit doesn't support direct tag filtering in broadcasts
        // You would need to create a segment or use their Rules API
        console.log('Tag filtering requested but requires manual setup in ConvertKit');
      }

      return {
        success: true,
        broadcastId: broadcast.broadcast.id,
        message: campaignData.sendImmediately 
          ? 'Broadcast sent successfully' 
          : `Broadcast scheduled for ${campaignData.sendAt}`
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
   * Add subscriber to a sequence
   */
  async addSubscriberToSequence(email: string, sequenceId: number): Promise<void> {
    await this.makeRequest('POST', `/sequences/${sequenceId}/subscribe`, {
      email,
      api_key: this.apiKey
    });
  }

  /**
   * Get custom fields
   */
  async getCustomFields(): Promise<{ customFields: Array<{ id: number; key: string; label: string }> }> {
    const response = await this.makeRequest('GET', '/custom_fields');
    return { customFields: response.custom_fields || [] };
  }

  /**
   * Create custom field
   */
  async createCustomField(fieldData: {
    label: string;
    key?: string;
  }): Promise<any> {
    const response = await this.makeRequest('POST', '/custom_fields', {
      label: `SharpSend ${fieldData.label}`,
      key: fieldData.key || `sharpsend_${fieldData.label.toLowerCase().replace(/\s+/g, '_')}`
    });
    return response;
  }

  /**
   * Update subscriber custom fields (for two-way sync)
   */
  async updateSubscriberFields(email: string, fields: Record<string, any>): Promise<void> {
    // First get the subscriber ID
    const subscribers = await this.makeRequest('GET', '/subscribers', { email_address: email });
    if (subscribers.subscribers && subscribers.subscribers.length > 0) {
      const subscriberId = subscribers.subscribers[0].id;
      
      await this.makeRequest('PUT', `/subscribers/${subscriberId}`, {
        fields,
        api_key: this.apiKey
      });
    }
  }

  /**
   * Sync SharpSend segments to ConvertKit
   */
  async syncSegmentsToConvertKit(publisherId: string, segments: Array<{
    name: string;
    memberEmails: string[];
    conditions?: any;
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
          eq(emailIntegrations.platform, 'convertkit')
        ));

      if (!integration) {
        throw new Error('ConvertKit integration not found');
      }

      // Create or update each segment (tag)
      for (const segment of segments) {
        try {
          // Check if tag already exists
          const existingTags = await this.getTags();
          let tag = existingTags.tags.find(t => 
            t.name === `SharpSend_${segment.name}`
          );

          if (!tag) {
            // Create new tag
            tag = await this.createTag(segment.name);
          }

          // Add members to tag
          for (const email of segment.memberEmails) {
            try {
              await this.addSubscriberToTag(email, tag.id);
            } catch (error) {
              console.error(`Failed to add ${email} to tag ${tag.name}:`, error);
            }
          }

          syncedCount++;
        } catch (error: any) {
          errors.push(`Failed to sync segment ${segment.name}: ${error.message}`);
        }
      }

      // Create custom field for tracking if not exists
      try {
        await this.createCustomField({
          label: 'Segments',
          key: 'sharpsend_segments'
        });
      } catch (error) {
        // Field might already exist
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