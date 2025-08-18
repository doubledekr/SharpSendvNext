import axios, { AxiosResponse } from 'axios';

export interface KeapConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  redirectUri?: string;
}

export interface KeapContact {
  id?: number;
  email_addresses?: Array<{
    email: string;
    field: 'EMAIL1' | 'EMAIL2' | 'EMAIL3';
  }>;
  given_name?: string;
  family_name?: string;
  phone_numbers?: Array<{
    number: string;
    field: 'PHONE1' | 'PHONE2' | 'PHONE3';
    type?: 'Work' | 'Home' | 'Mobile';
  }>;
  addresses?: Array<{
    line1?: string;
    line2?: string;
    locality?: string;
    region?: string;
    zip_code?: string;
    country_code?: string;
    field: 'BILLING' | 'SHIPPING' | 'OTHER';
  }>;
  company?: {
    company_name?: string;
  };
  custom_fields?: Array<{
    id: number;
    value: any;
  }>;
  tag_ids?: number[];
  lead_source_id?: number;
  source_type?: 'WEBFORM' | 'LANDINGPAGE' | 'IMPORT' | 'API' | 'MANUAL';
}

export interface KeapCampaign {
  id: number;
  name: string;
  created_by: number;
  date_created: string;
  time_zone: string;
  error_message?: string;
  goals: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  sequences: Array<{
    id: number;
    name: string;
    path: string;
  }>;
}

export interface KeapOpportunity {
  id?: number;
  contact: {
    id: number;
  };
  stage: {
    id: number;
    name?: string;
  };
  user?: {
    id: number;
  };
  opportunity_title: string;
  opportunity_notes?: string;
  projected_close_date?: string;
  estimated_close_date?: string;
  actual_close_date?: string;
  opportunity_value?: number;
  next_action_date?: string;
  next_action_notes?: string;
  include_in_forecast?: number;
  custom_fields?: Array<{
    id: number;
    value: any;
  }>;
}

export interface KeapProduct {
  id?: number;
  product_name: string;
  product_price?: number;
  product_desc?: string;
  sku?: string;
  status?: number;
  subscription_only?: boolean;
  cycle_type?: 'MONTH' | 'YEAR' | 'WEEK' | 'DAY';
  subscription_cycle?: number;
  subscription_frequency?: number;
  shipping_flat_rate?: number;
  shipping_percent?: number;
  weight?: number;
  need_shipping_address?: boolean;
  taxable?: boolean;
  hide_in_store?: boolean;
}

export interface KeapOrder {
  id?: number;
  contact_id: number;
  order_date: string;
  order_title: string;
  order_items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    description?: string;
  }>;
  lead_affiliate_id?: number;
  sales_affiliate_id?: number;
  shipping_address?: {
    line1?: string;
    line2?: string;
    locality?: string;
    region?: string;
    zip_code?: string;
    country_code?: string;
  };
  order_type?: 'Online' | 'Offline';
  order_status?: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
  promo_codes?: string[];
}

export interface KeapEmail {
  id?: number;
  subject: string;
  html_content?: string;
  text_content?: string;
  from_address?: string;
  to_addresses: string[];
  cc_addresses?: string[];
  bcc_addresses?: string[];
  attachments?: Array<{
    file_name: string;
    file_data: string; // Base64 encoded
  }>;
  sent_from_user_id?: number;
  sent_to_contact_ids?: number[];
}

export interface KeapTag {
  id?: number;
  name: string;
  description?: string;
  category?: {
    id: number;
    name: string;
  };
}

export class KeapIntegrationService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private refreshToken: string;
  private baseUrl: string = 'https://api.infusionsoft.com/crm/rest/v1';

  constructor(config: KeapConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken || '';
    this.refreshToken = config.refreshToken || '';
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<T> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response: AxiosResponse<T> = await axios({
        method,
        url: url.toString(),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Try to refresh token
          await this.refreshAccessToken();
          // Retry the request
          return this.makeRequest(method, endpoint, data, params);
        }
        throw new Error(`Keap API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * OAuth 2.0 Authentication
   */
  async exchangeCodeForTokens(authCode: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await axios.post('https://api.infusionsoft.com/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;
    return response.data;
  }

  async refreshAccessToken(): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await axios.post('https://api.infusionsoft.com/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;
    return response.data;
  }

  /**
   * Contact Management
   */
  async getContacts(params?: {
    limit?: number;
    offset?: number;
    email?: string;
    given_name?: string;
    family_name?: string;
  }): Promise<{ contacts: KeapContact[]; count: number }> {
    return this.makeRequest('GET', '/contacts', undefined, params as Record<string, string>);
  }

  async getContact(contactId: number): Promise<KeapContact> {
    return this.makeRequest('GET', `/contacts/${contactId}`);
  }

  async createContact(contact: KeapContact): Promise<KeapContact> {
    return this.makeRequest('POST', '/contacts', contact);
  }

  async updateContact(contactId: number, contact: Partial<KeapContact>): Promise<KeapContact> {
    return this.makeRequest('PATCH', `/contacts/${contactId}`, contact);
  }

  async deleteContact(contactId: number): Promise<void> {
    await this.makeRequest('DELETE', `/contacts/${contactId}`);
  }

  /**
   * Campaign Management
   */
  async getCampaigns(): Promise<{ campaigns: KeapCampaign[] }> {
    return this.makeRequest('GET', '/campaigns');
  }

  async getCampaign(campaignId: number): Promise<KeapCampaign> {
    return this.makeRequest('GET', `/campaigns/${campaignId}`);
  }

  async addContactToCampaign(contactId: number, campaignId: number): Promise<void> {
    await this.makeRequest('POST', `/contacts/${contactId}/campaigns/${campaignId}`);
  }

  async removeContactFromCampaign(contactId: number, campaignId: number): Promise<void> {
    await this.makeRequest('DELETE', `/contacts/${contactId}/campaigns/${campaignId}`);
  }

  /**
   * Opportunity Management (Sales Pipeline)
   */
  async getOpportunities(params?: {
    limit?: number;
    offset?: number;
    contact_id?: number;
    stage_id?: number;
  }): Promise<{ opportunities: KeapOpportunity[]; count: number }> {
    return this.makeRequest('GET', '/opportunities', undefined, params as Record<string, string>);
  }

  async getOpportunity(opportunityId: number): Promise<KeapOpportunity> {
    return this.makeRequest('GET', `/opportunities/${opportunityId}`);
  }

  async createOpportunity(opportunity: KeapOpportunity): Promise<KeapOpportunity> {
    return this.makeRequest('POST', '/opportunities', opportunity);
  }

  async updateOpportunity(opportunityId: number, opportunity: Partial<KeapOpportunity>): Promise<KeapOpportunity> {
    return this.makeRequest('PATCH', `/opportunities/${opportunityId}`, opportunity);
  }

  /**
   * Product Management
   */
  async getProducts(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ products: KeapProduct[]; count: number }> {
    return this.makeRequest('GET', '/products', undefined, params as Record<string, string>);
  }

  async getProduct(productId: number): Promise<KeapProduct> {
    return this.makeRequest('GET', `/products/${productId}`);
  }

  async createProduct(product: KeapProduct): Promise<KeapProduct> {
    return this.makeRequest('POST', '/products', product);
  }

  async updateProduct(productId: number, product: Partial<KeapProduct>): Promise<KeapProduct> {
    return this.makeRequest('PATCH', `/products/${productId}`, product);
  }

  /**
   * Order Management (E-commerce)
   */
  async getOrders(params?: {
    limit?: number;
    offset?: number;
    contact_id?: number;
  }): Promise<{ orders: KeapOrder[]; count: number }> {
    return this.makeRequest('GET', '/orders', undefined, params as Record<string, string>);
  }

  async getOrder(orderId: number): Promise<KeapOrder> {
    return this.makeRequest('GET', `/orders/${orderId}`);
  }

  async createOrder(order: KeapOrder): Promise<KeapOrder> {
    return this.makeRequest('POST', '/orders', order);
  }

  /**
   * Email Management
   */
  async sendEmail(email: KeapEmail): Promise<{ sent_emails: Array<{ id: number }> }> {
    return this.makeRequest('POST', '/emails', email);
  }

  async getSentEmails(params?: {
    limit?: number;
    offset?: number;
    contact_id?: number;
  }): Promise<{ emails: KeapEmail[]; count: number }> {
    return this.makeRequest('GET', '/emails', undefined, params as Record<string, string>);
  }

  /**
   * Tag Management
   */
  async getTags(): Promise<{ tags: KeapTag[] }> {
    return this.makeRequest('GET', '/tags');
  }

  async createTag(tag: { name: string; description?: string }): Promise<KeapTag> {
    return this.makeRequest('POST', '/tags', tag);
  }

  async applyTagToContact(contactId: number, tagId: number): Promise<void> {
    await this.makeRequest('POST', `/contacts/${contactId}/tags`, { tagIds: [tagId] });
  }

  async removeTagFromContact(contactId: number, tagId: number): Promise<void> {
    await this.makeRequest('DELETE', `/contacts/${contactId}/tags/${tagId}`);
  }

  /**
   * Custom Fields
   */
  async getCustomFields(): Promise<{ 
    custom_fields: Array<{
      id: number;
      label: string;
      options?: Array<{ id: number; label: string }>;
    }> 
  }> {
    return this.makeRequest('GET', '/setting/contact/optionTypes');
  }

  /**
   * File Management
   */
  async uploadFile(data: {
    file_name: string;
    file_data: string; // Base64 encoded
    contact_id?: number;
  }): Promise<{ file_id: number; file_name: string }> {
    return this.makeRequest('POST', '/files', data);
  }

  async getFiles(contactId?: number): Promise<{ 
    files: Array<{
      id: number;
      name: string;
      size: number;
      upload_date: string;
    }> 
  }> {
    const params = contactId ? { contact_id: contactId.toString() } : undefined;
    return this.makeRequest('GET', '/files', undefined, params);
  }

  /**
   * Reports and Analytics
   */
  async getAppConfiguration(): Promise<{ 
    currency_code: string;
    time_zone: string;
    language_tag: string;
  }> {
    return this.makeRequest('GET', '/setting/application/configuration');
  }

  /**
   * Webhooks
   */
  async createWebhook(data: {
    hookUrl: string;
    eventKey: string;
    description?: string;
  }): Promise<{ id: number; hook_url: string; status: string }> {
    return this.makeRequest('POST', '/hooks', data);
  }

  async getWebhooks(): Promise<{ 
    hooks: Array<{
      id: number;
      hook_url: string;
      event_key: string;
      status: string;
    }> 
  }> {
    return this.makeRequest('GET', '/hooks');
  }

  async deleteWebhook(hookId: number): Promise<void> {
    await this.makeRequest('DELETE', `/hooks/${hookId}`);
  }

  /**
   * Connection Testing
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('GET', '/setting/application/configuration');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Lead Scoring and Automation
   */
  async getLeadSources(): Promise<{ 
    lead_sources: Array<{
      id: number;
      name: string;
      description?: string;
    }> 
  }> {
    return this.makeRequest('GET', '/setting/contact/leadSources');
  }

  async getCompanies(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ 
    companies: Array<{
      id: number;
      company_name: string;
      address?: any;
      phone?: any;
    }>;
    count: number;
  }> {
    return this.makeRequest('GET', '/companies', undefined, params as Record<string, string>);
  }
}