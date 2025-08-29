import { OpenAI } from 'openai';

export interface SubscriberProfile {
  id: string;
  email: string;
  name?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  attributes?: Record<string, any>;
  behaviorData?: {
    openRate?: number;
    clickRate?: number;
    lastOpenTime?: string;
    averageOpenTime?: string;
    deviceTypes?: string[];
    location?: string;
  };
}

export interface DetectedSegment {
  name: string;
  description: string;
  type: 'behavioral' | 'demographic' | 'interest' | 'engagement';
  subscribers: string[];
  confidence: number;
  criteria: string[];
  suggestedActions: string[];
}

export class AISegmentDetector {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for AI segment detection');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async detectSegments(subscribers: SubscriberProfile[]): Promise<DetectedSegment[]> {
    if (subscribers.length === 0) {
      return [];
    }

    try {
      const prompt = this.buildSegmentDetectionPrompt(subscribers);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email marketing analyst specializing in subscriber segmentation for financial newsletters. Analyze subscriber data to detect meaningful segments based on behavior, interests, engagement patterns, and metadata.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new Error('No analysis returned from OpenAI');
      }

      return this.parseSegmentAnalysis(analysis, subscribers);
    } catch (error) {
      console.error('AI segment detection error:', error);
      // Fallback to rule-based detection
      return this.fallbackRuleBasedDetection(subscribers);
    }
  }

  private buildSegmentDetectionPrompt(subscribers: SubscriberProfile[]): string {
    const subscriberSummary = subscribers.slice(0, 50).map(sub => ({
      id: sub.id,
      email: sub.email?.split('@')[1], // Domain only for privacy
      tags: sub.tags,
      attributes: sub.attributes,
      behavior: sub.behaviorData
    }));

    return `Analyze these ${subscribers.length} financial newsletter subscribers and detect meaningful segments.

SUBSCRIBER DATA SAMPLE (first 50 of ${subscribers.length}):
${JSON.stringify(subscriberSummary, null, 2)}

Please identify 3-7 distinct segments based on:

1. **Engagement Patterns**: Late openers, early birds, weekend readers, mobile-first users
2. **Financial Interests**: Crypto enthusiasts, dividend investors, day traders, long-term investors
3. **Behavioral Characteristics**: High-value readers (frequent opens/clicks), lurkers, bargain hunters
4. **Demographic/Geographic**: Time zone patterns, device preferences, subscription source

For each segment, provide:
- **name**: Clear, actionable segment name
- **description**: 1-2 sentence explanation
- **type**: behavioral, demographic, interest, or engagement  
- **criteria**: List of specific criteria used for detection
- **confidence**: 0-100 confidence score
- **suggestedActions**: 2-3 specific email marketing actions

Return response in this JSON format:
{
  "segments": [
    {
      "name": "Crypto Enthusiasts",
      "description": "Subscribers interested in cryptocurrency content",
      "type": "interest", 
      "subscribers": ["subscriber_id_1", "subscriber_id_2"],
      "confidence": 85,
      "criteria": ["crypto-related tags", "high engagement with crypto content"],
      "suggestedActions": ["Send crypto market updates", "Include DeFi analysis"]
    }
  ]
}

Focus on segments that are actionable for financial newsletter marketing.`;
  }

  private parseSegmentAnalysis(analysis: string, subscribers: SubscriberProfile[]): DetectedSegment[] {
    try {
      // Extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const segments: DetectedSegment[] = [];

      if (parsed.segments && Array.isArray(parsed.segments)) {
        for (const seg of parsed.segments) {
          // Validate and match subscriber IDs
          const matchedSubscribers = this.matchSubscribersToSegment(seg, subscribers);
          
          segments.push({
            name: seg.name || 'Unknown Segment',
            description: seg.description || 'AI-detected segment',
            type: seg.type || 'behavioral',
            subscribers: matchedSubscribers,
            confidence: Math.min(100, Math.max(0, seg.confidence || 70)),
            criteria: Array.isArray(seg.criteria) ? seg.criteria : [],
            suggestedActions: Array.isArray(seg.suggestedActions) ? seg.suggestedActions : []
          });
        }
      }

      return segments;
    } catch (error) {
      console.error('Error parsing AI segment analysis:', error);
      return this.fallbackRuleBasedDetection(subscribers);
    }
  }

  private matchSubscribersToSegment(segment: any, subscribers: SubscriberProfile[]): string[] {
    // Try to match subscribers based on the segment criteria
    const matchedIds: string[] = [];

    for (const subscriber of subscribers) {
      let matches = 0;
      const criteria = segment.criteria || [];

      for (const criterion of criteria) {
        const lowerCriterion = criterion.toLowerCase();
        
        // Check tags
        if (subscriber.tags?.some(tag => 
          tag.toLowerCase().includes(lowerCriterion) ||
          lowerCriterion.includes(tag.toLowerCase())
        )) {
          matches++;
        }

        // Check attributes
        if (subscriber.attributes) {
          const attributeString = JSON.stringify(subscriber.attributes).toLowerCase();
          if (attributeString.includes(lowerCriterion)) {
            matches++;
          }
        }

        // Check behavioral patterns
        if (lowerCriterion.includes('late opener') && subscriber.behaviorData?.averageOpenTime) {
          const hour = parseInt(subscriber.behaviorData.averageOpenTime);
          if (hour >= 18 || hour <= 6) {
            matches++;
          }
        }

        if (lowerCriterion.includes('high engagement') && subscriber.behaviorData?.openRate) {
          if (subscriber.behaviorData.openRate > 0.3) {
            matches++;
          }
        }
      }

      // If subscriber matches multiple criteria, include them
      if (matches > 0 || Math.random() < 0.1) { // Include some random sampling
        matchedIds.push(subscriber.id);
      }
    }

    return matchedIds;
  }

  private fallbackRuleBasedDetection(subscribers: SubscriberProfile[]): DetectedSegment[] {
    const segments: DetectedSegment[] = [];

    // Crypto Enthusiasts
    const cryptoEnthusiasts = subscribers.filter(sub => 
      sub.tags?.some(tag => /crypto|bitcoin|ethereum|defi|blockchain/i.test(tag)) ||
      JSON.stringify(sub.attributes || {}).toLowerCase().includes('crypto')
    );

    if (cryptoEnthusiasts.length > 0) {
      segments.push({
        name: 'Crypto Enthusiasts',
        description: 'Subscribers interested in cryptocurrency and blockchain content',
        type: 'interest',
        subscribers: cryptoEnthusiasts.map(s => s.id),
        confidence: 80,
        criteria: ['crypto-related tags', 'blockchain interest indicators'],
        suggestedActions: ['Send crypto market analysis', 'Include DeFi opportunities', 'Share regulatory updates']
      });
    }

    // Late Openers (based on behavior data)
    const lateOpeners = subscribers.filter(sub => {
      if (sub.behaviorData?.averageOpenTime) {
        const hour = parseInt(sub.behaviorData.averageOpenTime);
        return hour >= 18 || hour <= 6;
      }
      return false;
    });

    if (lateOpeners.length > 0) {
      segments.push({
        name: 'Late Openers',
        description: 'Subscribers who typically open emails in the evening or early morning',
        type: 'behavioral',
        subscribers: lateOpeners.map(s => s.id),
        confidence: 75,
        criteria: ['opens emails after 6 PM or before 6 AM'],
        suggestedActions: ['Send evening market summaries', 'Include pre-market analysis', 'Optimize send times for evening delivery']
      });
    }

    // High-Value Readers
    const highValueReaders = subscribers.filter(sub => {
      const openRate = sub.behaviorData?.openRate || 0;
      const clickRate = sub.behaviorData?.clickRate || 0;
      return openRate > 0.4 || clickRate > 0.1;
    });

    if (highValueReaders.length > 0) {
      segments.push({
        name: 'High-Value Readers',
        description: 'Highly engaged subscribers with strong open and click rates',
        type: 'engagement',
        subscribers: highValueReaders.map(s => s.id),
        confidence: 85,
        criteria: ['open rate > 40%', 'high click engagement'],
        suggestedActions: ['Offer premium content', 'Include exclusive investment opportunities', 'Provide early access to analysis']
      });
    }

    return segments;
  }
}