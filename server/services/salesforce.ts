import axios from "axios";
import { tenantStorage } from "../storage-multitenant";

export interface SalesforceConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  securityToken: string;
  instanceUrl: string;
  apiVersion?: string;
}

export interface SalesforceContact {
  Id?: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  LeadSource?: string;
  Description?: string;
  Phone?: string;
  Title?: string;
  Company?: string;
  Industry?: string;
  Status?: string;
}

export interface SalesforceOpportunity {
  Id?: string;
  Name: string;
  AccountId?: string;
  ContactId?: string;
  Amount?: number;
  CloseDate: string;
  StageName: string;
  LeadSource?: string;
  Description?: string;
}

export interface SalesforceCampaign {
  Id?: string;
  Name: string;
  Type?: string;
  Status: string;
  StartDate?: string;
  EndDate?: string;
  Description?: string;
  BudgetedCost?: number;
  ActualCost?: number;
  ExpectedRevenue?: number;
}

class SalesforceService {
  private accessTokens: Map<string, { token: string; instanceUrl: string; expiresAt: number }> = new Map();

  /**
   * Authenticate with Salesforce and get access token
   */
  async authenticate(publisherId: string, config: SalesforceConfig): Promise<{ accessToken: string; instanceUrl: string }> {
    try {
      const response = await axios.post(`${config.instanceUrl}/services/oauth2/token`, null, {
        params: {
          grant_type: "password",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          username: config.username,
          password: config.password + config.securityToken,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const { access_token, instance_url } = response.data;
      
      // Cache the token (expires in 2 hours by default)
      this.accessTokens.set(publisherId, {
        token: access_token,
        instanceUrl: instance_url,
        expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
      });

      // Update CRM integration record
      const integration = await tenantStorage.getCrmIntegrations(publisherId);
      const salesforceIntegration = integration.find(i => i.platform === "salesforce");
      
      if (salesforceIntegration) {
        await tenantStorage.updateCrmIntegration(salesforceIntegration.id, publisherId, {
          accessToken: access_token,
          instanceUrl: instance_url,
          lastSync: new Date(),
          status: "active",
          isConnected: true,
        });
      }

      return { accessToken: access_token, instanceUrl: instance_url };
    } catch (error) {
      console.error("Salesforce authentication error:", error);
      throw new Error("Failed to authenticate with Salesforce");
    }
  }

  /**
   * Get valid access token for publisher
   */
  private async getAccessToken(publisherId: string): Promise<{ token: string; instanceUrl: string }> {
    const cached = this.accessTokens.get(publisherId);
    
    if (cached && cached.expiresAt > Date.now()) {
      return { token: cached.token, instanceUrl: cached.instanceUrl };
    }

    // Get stored credentials and re-authenticate
    const integrations = await tenantStorage.getCrmIntegrations(publisherId);
    const salesforceIntegration = integrations.find(i => i.platform === "salesforce");
    
    if (!salesforceIntegration || !salesforceIntegration.config) {
      throw new Error("Salesforce integration not configured");
    }

    return await this.authenticate(publisherId, salesforceIntegration.config as SalesforceConfig);
  }

  /**
   * Sync subscribers to Salesforce as Contacts/Leads
   */
  async syncSubscribersToSalesforce(publisherId: string): Promise<{ synced: number; errors: string[] }> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      const subscribers = await tenantStorage.getSubscribers(publisherId);
      
      let synced = 0;
      const errors: string[] = [];

      for (const subscriber of subscribers) {
        try {
          // Check if contact already exists
          const existingContact = await this.findContactByEmail(publisherId, subscriber.email);
          
          const contactData: SalesforceContact = {
            Email: subscriber.email,
            FirstName: subscriber.name.split(" ")[0] || subscriber.name,
            LastName: subscriber.name.split(" ").slice(1).join(" ") || "Subscriber",
            LeadSource: "Newsletter",
            Description: `Newsletter subscriber - Segment: ${subscriber.segment}, Engagement Score: ${subscriber.engagementScore}`,
          };

          if (existingContact) {
            // Update existing contact
            await this.updateContact(publisherId, existingContact.Id!, contactData);
          } else {
            // Create new contact
            await this.createContact(publisherId, contactData);
          }
          
          synced++;
        } catch (error) {
          errors.push(`Failed to sync ${subscriber.email}: ${error}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error("Subscriber sync error:", error);
      throw new Error("Failed to sync subscribers to Salesforce");
    }
  }

  /**
   * Create a new contact in Salesforce
   */
  async createContact(publisherId: string, contactData: SalesforceContact): Promise<string> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      const response = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact`,
        contactData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.id;
    } catch (error) {
      console.error("Create contact error:", error);
      throw new Error("Failed to create contact in Salesforce");
    }
  }

  /**
   * Update an existing contact in Salesforce
   */
  async updateContact(publisherId: string, contactId: string, contactData: Partial<SalesforceContact>): Promise<void> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      await axios.patch(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact/${contactId}`,
        contactData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Update contact error:", error);
      throw new Error("Failed to update contact in Salesforce");
    }
  }

  /**
   * Find contact by email
   */
  async findContactByEmail(publisherId: string, email: string): Promise<SalesforceContact | null> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      const response = await axios.get(
        `${instanceUrl}/services/data/v58.0/query`,
        {
          params: {
            q: `SELECT Id, Email, FirstName, LastName FROM Contact WHERE Email = '${email}' LIMIT 1`,
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const records = response.data.records;
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error("Find contact error:", error);
      return null;
    }
  }

  /**
   * Create campaign in Salesforce
   */
  async createCampaign(publisherId: string, campaignData: SalesforceCampaign): Promise<string> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      const response = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/Campaign`,
        campaignData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.id;
    } catch (error) {
      console.error("Create campaign error:", error);
      throw new Error("Failed to create campaign in Salesforce");
    }
  }

  /**
   * Sync newsletter campaign to Salesforce
   */
  async syncCampaignToSalesforce(publisherId: string, campaignId: string): Promise<string> {
    try {
      const campaign = await tenantStorage.getCampaign(campaignId, publisherId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const salesforceCampaignData: SalesforceCampaign = {
        Name: campaign.name,
        Type: "Email",
        Status: campaign.status === "sent" ? "Completed" : "In Progress",
        StartDate: campaign.createdAt?.toISOString().split("T")[0],
        EndDate: campaign.sentAt?.toISOString().split("T")[0],
        Description: `Newsletter campaign - Subject: ${campaign.subjectLine}`,
        ExpectedRevenue: parseFloat(campaign.revenue || "0"),
      };

      return await this.createCampaign(publisherId, salesforceCampaignData);
    } catch (error) {
      console.error("Campaign sync error:", error);
      throw new Error("Failed to sync campaign to Salesforce");
    }
  }

  /**
   * Create opportunity from newsletter engagement
   */
  async createOpportunityFromEngagement(
    publisherId: string,
    subscriberEmail: string,
    campaignId: string,
    engagementData: { clicked: boolean; opened: boolean; revenue?: number }
  ): Promise<string | null> {
    try {
      // Only create opportunity for high-value engagements
      if (!engagementData.clicked || !engagementData.revenue || engagementData.revenue < 10) {
        return null;
      }

      const contact = await this.findContactByEmail(publisherId, subscriberEmail);
      if (!contact) {
        return null;
      }

      const campaign = await tenantStorage.getCampaign(campaignId, publisherId);
      if (!campaign) {
        return null;
      }

      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      const opportunityData: SalesforceOpportunity = {
        Name: `Newsletter Opportunity - ${contact.FirstName} ${contact.LastName}`,
        ContactId: contact.Id,
        Amount: engagementData.revenue,
        CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
        StageName: "Prospecting",
        LeadSource: "Newsletter",
        Description: `Generated from newsletter campaign: ${campaign.name}`,
      };

      const response = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/Opportunity`,
        opportunityData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.id;
    } catch (error) {
      console.error("Create opportunity error:", error);
      return null;
    }
  }

  /**
   * Get Salesforce analytics data
   */
  async getSalesforceAnalytics(publisherId: string): Promise<{
    totalContacts: number;
    newsletterContacts: number;
    totalOpportunities: number;
    newsletterOpportunities: number;
    totalRevenue: number;
  }> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      // Get total contacts
      const contactsResponse = await axios.get(
        `${instanceUrl}/services/data/v58.0/query`,
        {
          params: {
            q: "SELECT COUNT() FROM Contact",
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      // Get newsletter-sourced contacts
      const newsletterContactsResponse = await axios.get(
        `${instanceUrl}/services/data/v58.0/query`,
        {
          params: {
            q: "SELECT COUNT() FROM Contact WHERE LeadSource = 'Newsletter'",
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      // Get opportunities
      const opportunitiesResponse = await axios.get(
        `${instanceUrl}/services/data/v58.0/query`,
        {
          params: {
            q: "SELECT COUNT(), SUM(Amount) FROM Opportunity WHERE IsWon = true",
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      // Get newsletter opportunities
      const newsletterOpportunitiesResponse = await axios.get(
        `${instanceUrl}/services/data/v58.0/query`,
        {
          params: {
            q: "SELECT COUNT(), SUM(Amount) FROM Opportunity WHERE LeadSource = 'Newsletter' AND IsWon = true",
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      return {
        totalContacts: contactsResponse.data.totalSize,
        newsletterContacts: newsletterContactsResponse.data.totalSize,
        totalOpportunities: opportunitiesResponse.data.records[0]?.expr0 || 0,
        newsletterOpportunities: newsletterOpportunitiesResponse.data.records[0]?.expr0 || 0,
        totalRevenue: newsletterOpportunitiesResponse.data.records[0]?.expr1 || 0,
      };
    } catch (error) {
      console.error("Salesforce analytics error:", error);
      throw new Error("Failed to get Salesforce analytics");
    }
  }

  /**
   * Test Salesforce connection
   */
  async testConnection(publisherId: string): Promise<boolean> {
    try {
      const { token, instanceUrl } = await this.getAccessToken(publisherId);
      
      // Simple query to test connection
      await axios.get(
        `${instanceUrl}/services/data/v58.0/query`,
        {
          params: {
            q: "SELECT COUNT() FROM Contact LIMIT 1",
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error("Salesforce connection test failed:", error);
      return false;
    }
  }
}

export const salesforceService = new SalesforceService();

