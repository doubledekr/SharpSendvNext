import axios from 'axios';
import { db } from '../db';
import { emailIntegrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface SendGridConfig {
  apiKey: string;
}

export interface SendGridList {
  id: string;
  name: string;
  contact_count: number;
}

export interface SendGridSegment {
  id: string;
  name: string;
  contacts_count: number;
  sample_updated_at: string;
  created_at: string;
  updated_at: string;
  parent_list_ids: string[];
  query?: string;
}

export interface SendGridContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  alternate_emails?: string[];
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_province_region?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  whatsapp?: string;
  line?: string;
  facebook?: string;
  unique_name?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SendGridTemplate {
  id: string;
  name: string;
  generation: string;
  updated_at: string;
  versions: Array<{
    id: string;
    template_id: string;
    active: number;
    name: string;
    subject: string;
    updated_at: string;
    generate_plain_content: boolean;
    html_content: string;
    plain_content: string;
    editor: string;
    thumbnail_url: string;
  }>;
}

export class SendGridIntegrationService {
  private apiKey: string;
  private baseUrl: string = 'https://api.sendgrid.com/v3';

  constructor(config: SendGridConfig) {
    this.apiKey = config.apiKey;
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error: any) {
      console.error(`SendGrid API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.message || error.message);
    }
  }

  /**
   * Test connection to SendGrid
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('GET', '/scopes');
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
  async getLists(): Promise<{ lists: SendGridList[] }> {
    const response = await this.makeRequest('GET', '/marketing/lists?page_size=100');
    return { lists: response.result || [] };
  }

  /**
   * Get contacts with pagination
   */
  async getContacts(searchQuery?: string): Promise<{ contacts: SendGridContact[] }> {
    let endpoint = '/marketing/contacts?page_size=100';
    if (searchQuery) {
      endpoint = `/marketing/contacts/search`;
      const response = await this.makeRequest('POST', endpoint, { query: searchQuery });
      return { contacts: response.result || [] };
    }
    const response = await this.makeRequest('GET', endpoint);
    return { contacts: response.result || [] };
  }

  /**
   * Get segments
   */
  async getSegments(): Promise<{ segments: SendGridSegment[] }> {
    const response = await this.makeRequest('GET', '/marketing/segments/2.0');
    return { segments: response.results || [] };
  }

  /**
   * Create a new segment (non-destructive with SharpSend prefix)
   */
  async createSegment(segmentData: {
    name: string;
    query: string;
    parentListIds?: string[];
  }): Promise<SendGridSegment> {
    const segmentPayload = {
      name: `SharpSend_${segmentData.name}`,
      query_dsl: segmentData.query,
      parent_list_ids: segmentData.parentListIds || []
    };

    const response = await this.makeRequest('POST', '/marketing/segments/2.0', segmentPayload);
    return response;
  }

  /**
   * Get custom fields
   */
  async getCustomFields(): Promise<{ customFields: Array<{ id: string; name: string; field_type: string }> }> {
    const response = await this.makeRequest('GET', '/marketing/field_definitions');
    return { customFields: response.custom_fields || [] };
  }

  /**
   * Create custom field for tracking
   */
  async createCustomField(fieldData: {
    name: string;
    field_type: 'Text' | 'Number' | 'Date'
  }): Promise<any> {
    const fieldPayload = {
      name: `sharpsend_${fieldData.name.toLowerCase().replace(/\s+/g, '_')}`,
      field_type: fieldData.field_type
    };

    const response = await this.makeRequest('POST', '/marketing/field_definitions', fieldPayload);
    return response;
  }

  /**
   * Update contacts with custom fields (for two-way sync)
   */
  async updateContacts(contacts: Array<{
    email: string;
    custom_fields?: Record<string, any>;
  }>): Promise<void> {
    const payload = {
      contacts: contacts.map(contact => ({
        email: contact.email,
        custom_fields: contact.custom_fields
      }))
    };

    await this.makeRequest('PUT', '/marketing/contacts', payload);
  }

  /**
   * Get email templates
   */
  async getTemplates(): Promise<{ templates: SendGridTemplate[] }> {
    const response = await this.makeRequest('GET', '/templates?generations=dynamic&page_size=100');
    return { templates: response.templates || [] };
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: {
    name: string;
    subject: string;
    htmlContent: string;
    plainContent?: string;
  }): Promise<SendGridTemplate> {
    const templatePayload = {
      name: `SharpSend_${templateData.name}`,
      generation: 'dynamic'
    };

    // Create template
    const template = await this.makeRequest('POST', '/templates', templatePayload);

    // Create version
    const versionPayload = {
      template_id: template.id,
      active: 1,
      name: 'Version 1',
      subject: templateData.subject,
      html_content: templateData.htmlContent,
      plain_content: templateData.plainContent || this.stripHtml(templateData.htmlContent),
      generate_plain_content: !templateData.plainContent
    };

    await this.makeRequest('POST', `/templates/${template.id}/versions`, versionPayload);

    return template;
  }

  /**
   * Send email campaign
   */
  async sendCampaign(campaignData: {
    toEmails: string[];
    segmentIds?: string[];
    subject: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    templateId?: string;
    htmlContent?: string;
    textContent?: string;
    personalizations?: Array<{
      to: Array<{ email: string; name?: string }>;
      dynamic_template_data?: Record<string, any>;
      substitutions?: Record<string, string>;
    }>;
  }): Promise<{ success: boolean; messageId: string; message: string }> {
    try {
      const emailPayload: any = {
        personalizations: campaignData.personalizations || campaignData.toEmails.map(email => ({
          to: [{ email }],
          subject: campaignData.subject
        })),
        from: {
          email: campaignData.fromEmail,
          name: campaignData.fromName
        },
        reply_to: {
          email: campaignData.replyTo
        },
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
          subscription_tracking: { enable: false }
        },
        mail_settings: {
          bypass_list_management: { enable: false },
          footer: { enable: false },
          sandbox_mode: { enable: false }
        }
      };

      // Use template or direct content
      if (campaignData.templateId) {
        emailPayload.template_id = campaignData.templateId;
      } else if (campaignData.htmlContent) {
        emailPayload.content = [
          {
            type: 'text/html',
            value: campaignData.htmlContent
          }
        ];
        if (campaignData.textContent) {
          emailPayload.content.push({
            type: 'text/plain',
            value: campaignData.textContent
          });
        }
      }

      const response = await this.makeRequest('POST', '/mail/send', emailPayload);

      return {
        success: true,
        messageId: response.headers?.['x-message-id'] || 'sent',
        message: 'Campaign sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        messageId: '',
        message: `Failed to send campaign: ${error.message}`
      };
    }
  }

  /**
   * Schedule a single send campaign
   */
  async scheduleCampaign(campaignData: {
    name: string;
    sendAt: Date;
    listIds?: string[];
    segmentIds?: string[];
    fromEmail: string;
    subject: string;
    htmlContent: string;
    plainContent?: string;
    suppressionGroupId?: number;
  }): Promise<{ success: boolean; campaignId: string; message: string }> {
    try {
      const singleSendPayload = {
        name: `SharpSend_${campaignData.name}`,
        send_at: campaignData.sendAt.toISOString(),
        send_to: {
          list_ids: campaignData.listIds,
          segment_ids: campaignData.segmentIds,
          all: !campaignData.listIds && !campaignData.segmentIds
        },
        email_config: {
          subject: campaignData.subject,
          html_content: campaignData.htmlContent,
          plain_content: campaignData.plainContent || this.stripHtml(campaignData.htmlContent),
          generate_plain_content: !campaignData.plainContent,
          sender_id: await this.getOrCreateSender(campaignData.fromEmail),
          suppression_group_id: campaignData.suppressionGroupId
        }
      };

      const response = await this.makeRequest('POST', '/marketing/singlesends', singleSendPayload);

      // Schedule the single send
      await this.makeRequest('PUT', `/marketing/singlesends/${response.id}/schedule`, {
        send_at: campaignData.sendAt.toISOString()
      });

      return {
        success: true,
        campaignId: response.id,
        message: `Campaign scheduled for ${campaignData.sendAt.toISOString()}`
      };
    } catch (error: any) {
      return {
        success: false,
        campaignId: '',
        message: `Failed to schedule campaign: ${error.message}`
      };
    }
  }

  /**
   * Get or create sender identity
   */
  private async getOrCreateSender(email: string): Promise<number> {
    try {
      const senders = await this.makeRequest('GET', '/marketing/senders');
      const existing = senders.results?.find((s: any) => s.from.email === email);
      
      if (existing) {
        return existing.id;
      }

      // Create new sender (requires verification)
      const newSender = await this.makeRequest('POST', '/marketing/senders', {
        nickname: `SharpSend_${email}`,
        from: {
          email: email,
          name: 'SharpSend'
        },
        reply_to: {
          email: email
        }
      });

      return newSender.id;
    } catch (error) {
      console.error('Failed to get/create sender:', error);
      // Return default sender ID or throw
      return 1;
    }
  }

  /**
   * Sync SharpSend segments to SendGrid
   */
  async syncSegmentsToSendGrid(publisherId: string, segments: Array<{
    name: string;
    query: string;
    memberEmails: string[];
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
          eq(emailIntegrations.platform, 'sendgrid')
        ));

      if (!integration) {
        throw new Error('SendGrid integration not found');
      }

      // Create custom field for SharpSend tracking if not exists
      try {
        await this.createCustomField({
          name: 'sharpsend_segments',
          field_type: 'Text'
        });
      } catch (error) {
        // Field might already exist
      }

      // Create or update each segment
      for (const segment of segments) {
        try {
          // Create segment
          await this.createSegment({
            name: segment.name,
            query: segment.query
          });

          // Update contacts with segment information
          if (segment.memberEmails.length > 0) {
            await this.updateContacts(
              segment.memberEmails.map(email => ({
                email,
                custom_fields: {
                  sharpsend_segments: segment.name
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

  /**
   * Helper function to strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}