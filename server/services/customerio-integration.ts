import axios, { AxiosResponse } from 'axios';

export interface CustomerIoConfig {
  siteId: string;
  apiKey: string;
  region: 'us' | 'eu';
  trackingKey?: string; // For web SDK
}

export interface CustomerIoPerson {
  id: string;
  email?: string;
  attributes?: Record<string, any>;
  created_at?: number;
}

export interface CustomerIoEvent {
  name: string;
  data?: Record<string, any>;
  timestamp?: number;
}

export interface CustomerIoMessage {
  to: string;
  message_id?: string;
  from?: string;
  subject?: string;
  body?: string;
  message_type?: 'email' | 'push' | 'sms' | 'webhook';
  identifiers?: {
    id?: string;
    email?: string;
  };
}

export interface CustomerIoInAppMessage {
  message_id: string;
  type: 'modal' | 'banner' | 'fullscreen';
  style: Record<string, any>;
  actions: Array<{
    name: string;
    value: string;
  }>;
  content: {
    title?: string;
    body?: string;
    image_url?: string;
  };
}

export interface CustomerIoCampaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'webhook';
  state: 'draft' | 'active' | 'stopped' | 'archived';
  created: number;
  updated: number;
}

export class CustomerIoIntegrationService {
  private siteId: string;
  private apiKey: string;
  private trackingKey: string;
  private trackBaseUrl: string;
  private appBaseUrl: string;
  private cdpBaseUrl: string;

  constructor(config: CustomerIoConfig) {
    this.siteId = config.siteId;
    this.apiKey = config.apiKey;
    this.trackingKey = config.trackingKey || '';
    
    const region = config.region === 'eu' ? 'eu-west-1' : 'us-east-1';
    this.trackBaseUrl = `https://track-${region}.customer.io/api/v1`;
    this.appBaseUrl = config.region === 'eu' 
      ? 'https://api-eu.customer.io/v1/send' 
      : 'https://api.customer.io/v1/send';
    this.cdpBaseUrl = config.region === 'eu'
      ? 'https://cdp-eu.customer.io/v1'
      : 'https://cdp.customer.io/v1';
  }

  private getAuthHeader(apiType: 'track' | 'app' | 'cdp'): Record<string, string> {
    switch (apiType) {
      case 'track':
        return {
          'Authorization': `Basic ${Buffer.from(`${this.siteId}:${this.apiKey}`).toString('base64')}`,
        };
      case 'app':
        return {
          'Authorization': `Bearer ${this.apiKey}`,
        };
      case 'cdp':
        return {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        };
    }
  }

  private async makeRequest<T>(
    apiType: 'track' | 'app' | 'cdp',
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    let baseUrl: string;
    switch (apiType) {
      case 'track':
        baseUrl = this.trackBaseUrl;
        break;
      case 'app':
        baseUrl = this.appBaseUrl;
        break;
      case 'cdp':
        baseUrl = this.cdpBaseUrl;
        break;
    }

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(apiType),
        },
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Customer.io API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Person Management (Track API)
   */
  async identifyPerson(person: CustomerIoPerson): Promise<void> {
    await this.makeRequest('track', 'PUT', `/customers/${person.id}`, {
      email: person.email,
      created_at: person.created_at || Math.floor(Date.now() / 1000),
      ...person.attributes,
    });
  }

  async deletePerson(personId: string): Promise<void> {
    await this.makeRequest('track', 'DELETE', `/customers/${personId}`);
  }

  async addDevice(personId: string, device: {
    device_id: string;
    platform: 'ios' | 'android';
    last_used?: number;
  }): Promise<void> {
    await this.makeRequest('track', 'PUT', `/customers/${personId}/devices`, device);
  }

  /**
   * Event Tracking (Track API)
   */
  async trackEvent(personId: string, event: CustomerIoEvent): Promise<void> {
    await this.makeRequest('track', 'POST', `/customers/${personId}/events`, {
      name: event.name,
      data: event.data,
      timestamp: event.timestamp || Math.floor(Date.now() / 1000),
    });
  }

  async trackAnonymousEvent(event: CustomerIoEvent & { anonymous_id: string }): Promise<void> {
    await this.makeRequest('track', 'POST', '/events', {
      name: event.name,
      data: event.data,
      anonymous_id: event.anonymous_id,
      timestamp: event.timestamp || Math.floor(Date.now() / 1000),
    });
  }

  /**
   * Transactional Messages (App API)
   */
  async sendTransactionalEmail(message: CustomerIoMessage & {
    transactional_message_id: string;
  }): Promise<{ delivery_id: string }> {
    return this.makeRequest('app', 'POST', '/transactional', {
      transactional_message_id: message.transactional_message_id,
      to: message.to,
      identifiers: message.identifiers,
      message_data: message.body ? { body: message.body } : undefined,
      subject: message.subject,
      from: message.from,
    });
  }

  async sendTransactionalPush(message: CustomerIoMessage & {
    transactional_message_id: string;
    push_data: {
      title: string;
      body: string;
      sound?: string;
      badge?: number;
    };
  }): Promise<{ delivery_id: string }> {
    return this.makeRequest('app', 'POST', '/transactional', {
      transactional_message_id: message.transactional_message_id,
      to: message.to,
      identifiers: message.identifiers,
      message_data: message.push_data,
    });
  }

  async sendTransactionalSMS(message: CustomerIoMessage & {
    transactional_message_id: string;
    body: string;
  }): Promise<{ delivery_id: string }> {
    return this.makeRequest('app', 'POST', '/transactional', {
      transactional_message_id: message.transactional_message_id,
      to: message.to,
      identifiers: message.identifiers,
      message_data: { body: message.body },
    });
  }

  /**
   * Broadcast Campaigns (App API)
   */
  async triggerBroadcast(data: {
    campaign_id: string;
    segment_id?: string;
    data?: Record<string, any>;
  }): Promise<{ campaign_id: string; run_id: string }> {
    return this.makeRequest('app', 'POST', '/campaigns/trigger', data);
  }

  async getCampaigns(): Promise<{ campaigns: CustomerIoCampaign[] }> {
    return this.makeRequest('app', 'GET', '/campaigns');
  }

  async getCampaignMetrics(campaignId: string, start?: number, end?: number): Promise<{
    metric: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    };
  }> {
    const params = new URLSearchParams();
    if (start) params.append('start', start.toString());
    if (end) params.append('end', end.toString());
    
    return this.makeRequest('app', 'GET', `/campaigns/${campaignId}/metrics?${params}`);
  }

  /**
   * In-App Messaging
   */
  async getInAppMessages(personId: string): Promise<{ messages: CustomerIoInAppMessage[] }> {
    return this.makeRequest('app', 'GET', `/customers/${personId}/messages`);
  }

  async trackInAppEvent(personId: string, data: {
    message_id: string;
    event: 'opened' | 'clicked' | 'dismissed';
    href?: string;
  }): Promise<void> {
    await this.makeRequest('track', 'POST', `/customers/${personId}/events`, {
      name: `message_${data.event}`,
      data: {
        message_id: data.message_id,
        href: data.href,
      },
    });
  }

  /**
   * Segments and Audiences
   */
  async getSegments(): Promise<{ segments: Array<{ id: string; name: string; type: string }> }> {
    return this.makeRequest('app', 'GET', '/segments');
  }

  async addPersonToSegment(personId: string, segmentId: string): Promise<void> {
    await this.makeRequest('track', 'POST', `/customers/${personId}/segments/${segmentId}`);
  }

  async removePersonFromSegment(personId: string, segmentId: string): Promise<void> {
    await this.makeRequest('track', 'DELETE', `/customers/${personId}/segments/${segmentId}`);
  }

  /**
   * Data Management (CDP API)
   */
  async createObject(data: {
    type: string;
    action: 'identify' | 'track';
    identifiers: Record<string, any>;
    attributes?: Record<string, any>;
  }): Promise<void> {
    await this.makeRequest('cdp', 'POST', '', {
      type: data.type,
      action: data.action,
      identifiers: data.identifiers,
      attributes: data.attributes,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  /**
   * Webhooks and Exports
   */
  async getExports(): Promise<{ exports: Array<{ id: string; download_url: string; status: string }> }> {
    return this.makeRequest('app', 'GET', '/exports');
  }

  async createExport(data: {
    type: 'customers' | 'deliveries' | 'events';
    filters?: Record<string, any>;
    attributes?: string[];
  }): Promise<{ export_id: string }> {
    return this.makeRequest('app', 'POST', '/exports', data);
  }

  /**
   * Connection Testing
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('app', 'GET', '/campaigns');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Journey and Workflow Management
   */
  async getJourneys(): Promise<{ journeys: Array<{ id: string; name: string; state: string }> }> {
    return this.makeRequest('app', 'GET', '/journeys');
  }

  async addPersonToJourney(journeyId: string, personId: string, data?: Record<string, any>): Promise<void> {
    await this.makeRequest('app', 'POST', `/journeys/${journeyId}/add_people`, {
      people: [{ id: personId, data }],
    });
  }

  /**
   * Subscription Management
   */
  async updateSubscriptions(personId: string, subscriptions: Record<string, boolean>): Promise<void> {
    await this.makeRequest('track', 'PUT', `/customers/${personId}`, {
      subscription_preferences: subscriptions,
    });
  }

  async getSubscriptionPreferences(personId: string): Promise<{ 
    preferences: Record<string, boolean> 
  }> {
    return this.makeRequest('app', 'GET', `/customers/${personId}/subscription_preferences`);
  }
}