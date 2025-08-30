import { CustomerIoIntegrationService } from './customerio-integration';

interface SegmentCriteria {
  baseSegment?: string;
  portfolioValue?: { min?: number; max?: number };
  engagementScore?: number;
  location?: string[];
  attributes?: Record<string, any>;
  emailOpens?: number;
  emailClicks?: number;
  lastLogin?: string;
}

interface SharpSendSegment {
  id: string;
  name: string;
  description?: string;
  type: 'manual' | 'dynamic' | 'ai-generated';
  subscriberCount: number;
  criteria?: SegmentCriteria;
  source: 'customer_io' | 'sharpsend';
  createdAt: string;
  lastUpdated: string;
}

export class SegmentManagementService {
  private customerIoService: CustomerIoIntegrationService;

  constructor(credentials: {
    siteId: string;
    trackApiKey: string;
    appApiKey: string;
    region: string;
  }) {
    this.customerIoService = new CustomerIoIntegrationService(credentials);
  }

  /**
   * Get all segments with enriched data
   */
  async getAllSegments(): Promise<SharpSendSegment[]> {
    try {
      const response = await this.customerIoService.getSegments();
      const segments = response.segments || [];

      // Enrich segments with REAL subscriber counts from Customer.io membership
      const enrichedSegments = await Promise.all(
        segments.map(async (segment: any) => {
          try {
            // Get actual members to get real subscriber count
            const membershipResponse = await this.customerIoService.makeApiRequest('GET', `/segments/${segment.id}/membership?limit=1000`);
            const realSubscriberCount = membershipResponse.identifiers?.length || 0;

            console.log(`Segment "${segment.name}" (ID: ${segment.id}) has ${realSubscriberCount} real subscribers`);

            return {
              id: segment.id.toString(),
              name: segment.name,
              description: segment.description,
              type: segment.type || 'manual',
              subscriberCount: realSubscriberCount,
              source: 'customer_io' as const,
              createdAt: segment.created_at || new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Failed to get real member count for segment ${segment.id}:`, error);
            return {
              id: segment.id.toString(),
              name: segment.name,
              description: segment.description,
              type: 'manual' as const,
              subscriberCount: 0,
              source: 'customer_io' as const,
              createdAt: segment.created_at || new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
          }
        })
      );

      return enrichedSegments;
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      return [];
    }
  }

  /**
   * Get subscribers in a specific segment
   */
  async getSegmentSubscribers(segmentId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.customerIoService.makeApiRequest('GET', `/segments/${segmentId}/membership?limit=${limit}`);
      
      if (!response || !response.identifiers) {
        console.warn(`No identifiers found in segment ${segmentId} response`);
        return [];
      }
      
      // Transform Customer.io format to SharpSend format with safe property access
      const subscribers = response.identifiers
        .filter((identifier: any) => identifier && (identifier.email || identifier.id)) // Filter out invalid identifiers
        .map((identifier: any) => {
          const email = identifier.email || identifier.id || `user_${segmentId}_${Date.now()}@customer.io`;
          const name = identifier.name || (typeof email === 'string' && email.includes('@') ? email.split('@')[0] : 'Unknown User');
          
          return {
            id: identifier.cio_id || identifier.id || `${segmentId}_${Date.now()}`,
            email: email,
            name: name,
            segment: `Segment ${segmentId}`,
            engagementScore: "0",
            revenue: "0",
            joinedAt: identifier.created_at ? new Date(identifier.created_at * 1000).toISOString() : new Date().toISOString(),
            isActive: !identifier.unsubscribed,
            metadata: identifier.attributes || {},
            preferences: {},
            tags: [],
            externalId: identifier.cio_id || identifier.id,
            source: "customer_io_segment",
            lastSyncAt: new Date().toISOString()
          };
        });

      console.log(`Successfully processed ${subscribers.length} subscribers from segment ${segmentId}`);
      return subscribers;
    } catch (error) {
      console.error(`Failed to get subscribers for segment ${segmentId}:`, error);
      throw error; // Re-throw to allow calling code to handle with fallback
    }
  }

  /**
   * Create a new segment with AI-powered criteria
   */
  async createSegment(segmentData: {
    name: string;
    description?: string;
    type: 'manual' | 'dynamic' | 'ai-generated';
    criteria?: SegmentCriteria;
  }): Promise<SharpSendSegment> {
    try {
      // Create segment in Customer.io
      const response = await this.customerIoService.makeApiRequest('POST', '/segments', {
        segment: {
          name: `SharpSend_${segmentData.name}`,
          description: segmentData.description || `Created by SharpSend on ${new Date().toLocaleDateString()}`
        }
      });

      const newSegment: SharpSendSegment = {
        id: response.segment.id.toString(),
        name: segmentData.name,
        description: segmentData.description,
        type: segmentData.type,
        subscriberCount: 0,
        criteria: segmentData.criteria,
        source: 'sharpsend',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      return newSegment;
    } catch (error) {
      console.error('Failed to create segment:', error);
      throw new Error('Failed to create segment in Customer.io');
    }
  }

  /**
   * Search subscribers with advanced criteria
   */
  async searchSubscribers(searchCriteria: {
    query?: string;
    segments?: string[];
    attributes?: Record<string, any>;
    limit?: number;
  }): Promise<any[]> {
    try {
      const filter = this.buildSearchFilter(searchCriteria);
      
      const response = await this.customerIoService.makeApiRequest('POST', '/customers', {
        filter,
        limit: searchCriteria.limit || 50
      });

      // Transform to SharpSend format
      const subscribers = (response.identifiers || []).map((identifier: any) => ({
        id: identifier.cio_id,
        email: identifier.email,
        name: identifier.name || identifier.email.split('@')[0],
        segment: "Search Result",
        engagementScore: this.calculateEngagementScore(identifier.attributes || {}),
        revenue: "0",
        joinedAt: identifier.created_at ? new Date(identifier.created_at * 1000).toISOString() : new Date().toISOString(),
        isActive: !identifier.unsubscribed,
        metadata: identifier.attributes || {},
        preferences: {},
        tags: this.extractTags(identifier.attributes || {}),
        externalId: identifier.cio_id,
        source: "customer_io_search",
        lastSyncAt: new Date().toISOString()
      }));

      return subscribers;
    } catch (error) {
      console.error('Failed to search subscribers:', error);
      return [];
    }
  }

  /**
   * Build search filter for Customer.io API
   */
  private buildSearchFilter(criteria: any): any {
    const filters: any[] = [];

    // Email or name search
    if (criteria.query) {
      filters.push({
        or: [
          {
            attribute: {
              field: 'email',
              operator: 'contains',
              value: criteria.query
            }
          },
          {
            attribute: {
              field: 'name',
              operator: 'contains',
              value: criteria.query
            }
          }
        ]
      });
    }

    // Segment membership
    if (criteria.segments && criteria.segments.length > 0) {
      const segmentFilters = criteria.segments.map((segmentId: string) => ({
        segment: { id: parseInt(segmentId) }
      }));
      
      filters.push(
        segmentFilters.length > 1 
          ? { or: segmentFilters }
          : segmentFilters[0]
      );
    }

    // Attribute filters
    if (criteria.attributes) {
      Object.entries(criteria.attributes).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filters.push({
            attribute: {
              field,
              operator: 'eq',
              value
            }
          });
        }
      });
    }

    return filters.length > 1 ? { and: filters } : filters[0] || {};
  }

  /**
   * Calculate engagement score based on attributes
   */
  private calculateEngagementScore(attributes: Record<string, any>): string {
    let score = 0;
    
    if (attributes.email_opens) score += Math.min(attributes.email_opens * 2, 40);
    if (attributes.email_clicks) score += Math.min(attributes.email_clicks * 5, 30);
    if (attributes.last_login) {
      const daysSinceLogin = (Date.now() - new Date(attributes.last_login).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(30 - daysSinceLogin, 0);
    }
    
    return Math.min(score, 100).toString();
  }

  /**
   * Extract tags from Customer.io attributes
   */
  private extractTags(attributes: Record<string, any>): string[] {
    const tags: string[] = [];
    
    if (attributes.investment_interest) tags.push(attributes.investment_interest);
    if (attributes.engagement_level) tags.push(attributes.engagement_level);
    if (attributes.portfolio_size === 'large') tags.push('high-value');
    if (attributes.trading_frequency === 'daily') tags.push('active-trader');
    
    return tags;
  }
}