import axios from 'axios';

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  listId?: number;
}

export interface BrevoContact {
  email: string;
  attributes: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    SMS?: string;
    [key: string]: any;
  };
  listIds?: number[];
  updateEnabled?: boolean;
}

export interface BrevoEmailTemplate {
  id?: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender: {
    name: string;
    email: string;
  };
  replyTo?: string;
  toField?: string;
  tag?: string;
  isActive?: boolean;
}

export interface BrevoEmailCampaign {
  name: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  type: 'classic' | 'trigger' | 'template';
  htmlContent: string;
  textContent?: string;
  scheduledAt?: string;
  recipients: {
    listIds?: number[];
    exclusionListIds?: number[];
  };
  inlineImageActivation?: boolean;
  mirrorActive?: boolean;
  recurring?: boolean;
  abTesting?: boolean;
  subjectA?: string;
  subjectB?: string;
  splitRule?: number;
  winnerCriteria?: string;
  winnerDelay?: number;
  ipWarmupEnable?: boolean;
  initialQuota?: number;
  increaseRate?: number;
}

export interface BrevoSendTransactionalEmail {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  cc?: Array<{
    email: string;
    name?: string;
  }>;
  bcc?: Array<{
    email: string;
    name?: string;
  }>;
  replyTo?: {
    email: string;
    name?: string;
  };
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: { [key: string]: any };
  messageVersions?: Array<{
    to: Array<{
      email: string;
      name?: string;
    }>;
    params?: { [key: string]: any };
    subject?: string;
    htmlContent?: string;
    textContent?: string;
  }>;
  headers?: { [key: string]: string };
  templateId?: number;
  attachment?: Array<{
    url?: string;
    content?: string;
    name: string;
  }>;
  tags?: string[];
  scheduledAt?: string;
  batchId?: string;
}

export interface BrevoEmailStats {
  campaignId: number;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  hardBounces: number;
  softBounces: number;
  complaints: number;
  unsubscriptions: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscriptionRate: number;
}

export class BrevoService {
  private apiKey: string;
  private baseUrl: string = 'https://api.brevo.com/v3';
  private senderEmail: string;
  private senderName: string;
  private defaultListId?: number;

  constructor(config: BrevoConfig) {
    this.apiKey = config.apiKey;
    this.senderEmail = config.senderEmail;
    this.senderName = config.senderName;
    this.defaultListId = config.listId;
  }

  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': this.apiKey
    };
  }

  /**
   * Test API connection and get account information
   */
  async testConnection(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        account: response.data,
        message: 'Brevo connection successful'
      };
    } catch (error: any) {
      console.error('Brevo connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create or update a contact in Brevo
   */
  async createOrUpdateContact(contact: BrevoContact): Promise<any> {
    try {
      const contactData = {
        email: contact.email,
        attributes: contact.attributes,
        listIds: contact.listIds || (this.defaultListId ? [this.defaultListId] : []),
        updateEnabled: contact.updateEnabled !== false
      };

      const response = await axios.post(`${this.baseUrl}/contacts`, contactData, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        contactId: response.data.id,
        message: 'Contact created/updated successfully'
      };
    } catch (error: any) {
      // If contact already exists, try to update
      if (error.response?.status === 400 && error.response?.data?.code === 'duplicate_parameter') {
        try {
          const updateResponse = await axios.put(`${this.baseUrl}/contacts/${contact.email}`, {
            attributes: contact.attributes,
            listIds: contact.listIds || (this.defaultListId ? [this.defaultListId] : [])
          }, {
            headers: this.getHeaders()
          });

          return {
            success: true,
            message: 'Contact updated successfully'
          };
        } catch (updateError: any) {
          console.error('Brevo contact update failed:', updateError.response?.data || updateError.message);
          return {
            success: false,
            error: updateError.response?.data?.message || updateError.message
          };
        }
      }

      console.error('Brevo contact creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send a transactional email
   */
  async sendTransactionalEmail(emailData: BrevoSendTransactionalEmail): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/smtp/email`, emailData, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        messageId: response.data.messageId,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      console.error('Brevo email send failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send personalized emails to multiple recipients
   */
  async sendPersonalizedEmails(
    subject: string,
    htmlContent: string,
    textContent: string,
    recipients: Array<{
      email: string;
      name?: string;
      personalizedSubject?: string;
      personalizedContent?: string;
      params?: { [key: string]: any };
    }>
  ): Promise<any> {
    try {
      const results = [];

      // Send emails in batches to avoid rate limits
      const batchSize = 50;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (recipient) => {
          const emailData: BrevoSendTransactionalEmail = {
            sender: {
              name: this.senderName,
              email: this.senderEmail
            },
            to: [{
              email: recipient.email,
              name: recipient.name || recipient.email
            }],
            subject: recipient.personalizedSubject || subject,
            htmlContent: recipient.personalizedContent || htmlContent,
            textContent: textContent,
            params: recipient.params || {},
            tags: ['personalized', 'sharpsend']
          };

          return this.sendTransactionalEmail(emailData);
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: true,
        totalSent: recipients.length,
        successful,
        failed,
        results
      };
    } catch (error: any) {
      console.error('Brevo batch email send failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create an email campaign
   */
  async createEmailCampaign(campaign: BrevoEmailCampaign): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/emailCampaigns`, campaign, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        campaignId: response.data.id,
        message: 'Campaign created successfully'
      };
    } catch (error: any) {
      console.error('Brevo campaign creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send an email campaign immediately
   */
  async sendCampaignNow(campaignId: number): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/emailCampaigns/${campaignId}/sendNow`, {}, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        message: 'Campaign sent successfully'
      };
    } catch (error: any) {
      console.error('Brevo campaign send failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Schedule an email campaign
   */
  async scheduleCampaign(campaignId: number, scheduledAt: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/emailCampaigns/${campaignId}/sendLater`, {
        scheduledAt
      }, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        message: 'Campaign scheduled successfully'
      };
    } catch (error: any) {
      console.error('Brevo campaign scheduling failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: number): Promise<BrevoEmailStats | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/emailCampaigns/${campaignId}`, {
        headers: this.getHeaders()
      });

      const campaign = response.data;
      const stats = campaign.statistics || {};

      return {
        campaignId,
        sent: stats.sent || 0,
        delivered: stats.delivered || 0,
        opens: stats.uniqueOpens || 0,
        clicks: stats.uniqueClicks || 0,
        bounces: stats.hardBounces + stats.softBounces || 0,
        hardBounces: stats.hardBounces || 0,
        softBounces: stats.softBounces || 0,
        complaints: stats.complaints || 0,
        unsubscriptions: stats.unsubscriptions || 0,
        openRate: stats.openRate || 0,
        clickRate: stats.clickRate || 0,
        bounceRate: stats.bounceRate || 0,
        unsubscriptionRate: stats.unsubscriptionRate || 0
      };
    } catch (error: any) {
      console.error('Brevo campaign stats failed:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get all email campaigns
   */
  async getCampaigns(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/emailCampaigns`, {
        headers: this.getHeaders(),
        params: { limit, offset }
      });

      return {
        success: true,
        campaigns: response.data.campaigns,
        count: response.data.count
      };
    } catch (error: any) {
      console.error('Brevo get campaigns failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create a contact list
   */
  async createContactList(name: string, folderId?: number): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/contacts/lists`, {
        name,
        folderId
      }, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        listId: response.data.id,
        message: 'Contact list created successfully'
      };
    } catch (error: any) {
      console.error('Brevo list creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get contact lists
   */
  async getContactLists(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/contacts/lists`, {
        headers: this.getHeaders(),
        params: { limit, offset }
      });

      return {
        success: true,
        lists: response.data.lists,
        count: response.data.count
      };
    } catch (error: any) {
      console.error('Brevo get lists failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Add contacts to a list
   */
  async addContactsToList(listId: number, emails: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/contacts/lists/${listId}/contacts/add`, {
        emails
      }, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        message: 'Contacts added to list successfully'
      };
    } catch (error: any) {
      console.error('Brevo add contacts to list failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Remove contacts from a list
   */
  async removeContactsFromList(listId: number, emails: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/contacts/lists/${listId}/contacts/remove`, {
        emails
      }, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        message: 'Contacts removed from list successfully'
      };
    } catch (error: any) {
      console.error('Brevo remove contacts from list failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get webhook events for tracking
   */
  async getWebhookEvents(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/webhooks`, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        webhooks: response.data.webhooks
      };
    } catch (error: any) {
      console.error('Brevo get webhooks failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create a webhook for email events
   */
  async createWebhook(url: string, events: string[], description?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/webhooks`, {
        url,
        events,
        description: description || 'SharpSend email tracking webhook',
        type: 'transactional'
      }, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        webhookId: response.data.id,
        message: 'Webhook created successfully'
      };
    } catch (error: any) {
      console.error('Brevo webhook creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get email templates
   */
  async getEmailTemplates(templateStatus?: 'true' | 'false', limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const params: any = { limit, offset };
      if (templateStatus) {
        params.templateStatus = templateStatus;
      }

      const response = await axios.get(`${this.baseUrl}/smtp/templates`, {
        headers: this.getHeaders(),
        params
      });

      return {
        success: true,
        templates: response.data.templates,
        count: response.data.count
      };
    } catch (error: any) {
      console.error('Brevo get templates failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create an email template
   */
  async createEmailTemplate(template: BrevoEmailTemplate): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/smtp/templates`, template, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        templateId: response.data.id,
        message: 'Template created successfully'
      };
    } catch (error: any) {
      console.error('Brevo template creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// Factory function to create Brevo service instance
export function createBrevoService(config: BrevoConfig): BrevoService {
  return new BrevoService(config);
}

