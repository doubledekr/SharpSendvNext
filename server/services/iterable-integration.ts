import axios, { AxiosResponse } from 'axios';

export interface IterableConfig {
  apiKey: string;
  region: 'us' | 'eu'; // USDC or EDC endpoints
}

export interface IterableUser {
  email: string;
  userId?: string;
  dataFields?: Record<string, any>;
}

export interface IterableCampaign {
  id: number;
  name: string;
  templateId: number;
  type: 'Blast' | 'Triggered';
  messageChannels: string[];
  status: 'Draft' | 'Scheduled' | 'Running' | 'Finished';
}

export interface IterableTemplate {
  templateId: number;
  name: string;
  subject: string;
  html: string;
  messageChannels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IterableDataFeed {
  url: string;
  cacheTtl: number;
  auth?: {
    type: 'bearer' | 'basic';
    token: string;
  };
}

export interface IterableMessage {
  email: string;
  campaignId?: number;
  templateId?: number;
  dataFields?: Record<string, any>;
  messageChannel?: string;
  sendAt?: string;
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

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey,
        },
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Iterable API Error: ${error.response?.status} - ${error.response?.data?.msg || error.message}`);
      }
      throw error;
    }
  }

  /**
   * User Management
   */
  async createOrUpdateUser(user: IterableUser): Promise<{ msg: string; code: string }> {
    return this.makeRequest('POST', '/users/update', {
      email: user.email,
      userId: user.userId,
      dataFields: user.dataFields,
    });
  }

  async getUser(email: string): Promise<{ user: IterableUser }> {
    return this.makeRequest('GET', `/users/${encodeURIComponent(email)}`);
  }

  async deleteUser(email: string): Promise<{ msg: string; code: string }> {
    return this.makeRequest('DELETE', `/users/${encodeURIComponent(email)}`);
  }

  /**
   * Campaign Management
   */
  async getCampaigns(): Promise<{ campaigns: IterableCampaign[] }> {
    return this.makeRequest('GET', '/campaigns');
  }

  async createCampaign(campaign: {
    name: string;
    templateId: number;
    listIds?: number[];
    segmentationTypeId?: number;
    sendAt?: string;
  }): Promise<{ campaignId: number }> {
    return this.makeRequest('POST', '/campaigns/create', campaign);
  }

  async triggerCampaign(campaignId: number, data: {
    email: string;
    dataFields?: Record<string, any>;
  }): Promise<{ msg: string }> {
    return this.makeRequest('POST', `/campaigns/trigger`, {
      campaignId,
      recipientEmail: data.email,
      dataFields: data.dataFields,
    });
  }

  /**
   * Template Management
   */
  async getTemplates(): Promise<{ templates: IterableTemplate[] }> {
    return this.makeRequest('GET', '/templates');
  }

  async getTemplate(templateId: number): Promise<IterableTemplate> {
    return this.makeRequest('GET', `/templates/${templateId}`);
  }

  async createTemplate(template: {
    name: string;
    subject: string;
    html: string;
    messageChannelIds: number[];
  }): Promise<{ templateId: number }> {
    return this.makeRequest('POST', '/templates/email/upsert', template);
  }

  /**
   * Cross-Channel Messaging
   */
  async sendTransactionalEmail(message: IterableMessage): Promise<{ msg: string }> {
    return this.makeRequest('POST', '/email/target', {
      recipientEmail: message.email,
      campaignId: message.campaignId,
      templateId: message.templateId,
      dataFields: message.dataFields,
      sendAt: message.sendAt,
    });
  }

  async sendPushNotification(data: {
    email: string;
    campaignId: number;
    dataFields?: Record<string, any>;
  }): Promise<{ msg: string }> {
    return this.makeRequest('POST', `/push/target`, data);
  }

  async sendSMS(data: {
    phoneNumber: string;
    campaignId: number;
    dataFields?: Record<string, any>;
  }): Promise<{ msg: string }> {
    return this.makeRequest('POST', `/sms/target`, data);
  }

  async sendInAppMessage(data: {
    userId: string;
    campaignId: number;
    dataFields?: Record<string, any>;
  }): Promise<{ msg: string }> {
    return this.makeRequest('POST', `/inApp/target`, data);
  }

  /**
   * Data Feeds for Real-time Personalization
   */
  async createDataFeed(dataFeed: {
    name: string;
    url: string;
    cacheTtl?: number;
    auth?: IterableDataFeed['auth'];
  }): Promise<{ dataFeedId: number }> {
    return this.makeRequest('POST', '/dataFeeds', dataFeed);
  }

  async getDataFeeds(): Promise<{ dataFeeds: IterableDataFeed[] }> {
    return this.makeRequest('GET', '/dataFeeds');
  }

  /**
   * List Management
   */
  async getLists(): Promise<{ lists: Array<{ id: number; name: string; size: number }> }> {
    return this.makeRequest('GET', '/lists');
  }

  async subscribeUser(email: string, listId: number): Promise<{ msg: string }> {
    return this.makeRequest('POST', `/lists/subscribe`, {
      listId,
      subscribers: [{ email }],
    });
  }

  async unsubscribeUser(email: string, listId: number): Promise<{ msg: string }> {
    return this.makeRequest('POST', `/lists/unsubscribe`, {
      listId,
      subscribers: [{ email }],
    });
  }

  /**
   * Event Tracking
   */
  async trackEvent(data: {
    email: string;
    eventName: string;
    dataFields?: Record<string, any>;
    userId?: string;
  }): Promise<{ msg: string }> {
    return this.makeRequest('POST', '/events/track', data);
  }

  /**
   * Analytics and Reporting
   */
  async getCampaignStats(campaignId: number): Promise<{
    stats: {
      sent: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    };
  }> {
    return this.makeRequest('GET', `/campaigns/${campaignId}/stats`);
  }

  async getEmailMetrics(campaignId: number, startDate: string, endDate: string): Promise<{
    metrics: Array<{
      date: string;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    }>;
  }> {
    return this.makeRequest('GET', `/campaigns/${campaignId}/metrics`, {
      startDateTime: startDate,
      endDateTime: endDate,
    });
  }

  /**
   * Connection Testing
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('GET', '/lists');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Message Channel Management
   */
  async getMessageChannels(): Promise<{ 
    channels: Array<{
      id: number;
      name: string;
      medium: 'Email' | 'Push' | 'SMS' | 'InApp';
      messageMedium: string;
    }> 
  }> {
    return this.makeRequest('GET', '/channels');
  }

  /**
   * CDN Asset Management
   */
  async uploadAsset(data: {
    fileName: string;
    content: Buffer;
    contentType: string;
  }): Promise<{ assetUrl: string }> {
    // Note: Iterable typically uses external CDNs, this would integrate with their asset upload system
    return this.makeRequest('POST', '/assets/upload', {
      fileName: data.fileName,
      content: data.content.toString('base64'),
      contentType: data.contentType,
    });
  }
}