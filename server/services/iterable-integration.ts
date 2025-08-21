import axios from 'axios';
import { db } from '../db';
import { emailIntegrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface IterableConfig {
  apiKey: string;
  region?: 'us' | 'eu';
}

export interface IterableList {
  id: number;
  name: string;
  createdAt: string;
  listType: string;
}

export interface IterableUser {
  email: string;
  userId?: string;
  dataFields?: Record<string, any>;
  profileUpdatedAt?: string;
  signupDate?: string;
}

export interface IterableTemplate {
  templateId: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  creatorUserId: string;
  messageTypeId: number;
  campaignId?: number;
}

export interface IterableCampaign {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  templateId: number;
  messageMedium: string;
  dataFields?: Record<string, any>;
  labels: string[];
  suppressionListIds: number[];
  sendListIds: number[];
  listIds: number[];
}

export class IterableIntegrationService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: IterableConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.region === 'eu' 
      ? 'https://api.eu.iterable.com/api'
      : 'https://api.iterable.com/api';
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Iterable API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || error.message);
    }
  }

  /**
   * Test connection to Iterable
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('GET', '/lists');
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
   * Get all lists
   */
  async getLists(): Promise<{ lists: IterableList[] }> {
    const response = await this.makeRequest('GET', '/lists');
    return { lists: response.lists || [] };
  }

  /**
   * Create a new list (non-destructive with SharpSend prefix)
   */
  async createList(listData: {
    name: string;
    description?: string;
  }): Promise<IterableList> {
    const response = await this.makeRequest('POST', '/lists', {
      name: `SharpSend_${listData.name}`
    });
    return response;
  }

  /**
   * Get users with pagination
   */
  async getUsers(params?: {
    limit?: number;
    offset?: number;
    dataFields?: string[];
  }): Promise<{ users: IterableUser[] }> {
    const queryParams = new URLSearchParams({
      limit: (params?.limit || 100).toString(),
      offset: (params?.offset || 0).toString()
    });
    
    if (params?.dataFields) {
      queryParams.append('dataFields', params.dataFields.join(','));
    }

    const response = await this.makeRequest('GET', `/users?${queryParams}`);
    return { users: response.users || [] };
  }

  /**
   * Get or create user
   */
  async upsertUser(userData: {
    email: string;
    userId?: string;
    dataFields?: Record<string, any>;
    preferUserId?: boolean;
  }): Promise<{ success: boolean }> {
    const response = await this.makeRequest('POST', '/users/update', userData);
    return { success: response.code === 'Success' };
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(users: Array<{
    email: string;
    dataFields?: Record<string, any>;
  }>): Promise<{ success: boolean; successCount: number }> {
    const response = await this.makeRequest('POST', '/users/bulkUpdate', {
      users
    });
    return {
      success: response.code === 'Success',
      successCount: response.successCount || 0
    };
  }

  /**
   * Get email templates
   */
  async getTemplates(params?: {
    templateType?: 'Base' | 'Blast' | 'Triggered' | 'Workflow';
    messageMedium?: 'Email' | 'Push' | 'InApp' | 'SMS';
  }): Promise<{ templates: IterableTemplate[] }> {
    const queryParams = new URLSearchParams();
    if (params?.templateType) {
      queryParams.append('templateType', params.templateType);
    }
    if (params?.messageMedium) {
      queryParams.append('messageMedium', params.messageMedium);
    }

    const response = await this.makeRequest('GET', `/templates?${queryParams}`);
    return { templates: response.templates || [] };
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: {
    name: string;
    html: string;
    plainText?: string;
    subject?: string;
    preheaderText?: string;
    fromName?: string;
    fromEmail?: string;
    replyToEmail?: string;
    messageMedium?: string;
    dataFeed?: Record<string, any>;
  }): Promise<IterableTemplate> {
    const templatePayload = {
      ...templateData,
      name: `SharpSend_${templateData.name}`,
      messageMedium: templateData.messageMedium || 'Email'
    };

    const response = await this.makeRequest('POST', '/templates/email/upsert', templatePayload);
    return response;
  }

  /**
   * Get campaigns
   */
  async getCampaigns(): Promise<{ campaigns: IterableCampaign[] }> {
    const response = await this.makeRequest('GET', '/campaigns');
    return { campaigns: response.campaigns || [] };
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignData: {
    campaignId: number;
    recipientListIds?: number[];
    suppressionListIds?: number[];
    sendAt?: Date;
    sendMode?: 'immediate' | 'scheduled';
    respectQuietTimes?: boolean;
    dataFields?: Record<string, any>;
  }): Promise<{ success: boolean; campaignId: number; message: string }> {
    try {
      const payload: any = {
        campaignId: campaignData.campaignId,
        recipientListIds: campaignData.recipientListIds || [],
        suppressionListIds: campaignData.suppressionListIds || [],
        respectQuietTimes: campaignData.respectQuietTimes ?? true,
        dataFields: campaignData.dataFields || {}
      };

      if (campaignData.sendAt) {
        payload.sendAt = campaignData.sendAt.toISOString();
        payload.sendMode = 'scheduled';
      } else {
        payload.sendMode = 'immediate';
      }

      const response = await this.makeRequest('POST', '/campaigns/send', payload);

      return {
        success: response.code === 'Success',
        campaignId: campaignData.campaignId,
        message: response.msg || 'Campaign sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        campaignId: campaignData.campaignId,
        message: `Failed to send campaign: ${error.message}`
      };
    }
  }

  /**
   * Create a triggered send campaign
   */
  async createTriggeredCampaign(campaignData: {
    name: string;
    templateId: number;
    listIds?: number[];
    suppressionListIds?: number[];
    type?: 'triggered' | 'workflow';
  }): Promise<IterableCampaign> {
    const campaignPayload = {
      name: `SharpSend_${campaignData.name}`,
      templateId: campaignData.templateId,
      listIds: campaignData.listIds || [],
      suppressionListIds: campaignData.suppressionListIds || [],
      type: campaignData.type || 'triggered'
    };

    const response = await this.makeRequest('POST', '/campaigns/create', campaignPayload);
    return response;
  }

  /**
   * Send transactional email
   */
  async sendTransactional(emailData: {
    campaignId: number;
    recipientEmail: string;
    dataFields?: Record<string, any>;
    sendAt?: Date;
    allowRepeatMarketingSends?: boolean;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; messageId: string }> {
    try {
      const payload: any = {
        campaignId: emailData.campaignId,
        recipientEmail: emailData.recipientEmail,
        dataFields: emailData.dataFields || {},
        allowRepeatMarketingSends: emailData.allowRepeatMarketingSends ?? false,
        metadata: emailData.metadata
      };

      if (emailData.sendAt) {
        payload.sendAt = emailData.sendAt.getTime();
      }

      const response = await this.makeRequest('POST', '/email/target', payload);

      return {
        success: response.code === 'Success',
        messageId: response.messageId || ''
      };
    } catch (error: any) {
      return {
        success: false,
        messageId: ''
      };
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(eventData: {
    email?: string;
    userId?: string;
    eventName: string;
    dataFields?: Record<string, any>;
    createdAt?: Date;
  }): Promise<{ success: boolean }> {
    const payload: any = {
      eventName: eventData.eventName,
      dataFields: eventData.dataFields || {}
    };

    if (eventData.email) {
      payload.email = eventData.email;
    } else if (eventData.userId) {
      payload.userId = eventData.userId;
    }

    if (eventData.createdAt) {
      payload.createdAt = eventData.createdAt.getTime();
    }

    const response = await this.makeRequest('POST', '/events/track', payload);
    return { success: response.code === 'Success' };
  }

  /**
   * Subscribe users to a list
   */
  async subscribeToList(listId: number, subscribers: Array<{
    email: string;
    dataFields?: Record<string, any>;
    userId?: string;
  }>): Promise<{ success: boolean; successCount: number }> {
    const response = await this.makeRequest('POST', '/lists/subscribe', {
      listId,
      subscribers
    });

    return {
      success: response.code === 'Success',
      successCount: response.successCount || 0
    };
  }

  /**
   * Unsubscribe users from a list
   */
  async unsubscribeFromList(listId: number, subscribers: Array<{
    email: string;
    userId?: string;
  }>): Promise<{ success: boolean; successCount: number }> {
    const response = await this.makeRequest('POST', '/lists/unsubscribe', {
      listId,
      subscribers
    });

    return {
      success: response.code === 'Success',
      successCount: response.successCount || 0
    };
  }

  /**
   * Sync SharpSend segments to Iterable lists
   */
  async syncSegmentsToIterable(publisherId: string, segments: Array<{
    name: string;
    memberEmails: string[];
    dataFields?: Record<string, any>;
  }>): Promise<{ success: boolean; syncedLists: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // Get the integration config
      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(and(
          eq(emailIntegrations.publisherId, publisherId),
          eq(emailIntegrations.platform, 'iterable')
        ));

      if (!integration) {
        throw new Error('Iterable integration not found');
      }

      // Create or update each segment as a list
      for (const segment of segments) {
        try {
          // Create list
          const list = await this.createList({
            name: segment.name,
            description: `Created by SharpSend on ${new Date().toISOString()}`
          });

          // Subscribe members to the list
          if (segment.memberEmails.length > 0) {
            await this.subscribeToList(
              list.id,
              segment.memberEmails.map(email => ({
                email,
                dataFields: {
                  ...segment.dataFields,
                  sharpsend_segment: segment.name
                }
              }))
            );
          }

          syncedCount++;
        } catch (error: any) {
          errors.push(`Failed to sync segment ${segment.name}: ${error.message}`);
        }
      }

      return {
        success: syncedCount > 0,
        syncedLists: syncedCount,
        errors
      };
    } catch (error: any) {
      return {
        success: false,
        syncedLists: 0,
        errors: [`Sync failed: ${error.message}`]
      };
    }
  }
}