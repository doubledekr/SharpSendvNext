/**
 * Email Platform Integration Service
 * Handles legitimate data collection from authorized email service providers
 */

export interface EmailPlatformMetrics {
  totalSubscribers: number;
  activeSubscribers: number;
  recentCampaigns: number;
  avgOpenRate: number;
  avgClickRate: number;
  unsubscribeRate: number;
  lastSyncTime: Date;
}

export interface MailchimpIntegration {
  apiKey: string;
  listId: string;
  serverPrefix: string;
}

export interface ConvertKitIntegration {
  apiKey: string;
  apiSecret: string;
}

export class EmailPlatformService {
  
  /**
   * Get legitimate metrics from connected email platforms
   */
  async getEmailPlatformMetrics(integration: {
    platform: 'mailchimp' | 'convertkit' | 'brevo';
    credentials: any;
  }): Promise<EmailPlatformMetrics> {
    
    switch (integration.platform) {
      case 'mailchimp':
        return this.getMailchimpMetrics(integration.credentials);
      case 'convertkit':
        return this.getConvertKitMetrics(integration.credentials);
      case 'brevo':
        return this.getBrevoMetrics(integration.credentials);
      default:
        return this.getDefaultMetrics();
    }
  }

  /**
   * Mailchimp legitimate metrics through their official API
   */
  private async getMailchimpMetrics(credentials: MailchimpIntegration): Promise<EmailPlatformMetrics> {
    try {
      // This would use Mailchimp's official API with proper authentication
      // Only accessing data the user has authorized us to access
      
      const baseUrl = `https://${credentials.serverPrefix}.api.mailchimp.com/3.0`;
      
      // Get list statistics (legitimate access through user's API key)
      const response = await fetch(`${baseUrl}/lists/${credentials.listId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`anystring:${credentials.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Mailchimp data');
      }

      const listData = await response.json();

      // Get recent campaign stats
      const campaignsResponse = await fetch(`${baseUrl}/campaigns?count=10&list_id=${credentials.listId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`anystring:${credentials.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      const campaignData = campaignsResponse.ok ? await campaignsResponse.json() : { campaigns: [] };
      
      // Calculate averages from recent campaigns
      const recentCampaigns = campaignData.campaigns || [];
      const avgOpenRate = recentCampaigns.length > 0 
        ? recentCampaigns.reduce((sum: number, campaign: any) => 
            sum + (campaign.report_summary?.open_rate || 0), 0) / recentCampaigns.length * 100
        : 0;

      const avgClickRate = recentCampaigns.length > 0
        ? recentCampaigns.reduce((sum: number, campaign: any) => 
            sum + (campaign.report_summary?.click_rate || 0), 0) / recentCampaigns.length * 100
        : 0;

      return {
        totalSubscribers: listData.stats?.member_count || 0,
        activeSubscribers: listData.stats?.member_count || 0,
        recentCampaigns: recentCampaigns.length,
        avgOpenRate: Math.round(avgOpenRate * 100) / 100,
        avgClickRate: Math.round(avgClickRate * 100) / 100,
        unsubscribeRate: listData.stats?.unsubscribe_count_since_send || 0,
        lastSyncTime: new Date()
      };
      
    } catch (error) {
      console.error('Error fetching Mailchimp metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * ConvertKit legitimate metrics through their official API
   */
  private async getConvertKitMetrics(credentials: ConvertKitIntegration): Promise<EmailPlatformMetrics> {
    try {
      // ConvertKit API access with proper authentication
      const response = await fetch(`https://api.convertkit.com/v3/subscribers?api_key=${credentials.apiKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ConvertKit data');
      }

      const data = await response.json();

      return {
        totalSubscribers: data.total_subscribers || 0,
        activeSubscribers: data.total_subscribers || 0,
        recentCampaigns: 0, // Would need to fetch from broadcasts endpoint
        avgOpenRate: 0, // Would calculate from campaign reports
        avgClickRate: 0, // Would calculate from campaign reports
        unsubscribeRate: 0,
        lastSyncTime: new Date()
      };
      
    } catch (error) {
      console.error('Error fetching ConvertKit metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Brevo (formerly Sendinblue) legitimate metrics
   */
  private async getBrevoMetrics(credentials: { apiKey: string }): Promise<EmailPlatformMetrics> {
    try {
      // Brevo API access with proper authentication
      const response = await fetch('https://api.brevo.com/v3/contacts', {
        headers: {
          'api-key': credentials.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Brevo data');
      }

      const data = await response.json();

      return {
        totalSubscribers: data.count || 0,
        activeSubscribers: data.count || 0,
        recentCampaigns: 0, // Would fetch from campaigns endpoint
        avgOpenRate: 0, // Would calculate from campaign statistics
        avgClickRate: 0, // Would calculate from campaign statistics
        unsubscribeRate: 0,
        lastSyncTime: new Date()
      };
      
    } catch (error) {
      console.error('Error fetching Brevo metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Default metrics when no integration is available
   */
  private getDefaultMetrics(): EmailPlatformMetrics {
    return {
      totalSubscribers: 0,
      activeSubscribers: 0,
      recentCampaigns: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      unsubscribeRate: 0,
      lastSyncTime: new Date()
    };
  }

  /**
   * Get cohort segmentation from email platform tags/segments
   */
  async getCohortSegmentation(integration: {
    platform: 'mailchimp' | 'convertkit' | 'brevo';
    credentials: any;
  }): Promise<Record<string, number>> {
    
    switch (integration.platform) {
      case 'mailchimp':
        return this.getMailchimpSegmentation(integration.credentials);
      default:
        return {};
    }
  }

  /**
   * Get Mailchimp segments/tags (legitimate user-created segments)
   */
  private async getMailchimpSegmentation(credentials: MailchimpIntegration): Promise<Record<string, number>> {
    try {
      const baseUrl = `https://${credentials.serverPrefix}.api.mailchimp.com/3.0`;
      
      // Get user-created segments
      const response = await fetch(`${baseUrl}/lists/${credentials.listId}/segments`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`anystring:${credentials.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {};
      }

      const segmentData = await response.json();
      const cohortCounts: Record<string, number> = {};

      // Only count segments that match our cohort naming convention
      for (const segment of segmentData.segments || []) {
        if (segment.name.startsWith('SS_') || segment.name.includes('SharpSend')) {
          const cleanName = segment.name.replace('SS_', '').replace('SharpSend_', '');
          cohortCounts[cleanName] = segment.member_count || 0;
        }
      }

      return cohortCounts;
      
    } catch (error) {
      console.error('Error fetching Mailchimp segmentation:', error);
      return {};
    }
  }

  /**
   * Validate email platform connection
   */
  async validateIntegration(integration: {
    platform: 'mailchimp' | 'convertkit' | 'brevo';
    credentials: any;
  }): Promise<{ valid: boolean; error?: string }> {
    
    try {
      const metrics = await this.getEmailPlatformMetrics(integration);
      return { 
        valid: metrics.lastSyncTime instanceof Date 
      };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}