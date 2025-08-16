import axios from "axios";
import { tenantStorage } from "../storage-multitenant";

export interface ExactTargetConfig {
  clientId: string;
  clientSecret: string;
  subdomain: string; // e.g., "mc123456789"
  stack: string; // e.g., "s7" for stack 7
  apiVersion?: string;
}

export interface ExactTargetSubscriber {
  EmailAddress: string;
  SubscriberKey?: string;
  Attributes?: Array<{
    Name: string;
    Value: string;
  }>;
  Lists?: Array<{
    ID: number;
    Status: "Active" | "Unsubscribed";
  }>;
}

export interface ExactTargetEmail {
  Name: string;
  Subject: string;
  HTMLBody: string;
  TextBody?: string;
  FromName: string;
  FromEmail: string;
  ReplyToEmail?: string;
}

export interface ExactTargetSend {
  EmailID: number;
  ListID?: number;
  DataExtensionKey?: string;
  SendDate?: string;
  SuppressTracking?: boolean;
}

export interface ExactTargetDataExtension {
  Name: string;
  CustomerKey: string;
  Description?: string;
  Fields: Array<{
    Name: string;
    FieldType: "Text" | "Number" | "Date" | "Boolean" | "EmailAddress" | "Phone";
    MaxLength?: number;
    IsRequired?: boolean;
    IsPrimaryKey?: boolean;
  }>;
}

class ExactTargetService {
  private accessTokens: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Authenticate with ExactTarget/Marketing Cloud
   */
  async authenticate(publisherId: string, config: ExactTargetConfig): Promise<string> {
    try {
      const authUrl = `https://${config.subdomain}.auth.marketingcloudapis.com/v2/token`;
      
      const response = await axios.post(authUrl, {
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { access_token, expires_in } = response.data;
      
      // Cache the token
      this.accessTokens.set(publisherId, {
        token: access_token,
        expiresAt: Date.now() + (expires_in * 1000) - 60000, // Subtract 1 minute for safety
      });

      // Update email integration record
      const integrations = await tenantStorage.getEmailIntegrations(publisherId);
      const exactTargetIntegration = integrations.find(i => i.platform === "exacttarget");
      
      if (exactTargetIntegration) {
        await tenantStorage.updateEmailIntegration(exactTargetIntegration.id, publisherId, {
          lastSync: new Date(),
          status: "active",
          isConnected: true,
        });
      }

      return access_token;
    } catch (error) {
      console.error("ExactTarget authentication error:", error);
      throw new Error("Failed to authenticate with ExactTarget");
    }
  }

  /**
   * Get valid access token for publisher
   */
  private async getAccessToken(publisherId: string): Promise<string> {
    const cached = this.accessTokens.get(publisherId);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    // Get stored credentials and re-authenticate
    const integrations = await tenantStorage.getEmailIntegrations(publisherId);
    const exactTargetIntegration = integrations.find(i => i.platform === "exacttarget");
    
    if (!exactTargetIntegration || !exactTargetIntegration.config) {
      throw new Error("ExactTarget integration not configured");
    }

    return await this.authenticate(publisherId, exactTargetIntegration.config as ExactTargetConfig);
  }

  /**
   * Get base API URL for publisher
   */
  private async getBaseUrl(publisherId: string): Promise<string> {
    const integrations = await tenantStorage.getEmailIntegrations(publisherId);
    const exactTargetIntegration = integrations.find(i => i.platform === "exacttarget");
    
    if (!exactTargetIntegration?.config) {
      throw new Error("ExactTarget integration not configured");
    }

    const config = exactTargetIntegration.config as ExactTargetConfig;
    return `https://${config.subdomain}.rest.marketingcloudapis.com`;
  }

  /**
   * Create or update data extension for subscribers
   */
  async createSubscriberDataExtension(publisherId: string): Promise<string> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      const dataExtension: ExactTargetDataExtension = {
        Name: "SharpSend Subscribers",
        CustomerKey: `sharpsend_subscribers_${publisherId}`,
        Description: "Subscribers imported from SharpSend platform",
        Fields: [
          {
            Name: "SubscriberKey",
            FieldType: "Text",
            MaxLength: 254,
            IsRequired: true,
            IsPrimaryKey: true,
          },
          {
            Name: "EmailAddress",
            FieldType: "EmailAddress",
            IsRequired: true,
          },
          {
            Name: "FirstName",
            FieldType: "Text",
            MaxLength: 100,
          },
          {
            Name: "LastName",
            FieldType: "Text",
            MaxLength: 100,
          },
          {
            Name: "Segment",
            FieldType: "Text",
            MaxLength: 50,
          },
          {
            Name: "EngagementScore",
            FieldType: "Number",
          },
          {
            Name: "Revenue",
            FieldType: "Number",
          },
          {
            Name: "JoinedDate",
            FieldType: "Date",
          },
          {
            Name: "IsActive",
            FieldType: "Boolean",
          },
        ],
      };

      const response = await axios.post(
        `${baseUrl}/hub/v1/dataevents/key:${dataExtension.CustomerKey}/rowset`,
        dataExtension,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return dataExtension.CustomerKey;
    } catch (error) {
      console.error("Create data extension error:", error);
      throw new Error("Failed to create data extension in ExactTarget");
    }
  }

  /**
   * Sync subscribers to ExactTarget data extension
   */
  async syncSubscribersToExactTarget(publisherId: string): Promise<{ synced: number; errors: string[] }> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      const subscribers = await tenantStorage.getSubscribers(publisherId);
      
      const dataExtensionKey = `sharpsend_subscribers_${publisherId}`;
      
      // Prepare subscriber data for ExactTarget
      const subscriberRows = subscribers.map(subscriber => ({
        keys: {
          SubscriberKey: subscriber.email,
        },
        values: {
          EmailAddress: subscriber.email,
          FirstName: subscriber.name.split(" ")[0] || subscriber.name,
          LastName: subscriber.name.split(" ").slice(1).join(" ") || "",
          Segment: subscriber.segment,
          EngagementScore: parseFloat(subscriber.engagementScore || "0"),
          Revenue: parseFloat(subscriber.revenue || "0"),
          JoinedDate: subscriber.joinedAt?.toISOString().split("T")[0],
          IsActive: subscriber.isActive,
        },
      }));

      // Batch upload subscribers (ExactTarget has limits on batch size)
      const batchSize = 1000;
      let synced = 0;
      const errors: string[] = [];

      for (let i = 0; i < subscriberRows.length; i += batchSize) {
        const batch = subscriberRows.slice(i, i + batchSize);
        
        try {
          await axios.post(
            `${baseUrl}/hub/v1/dataevents/key:${dataExtensionKey}/rowset`,
            batch,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          synced += batch.length;
        } catch (error) {
          errors.push(`Failed to sync batch ${i / batchSize + 1}: ${error}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error("Subscriber sync error:", error);
      throw new Error("Failed to sync subscribers to ExactTarget");
    }
  }

  /**
   * Create email template in ExactTarget
   */
  async createEmailTemplate(publisherId: string, emailData: ExactTargetEmail): Promise<number> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      const response = await axios.post(
        `${baseUrl}/messaging/v1/email/definitions`,
        {
          name: emailData.Name,
          content: {
            customerKey: `sharpsend_email_${Date.now()}`,
            htmlBody: emailData.HTMLBody,
            textBody: emailData.TextBody || this.stripHtml(emailData.HTMLBody),
            subject: emailData.Subject,
            from: {
              email: emailData.FromEmail,
              name: emailData.FromName,
            },
            replyTo: {
              email: emailData.ReplyToEmail || emailData.FromEmail,
            },
          },
          status: "Active",
        },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.definitionKey;
    } catch (error) {
      console.error("Create email template error:", error);
      throw new Error("Failed to create email template in ExactTarget");
    }
  }

  /**
   * Send email campaign via ExactTarget
   */
  async sendCampaign(publisherId: string, campaignId: string): Promise<string> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      const campaign = await tenantStorage.getCampaign(campaignId, publisherId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Create email definition
      const emailData: ExactTargetEmail = {
        Name: campaign.name,
        Subject: campaign.subjectLine,
        HTMLBody: campaign.content,
        FromName: "SharpSend Newsletter",
        FromEmail: "newsletter@sharpsend.com", // This should be configurable
      };

      const emailDefinitionKey = await this.createEmailTemplate(publisherId, emailData);
      
      // Create and start send
      const sendResponse = await axios.post(
        `${baseUrl}/messaging/v1/email/messages`,
        {
          definitionKey: emailDefinitionKey,
          recipients: {
            dataExtensionKey: `sharpsend_subscribers_${publisherId}`,
          },
          options: {
            requestType: "ASYNC",
          },
        },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update campaign status
      await tenantStorage.updateCampaign(campaignId, publisherId, {
        status: "sent",
        sentAt: new Date(),
      });

      return sendResponse.data.requestId;
    } catch (error) {
      console.error("Send campaign error:", error);
      throw new Error("Failed to send campaign via ExactTarget");
    }
  }

  /**
   * Get campaign analytics from ExactTarget
   */
  async getCampaignAnalytics(publisherId: string, requestId: string): Promise<{
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  }> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      const response = await axios.get(
        `${baseUrl}/messaging/v1/email/messages/${requestId}/deliveries`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const stats = response.data.results?.[0]?.stats || {};
      
      return {
        sent: stats.sent || 0,
        delivered: stats.delivered || 0,
        opens: stats.opens || 0,
        clicks: stats.clicks || 0,
        bounces: stats.bounces || 0,
        unsubscribes: stats.unsubscribes || 0,
      };
    } catch (error) {
      console.error("Get campaign analytics error:", error);
      throw new Error("Failed to get campaign analytics from ExactTarget");
    }
  }

  /**
   * Get subscriber engagement data
   */
  async getSubscriberEngagement(publisherId: string, email: string): Promise<{
    totalOpens: number;
    totalClicks: number;
    lastEngagement: Date | null;
    engagementScore: number;
  }> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      // Query engagement data for specific subscriber
      const response = await axios.get(
        `${baseUrl}/data/v1/customobjectdata/key:EngagementTracking/rowset`,
        {
          params: {
            $filter: `EmailAddress eq '${email}'`,
          },
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const engagementData = response.data.items || [];
      
      let totalOpens = 0;
      let totalClicks = 0;
      let lastEngagement: Date | null = null;
      
      engagementData.forEach((item: any) => {
        if (item.EventType === "Open") totalOpens++;
        if (item.EventType === "Click") totalClicks++;
        
        const eventDate = new Date(item.EventDate);
        if (!lastEngagement || eventDate > lastEngagement) {
          lastEngagement = eventDate;
        }
      });

      // Calculate engagement score (simple algorithm)
      const engagementScore = Math.min(100, (totalOpens * 2 + totalClicks * 5) / 10);
      
      return {
        totalOpens,
        totalClicks,
        lastEngagement,
        engagementScore,
      };
    } catch (error) {
      console.error("Get subscriber engagement error:", error);
      return {
        totalOpens: 0,
        totalClicks: 0,
        lastEngagement: null,
        engagementScore: 0,
      };
    }
  }

  /**
   * Test ExactTarget connection
   */
  async testConnection(publisherId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      // Simple API call to test connection
      await axios.get(
        `${baseUrl}/platform/v1/endpoints`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error("ExactTarget connection test failed:", error);
      return false;
    }
  }

  /**
   * Utility function to strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  /**
   * Get ExactTarget account information
   */
  async getAccountInfo(publisherId: string): Promise<{
    accountId: string;
    accountName: string;
    emailsSent: number;
    dataExtensions: number;
  }> {
    try {
      const token = await this.getAccessToken(publisherId);
      const baseUrl = await this.getBaseUrl(publisherId);
      
      const response = await axios.get(
        `${baseUrl}/platform/v1/tokenContext`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const context = response.data;
      
      return {
        accountId: context.organization?.id || "",
        accountName: context.organization?.name || "",
        emailsSent: 0, // This would require additional API calls to get actual stats
        dataExtensions: 0, // This would require additional API calls
      };
    } catch (error) {
      console.error("Get account info error:", error);
      throw new Error("Failed to get ExactTarget account information");
    }
  }
}

export const exactTargetService = new ExactTargetService();

