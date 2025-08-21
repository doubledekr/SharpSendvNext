import axios from 'axios';
import { db } from '../db';
import { emailIntegrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface KeapConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken?: string;
}

export interface KeapContact {
  id: number;
  email_addresses: Array<{
    email: string;
    field: string;
  }>;
  given_name?: string;
  family_name?: string;
  opt_in_reason?: string;
  tag_ids?: number[];
  custom_fields?: Array<{
    id: number;
    content: any;
  }>;
}

export interface KeapTag {
  id: number;
  name: string;
  description?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface KeapCampaign {
  id: number;
  name: string;
  goals?: Array<{
    id: number;
    name: string;
    type: string;
  }>;
  sequences?: Array<{
    id: number;
    name: string;
  }>;
}

export interface KeapEmail {
  id: number;
  sent_date: string;
  sent_from_address: string;
  sent_to_address: string;
  subject: string;
  html_content?: string;
  plain_content?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    file_name: string;
    file_data: string;
  }>;
}

export class KeapIntegrationService {
  private accessToken: string;
  private refreshToken?: string;
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string = 'https://api.infusionsoft.com/crm/rest/v1';
  private tokenUrl: string = 'https://api.infusionsoft.com/token';

  constructor(config: KeapConfig) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(this.tokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      this.accessToken = response.data.access_token;
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
      }

      // TODO: Update stored tokens in database

      return this.accessToken;
    } catch (error: any) {
      console.error('Failed to refresh Keap token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  private async makeRequest(method: string, endpoint: string, data?: any, retry = true): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error: any) {
      // If unauthorized and we have a refresh token, try refreshing
      if (error.response?.status === 401 && this.refreshToken && retry) {
        await this.refreshAccessToken();
        return this.makeRequest(method, endpoint, data, false);
      }
      
      console.error(`Keap API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  /**
   * Test connection to Keap
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('GET', '/account/profile');
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
   * Get contacts with pagination
   */
  async getContacts(params?: {
    limit?: number;
    offset?: number;
    email?: string;
    order?: string;
    orderDirection?: 'ascending' | 'descending';
  }): Promise<{ contacts: KeapContact[]; count: number }> {
    const queryParams = new URLSearchParams({
      limit: (params?.limit || 100).toString(),
      offset: (params?.offset || 0).toString()
    });

    if (params?.email) {
      queryParams.append('email', params.email);
    }
    if (params?.order) {
      queryParams.append('order', params.order);
    }
    if (params?.orderDirection) {
      queryParams.append('order_direction', params.orderDirection);
    }

    const response = await this.makeRequest('GET', `/contacts?${queryParams}`);
    return { 
      contacts: response.contacts || [],
      count: response.count || 0
    };
  }

  /**
   * Create or update a contact
   */
  async upsertContact(contactData: {
    email: string;
    given_name?: string;
    family_name?: string;
    opt_in_reason?: string;
    tag_ids?: number[];
    custom_fields?: Array<{
      id: number;
      content: any;
    }>;
  }): Promise<KeapContact> {
    // Check if contact exists
    const existing = await this.getContacts({ email: contactData.email });
    
    const payload = {
      email_addresses: [{
        email: contactData.email,
        field: 'EMAIL1'
      }],
      given_name: contactData.given_name,
      family_name: contactData.family_name,
      opt_in_reason: contactData.opt_in_reason || 'SharpSend Import',
      tag_ids: contactData.tag_ids,
      custom_fields: contactData.custom_fields
    };

    if (existing.contacts.length > 0) {
      // Update existing contact
      const contactId = existing.contacts[0].id;
      const response = await this.makeRequest('PATCH', `/contacts/${contactId}`, payload);
      return response;
    } else {
      // Create new contact
      const response = await this.makeRequest('POST', '/contacts', payload);
      return response;
    }
  }

  /**
   * Get all tags
   */
  async getTags(params?: {
    limit?: number;
    offset?: number;
    category?: number;
  }): Promise<{ tags: KeapTag[]; count: number }> {
    const queryParams = new URLSearchParams({
      limit: (params?.limit || 100).toString(),
      offset: (params?.offset || 0).toString()
    });

    if (params?.category) {
      queryParams.append('category', params.category.toString());
    }

    const response = await this.makeRequest('GET', `/tags?${queryParams}`);
    return {
      tags: response.tags || [],
      count: response.count || 0
    };
  }

  /**
   * Create a tag (non-destructive with SharpSend prefix)
   */
  async createTag(tagData: {
    name: string;
    description?: string;
    category?: string;
  }): Promise<KeapTag> {
    const tagPayload = {
      name: `SharpSend_${tagData.name}`,
      description: tagData.description || `Created by SharpSend on ${new Date().toISOString()}`
    };

    const response = await this.makeRequest('POST', '/tags', tagPayload);
    return response;
  }

  /**
   * Apply tag to contacts
   */
  async applyTagToContacts(tagId: number, contactIds: number[]): Promise<{ success: boolean }> {
    try {
      const payload = {
        ids: contactIds
      };

      await this.makeRequest('POST', `/tags/${tagId}/contacts`, payload);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Remove tag from contacts
   */
  async removeTagFromContacts(tagId: number, contactIds: number[]): Promise<{ success: boolean }> {
    try {
      await this.makeRequest('DELETE', `/tags/${tagId}/contacts`, { ids: contactIds });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get campaigns
   */
  async getCampaigns(params?: {
    limit?: number;
    offset?: number;
    searchText?: string;
  }): Promise<{ campaigns: KeapCampaign[]; count: number }> {
    const queryParams = new URLSearchParams({
      limit: (params?.limit || 100).toString(),
      offset: (params?.offset || 0).toString()
    });

    if (params?.searchText) {
      queryParams.append('search_text', params.searchText);
    }

    const response = await this.makeRequest('GET', `/campaigns?${queryParams}`);
    return {
      campaigns: response.campaigns || [],
      count: response.count || 0
    };
  }

  /**
   * Send an email
   */
  async sendEmail(emailData: {
    contactIds: number[];
    subject: string;
    htmlContent?: string;
    plainContent?: string;
    fromEmail?: string;
    attachments?: Array<{
      file_name: string;
      file_data: string;
    }>;
  }): Promise<{ success: boolean; emailIds: number[]; message: string }> {
    try {
      const emailIds: number[] = [];

      // Keap requires sending individual emails to each contact
      for (const contactId of emailData.contactIds) {
        const emailPayload = {
          contacts: [contactId],
          subject: emailData.subject,
          html_content: emailData.htmlContent,
          plain_content: emailData.plainContent || this.stripHtml(emailData.htmlContent || ''),
          attachments: emailData.attachments
        };

        const response = await this.makeRequest('POST', '/emails', emailPayload);
        if (response.id) {
          emailIds.push(response.id);
        }
      }

      return {
        success: emailIds.length > 0,
        emailIds,
        message: `Sent ${emailIds.length} emails successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        emailIds: [],
        message: `Failed to send emails: ${error.message}`
      };
    }
  }

  /**
   * Add contact to campaign
   */
  async addContactToCampaign(campaignId: number, contactId: number): Promise<{ success: boolean }> {
    try {
      await this.makeRequest('POST', `/campaigns/${campaignId}/contacts`, {
        ids: [contactId]
      });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Remove contact from campaign
   */
  async removeContactFromCampaign(campaignId: number, contactId: number): Promise<{ success: boolean }> {
    try {
      await this.makeRequest('DELETE', `/campaigns/${campaignId}/contacts/${contactId}`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Create a custom field
   */
  async createCustomField(fieldData: {
    label: string;
    type: 'Text' | 'WholeNumber' | 'Date' | 'Currency' | 'YesNo' | 'Dropdown' | 'TextArea';
    options?: Array<{ label: string; value: string }>;
  }): Promise<{ id: number; label: string }> {
    const fieldPayload = {
      label: `SharpSend ${fieldData.label}`,
      type: fieldData.type,
      options: fieldData.options
    };

    const response = await this.makeRequest('POST', '/contacts/model/customFields', fieldPayload);
    return response;
  }

  /**
   * Sync SharpSend segments to Keap tags
   */
  async syncSegmentsToKeap(publisherId: string, segments: Array<{
    name: string;
    memberEmails: string[];
    description?: string;
  }>): Promise<{ success: boolean; syncedTags: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // Get the integration config
      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(and(
          eq(emailIntegrations.publisherId, publisherId),
          eq(emailIntegrations.platform, 'keap')
        ));

      if (!integration) {
        throw new Error('Keap integration not found');
      }

      // Create or update each segment as a tag
      for (const segment of segments) {
        try {
          // Create tag
          const tag = await this.createTag({
            name: segment.name,
            description: segment.description || `SharpSend segment: ${segment.name}`,
            category: 'SharpSend'
          });

          // Apply tag to contacts
          if (segment.memberEmails.length > 0) {
            const contactIds: number[] = [];
            
            // Create or update contacts and collect IDs
            for (const email of segment.memberEmails) {
              const contact = await this.upsertContact({
                email,
                opt_in_reason: 'SharpSend Segment Sync',
                tag_ids: [tag.id]
              });
              contactIds.push(contact.id);
            }

            // Apply tag to all contacts
            if (contactIds.length > 0) {
              await this.applyTagToContacts(tag.id, contactIds);
            }
          }

          syncedCount++;
        } catch (error: any) {
          errors.push(`Failed to sync segment ${segment.name}: ${error.message}`);
        }
      }

      return {
        success: syncedCount > 0,
        syncedTags: syncedCount,
        errors
      };
    } catch (error: any) {
      return {
        success: false,
        syncedTags: 0,
        errors: [`Sync failed: ${error.message}`]
      };
    }
  }

  /**
   * Helper function to strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}