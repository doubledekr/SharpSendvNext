import axios from 'axios';
import crypto from 'crypto';
import { db } from '../db';
import { emailIntegrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface MailchimpConfig {
  apiKey: string;
  serverPrefix: string;
}

export interface MailchimpList {
  id: string;
  name: string;
  stats: {
    member_count: number;
    unsubscribe_count: number;
    open_rate: number;
    click_rate: number;
  };
}

export interface MailchimpSegment {
  id: string;
  name: string;
  member_count: number;
  type: string;
  created_at: string;
  updated_at: string;
  options?: any;
}

export interface MailchimpTemplate {
  id: string;
  type: string;
  name: string;
  drag_and_drop: boolean;
  responsive: boolean;
  category: string;
  date_created: string;
  date_edited: string;
  created_by: string;
  edited_by: string;
  active: boolean;
  thumbnail: string;
  share_url: string;
}

export interface MailchimpMember {
  id: string;
  email_address: string;
  unique_email_id: string;
  email_type: string;
  status: string;
  merge_fields: Record<string, any>;
  interests: Record<string, boolean>;
  stats: {
    avg_open_rate: number;
    avg_click_rate: number;
  };
  tags: Array<{ id: number; name: string }>;
}

export interface MailchimpCampaign {
  id: string;
  type: string;
  status: string;
  emails_sent: number;
  send_time: string;
  content_type: string;
  recipients: {
    list_id: string;
    segment_text: string;
    recipient_count: number;
  };
  settings: {
    subject_line: string;
    preview_text: string;
    title: string;
    from_name: string;
    reply_to: string;
  };
}

export class MailchimpIntegrationService {
  private apiKey: string;
  private serverPrefix: string;
  private baseUrl: string;

  constructor(config: MailchimpConfig) {
    this.apiKey = config.apiKey;
    this.serverPrefix = config.serverPrefix;
    this.baseUrl = `https://${config.serverPrefix}.api.mailchimp.com/3.0`;
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
      console.error(`Mailchimp API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message);
    }
  }

  /**
   * Test connection to Mailchimp
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest('GET', '/ping');
      return {
        success: response.health_status === 'Everything\'s Chimpy!',
        message: response.health_status || 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error}`
      };
    }
  }

  /**
   * Get all lists/audiences
   */
  async getLists(): Promise<{ lists: MailchimpList[] }> {
    const response = await this.makeRequest('GET', '/lists?count=100');
    return { lists: response.lists || [] };
  }

  /**
   * Get subscribers from a list
   */
  async getSubscribers(listId: string): Promise<{ members: MailchimpMember[] }> {
    const response = await this.makeRequest('GET', `/lists/${listId}/members?count=1000`);
    return { members: response.members || [] };
  }

  /**
   * Get segments from a list
   */
  async getSegments(listId: string): Promise<{ segments: MailchimpSegment[] }> {
    const response = await this.makeRequest('GET', `/lists/${listId}/segments?count=100`);
    return { segments: response.segments || [] };
  }

  /**
   * Create a new segment in a list (non-destructive with SharpSend prefix)
   */
  async createSegment(listId: string, segmentData: {
    name: string;
    conditions: any[];
    description?: string;
  }): Promise<MailchimpSegment> {
    const segmentPayload = {
      name: `SharpSend_${segmentData.name}`,
      options: {
        match: 'all',
        conditions: segmentData.conditions
      }
    };

    const response = await this.makeRequest('POST', `/lists/${listId}/segments`, segmentPayload);
    return response;
  }

  /**
   * Get tags from a list
   */
  async getTags(listId: string): Promise<{ tags: Array<{ id: number; name: string }> }> {
    const response = await this.makeRequest('GET', `/lists/${listId}/tag-search?count=100`);
    return { tags: response.tags || [] };
  }

  /**
   * Create or update tags for members (for two-way sync)
   */
  async syncTags(listId: string, memberEmails: string[], tags: string[]): Promise<void> {
    const batch = {
      members: memberEmails.map(email => ({
        email_address: email,
        tags: tags.map(tag => ({ name: `SharpSend_${tag}`, status: 'active' }))
      }))
    };

    await this.makeRequest('POST', `/lists/${listId}/`, batch);
  }

  /**
   * Get email templates
   */
  async getTemplates(): Promise<{ templates: MailchimpTemplate[] }> {
    const response = await this.makeRequest('GET', '/templates?count=100&type=user');
    return { templates: response.templates || [] };
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: {
    name: string;
    html: string;
    folder_id?: string;
  }): Promise<MailchimpTemplate> {
    const templatePayload = {
      name: `SharpSend_${templateData.name}`,
      html: templateData.html,
      folder_id: templateData.folder_id
    };

    const response = await this.makeRequest('POST', '/templates', templatePayload);
    return response;
  }

  /**
   * Get campaigns
   */
  async getCampaigns(): Promise<{ campaigns: MailchimpCampaign[] }> {
    const response = await this.makeRequest('GET', '/campaigns?count=100');
    return { campaigns: response.campaigns || [] };
  }

  /**
   * Create and send a campaign
   */
  async sendCampaign(campaignData: {
    listId: string;
    segmentId?: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    templateId?: string;
    htmlContent?: string;
    textContent?: string;
  }): Promise<{ success: boolean; campaignId: string; message: string }> {
    try {
      // Create campaign
      const campaignPayload = {
        type: 'regular',
        recipients: {
          list_id: campaignData.listId,
          segment_opts: campaignData.segmentId ? {
            saved_segment_id: parseInt(campaignData.segmentId)
          } : undefined
        },
        settings: {
          subject_line: campaignData.subject,
          preview_text: campaignData.subject.substring(0, 150),
          title: `SharpSend_${Date.now()}`,
          from_name: campaignData.fromName,
          reply_to: campaignData.replyTo,
          use_conversation: false,
          to_name: '*|FNAME|*',
          folder_id: '',
          authenticate: true,
          auto_footer: false,
          inline_css: true,
          auto_tweet: false,
          fb_comments: false,
          timewarp: false,
          template_id: campaignData.templateId ? parseInt(campaignData.templateId) : undefined,
          drag_and_drop: false
        }
      };

      const campaign = await this.makeRequest('POST', '/campaigns', campaignPayload);

      // Set campaign content if HTML provided
      if (campaignData.htmlContent) {
        await this.makeRequest('PUT', `/campaigns/${campaign.id}/content`, {
          html: campaignData.htmlContent,
          plain_text: campaignData.textContent || this.stripHtml(campaignData.htmlContent)
        });
      }

      // Send the campaign
      await this.makeRequest('POST', `/campaigns/${campaign.id}/actions/send`);

      return {
        success: true,
        campaignId: campaign.id,
        message: 'Campaign sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        campaignId: '',
        message: `Failed to send campaign: ${error.message}`
      };
    }
  }

  /**
   * Schedule a campaign for later
   */
  async scheduleCampaign(campaignId: string, scheduleTime: Date): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('POST', `/campaigns/${campaignId}/actions/schedule`, {
        schedule_time: scheduleTime.toISOString()
      });
      return {
        success: true,
        message: `Campaign scheduled for ${scheduleTime.toISOString()}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to schedule campaign: ${error.message}`
      };
    }
  }

  /**
   * Update member segments (two-way sync)
   */
  async updateMemberSegments(listId: string, memberEmails: string[], segmentId: string, action: 'add' | 'remove'): Promise<void> {
    const batch = memberEmails.map(email => {
      const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
      return {
        method: 'PATCH',
        path: `/lists/${listId}/members/${subscriberHash}`,
        body: JSON.stringify({
          interests: {
            [segmentId]: action === 'add'
          }
        })
      };
    });

    await this.makeRequest('POST', '/batches', {
      operations: batch
    });
  }

  /**
   * Sync SharpSend segments to Mailchimp
   */
  async syncSegmentsToMailchimp(publisherId: string, segments: Array<{
    name: string;
    conditions: any[];
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
          eq(emailIntegrations.platform, 'mailchimp')
        ));

      if (!integration || !integration.config) {
        throw new Error('Mailchimp integration not found');
      }

      const config = integration.config as any;
      const listId = config.defaultListId || config.listIds?.[0];

      if (!listId) {
        throw new Error('No Mailchimp list configured');
      }

      // Create or update each segment
      for (const segment of segments) {
        try {
          // Check if segment already exists
          const existingSegments = await this.getSegments(listId);
          const existing = existingSegments.segments.find(s => 
            s.name === `SharpSend_${segment.name}`
          );

          if (!existing) {
            // Create new segment
            await this.createSegment(listId, {
              name: segment.name,
              conditions: segment.conditions
            });
          }

          // Update member tags for tracking
          if (segment.memberEmails.length > 0) {
            await this.syncTags(listId, segment.memberEmails, [segment.name]);
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