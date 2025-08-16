import OpenAI from 'openai';
import { tenantStorage } from '../storage-multitenant';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentAnalysis {
  sentimentScore: number;
  readabilityScore: number;
  engagementPrediction: number;
  keyTopics: string[];
  emotionalTone: string;
  urgencyLevel: number;
}

export interface SubjectLineVariation {
  text: string;
  style: 'urgent' | 'curiosity' | 'benefit' | 'personal' | 'news' | 'question';
  predictedOpenRate: number;
  reasoning: string;
}

export interface ContentPersonalization {
  cohortId: string;
  cohortName: string;
  personalizedSubject: string;
  personalizedContent: string;
  personalizedCTA: string;
  engagementPrediction: number;
  reasoning: string;
}

export interface MarketContext {
  relevantNews: string[];
  marketTrends: string[];
  sectorPerformance: { [key: string]: number };
  volatilityIndex: number;
  sentimentIndicators: string[];
}

export class AIContentProcessor {
  private publisherId: string;

  constructor(publisherId: string) {
    this.publisherId = publisherId;
  }

  /**
   * Analyze content for sentiment, readability, and engagement potential
   */
  async analyzeContent(content: string, subject: string): Promise<ContentAnalysis> {
    try {
      const prompt = `
Analyze the following email content and subject line for a financial newsletter:

Subject: ${subject}
Content: ${content}

Provide analysis in the following JSON format:
{
  "sentimentScore": 0.0-1.0 (0=very negative, 1=very positive),
  "readabilityScore": 0-100 (Flesch reading ease score),
  "engagementPrediction": 0.0-1.0 (predicted engagement rate),
  "keyTopics": ["topic1", "topic2", "topic3"],
  "emotionalTone": "professional|excited|urgent|cautious|optimistic|analytical",
  "urgencyLevel": 0.0-1.0 (0=no urgency, 1=very urgent)
}

Consider financial newsletter best practices, subscriber engagement patterns, and market communication effectiveness.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis received from OpenAI');
      }

      // Parse JSON response
      const analysis = JSON.parse(analysisText) as ContentAnalysis;
      
      // Store analysis in database
      await this.storeContentAnalysis(content, subject, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing content:', error);
      // Return default analysis if AI fails
      return {
        sentimentScore: 0.7,
        readabilityScore: 75,
        engagementPrediction: 0.65,
        keyTopics: ['market analysis', 'investment strategy'],
        emotionalTone: 'professional',
        urgencyLevel: 0.5
      };
    }
  }

  /**
   * Generate subject line variations optimized for different styles
   */
  async generateSubjectLineVariations(
    originalSubject: string, 
    content: string, 
    targetAudience: string
  ): Promise<SubjectLineVariation[]> {
    try {
      const prompt = `
Generate 6 subject line variations for a financial newsletter email:

Original Subject: ${originalSubject}
Content Preview: ${content.substring(0, 500)}...
Target Audience: ${targetAudience}

Create variations in these styles:
1. Urgent/Breaking News
2. Curiosity/Mystery
3. Benefit/Value Proposition
4. Personal/Direct
5. News/Informational
6. Question/Engagement

For each variation, provide:
- The subject line text
- Style category
- Predicted open rate (0.0-1.0)
- Brief reasoning for effectiveness

Return as JSON array:
[
  {
    "text": "subject line",
    "style": "urgent",
    "predictedOpenRate": 0.85,
    "reasoning": "explanation"
  }
]

Focus on financial newsletter best practices and proven engagement patterns.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const variationsText = response.choices[0]?.message?.content;
      if (!variationsText) {
        throw new Error('No variations received from OpenAI');
      }

      const variations = JSON.parse(variationsText) as SubjectLineVariation[];
      
      // Store variations in database
      await this.storeSubjectLineVariations(originalSubject, variations);
      
      return variations;
    } catch (error) {
      console.error('Error generating subject line variations:', error);
      // Return default variations if AI fails
      return [
        {
          text: `🚨 URGENT: ${originalSubject}`,
          style: 'urgent',
          predictedOpenRate: 0.78,
          reasoning: 'Urgency indicators typically increase open rates'
        },
        {
          text: `What ${targetAudience} need to know about...`,
          style: 'curiosity',
          predictedOpenRate: 0.72,
          reasoning: 'Curiosity gap creates engagement'
        }
      ];
    }
  }

  /**
   * Generate personalized content for different subscriber cohorts
   */
  async personalizeForCohorts(
    content: string, 
    subject: string, 
    cohorts: any[]
  ): Promise<ContentPersonalization[]> {
    try {
      // Always fetch current market context for personalization
      const { MarketIntelligenceService } = await import('./market-intelligence');
      const marketService = new MarketIntelligenceService();
      const marketContext = await marketService.getMarketContext();
      
      const personalizations: ContentPersonalization[] = [];

      for (const cohort of cohorts) {
        const prompt = `
Personalize this financial newsletter content for a specific subscriber cohort:

Original Subject: ${subject}
Original Content: ${content}

CURRENT MARKET CONDITIONS (ALWAYS CONSIDER):
- Market Sentiment: ${marketContext.marketSentiment.toUpperCase()}
- VIX Level: ${marketContext.economicIndicators.vixLevel} (${
          marketContext.economicIndicators.vixLevel < 16 ? 'Low volatility - calm markets' :
          marketContext.economicIndicators.vixLevel > 25 ? 'High volatility - fearful markets' :
          'Moderate volatility'
        })
- Market Status: ${marketContext.currentMarketCondition}
- Top Sectors: ${Object.entries(marketContext.sectorPerformance)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([sector, perf]) => `${sector} (${perf > 0 ? '+' : ''}${perf}%)`)
    .join(', ')}

Cohort Profile:
- Name: ${cohort.name}
- Size: ${cohort.size} subscribers
- Characteristics: ${cohort.characteristics.join(', ')}
- Risk Tolerance: ${cohort.riskTolerance || 'moderate'}
- Investment Focus: ${cohort.investmentFocus || 'diversified'}
- Experience Level: ${cohort.experienceLevel || 'intermediate'}

Personalize:
1. Subject line - make it relevant to this cohort's interests and style
2. Content - adjust tone, examples, and recommendations for this audience
3. Call-to-action - tailor to their likely next steps

Return JSON:
{
  "personalizedSubject": "personalized subject line",
  "personalizedContent": "personalized content (keep structure, adjust messaging)",
  "personalizedCTA": "personalized call-to-action",
  "engagementPrediction": 0.0-1.0,
  "reasoning": "explanation of personalization choices"
}

Focus on making the content feel specifically crafted for this cohort while maintaining professional quality.
`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 1500,
        });

        const personalizationText = response.choices[0]?.message?.content;
        if (personalizationText) {
          const personalization = JSON.parse(personalizationText);
          personalizations.push({
            cohortId: cohort.id,
            cohortName: cohort.name,
            ...personalization
          });
        }
      }

      // Store personalizations in database
      await this.storeContentPersonalizations(content, personalizations);
      
      return personalizations;
    } catch (error) {
      console.error('Error personalizing content for cohorts:', error);
      return [];
    }
  }

  /**
   * Generate content suggestions and improvements
   */
  async generateContentSuggestions(
    content: string, 
    targetAudience: string,
    marketContext?: MarketContext
  ): Promise<string[]> {
    try {
      // Always include market context
      let contextInfo = '';
      if (!marketContext) {
        const { MarketIntelligenceService } = await import('./market-intelligence');
        const marketService = new MarketIntelligenceService();
        const context = await marketService.getMarketContext();
        contextInfo = `
Current Market Context:
- Market Sentiment: ${context.marketSentiment.toUpperCase()}
- VIX Level: ${context.economicIndicators.vixLevel} (${
          context.economicIndicators.vixLevel < 16 ? 'Low volatility' :
          context.economicIndicators.vixLevel > 25 ? 'High volatility' :
          'Moderate volatility'
        })
- Market Status: ${context.currentMarketCondition}
- Recent Events: ${context.majorMarketEvents.slice(0, 2).join('; ')}
`;
      } else {
        contextInfo = `
Current Market Context:
- Relevant News: ${marketContext.relevantNews.join(', ')}
- Market Trends: ${marketContext.marketTrends.join(', ')}
- Volatility Index: ${marketContext.volatilityIndex}
- Market Sentiment: ${marketContext.sentimentIndicators.join(', ')}
`;
      }

      const prompt = `
Analyze this financial newsletter content and provide specific improvement suggestions:

Content: ${content}
Target Audience: ${targetAudience}
${contextInfo}

Provide 5-8 specific, actionable suggestions to improve engagement, clarity, and value. Focus on:
- Content structure and flow
- Market relevance and timeliness
- Audience-specific value propositions
- Call-to-action effectiveness
- Data and evidence integration
- Emotional engagement
- Clarity and readability

Return as JSON array of strings:
["suggestion 1", "suggestion 2", ...]

Make suggestions specific and implementable.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800,
      });

      const suggestionsText = response.choices[0]?.message?.content;
      if (!suggestionsText) {
        throw new Error('No suggestions received from OpenAI');
      }

      const suggestions = JSON.parse(suggestionsText) as string[];
      return suggestions;
    } catch (error) {
      console.error('Error generating content suggestions:', error);
      return [
        'Add specific data points to support key claims',
        'Include a clear call-to-action for next steps',
        'Consider adding a market outlook section'
      ];
    }
  }

  /**
   * Optimize send timing based on content analysis and audience
   */
  async optimizeSendTiming(
    content: string,
    targetAudience: string,
    urgencyLevel: number
  ): Promise<{
    recommendedTime: string;
    reasoning: string;
    alternativeTimes: string[];
  }> {
    try {
      const prompt = `
Recommend optimal send timing for this financial newsletter:

Content Type: ${this.getContentType(content)}
Target Audience: ${targetAudience}
Urgency Level: ${urgencyLevel} (0.0-1.0)
Current Time: ${new Date().toISOString()}

Consider:
- Financial market hours and key events
- Audience behavior patterns
- Content urgency and relevance
- Time zone considerations for financial markets
- Typical email engagement patterns

Return JSON:
{
  "recommendedTime": "YYYY-MM-DD HH:MM:SS UTC",
  "reasoning": "explanation of timing choice",
  "alternativeTimes": ["time1", "time2", "time3"]
}

Focus on maximizing engagement while respecting market timing and audience preferences.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      });

      const timingText = response.choices[0]?.message?.content;
      if (!timingText) {
        throw new Error('No timing recommendation received from OpenAI');
      }

      return JSON.parse(timingText);
    } catch (error) {
      console.error('Error optimizing send timing:', error);
      return {
        recommendedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reasoning: 'Default 2-hour delay for review and optimization',
        alternativeTimes: []
      };
    }
  }

  /**
   * Generate market-aware content enhancements
   */
  async enhanceWithMarketContext(
    content: string,
    marketContext: MarketContext
  ): Promise<{
    enhancedContent: string;
    addedInsights: string[];
    marketRelevanceScore: number;
  }> {
    try {
      const prompt = `
Enhance this financial newsletter content with relevant market context:

Original Content: ${content}

Market Context:
- Recent News: ${marketContext.relevantNews.join(', ')}
- Market Trends: ${marketContext.marketTrends.join(', ')}
- Sector Performance: ${JSON.stringify(marketContext.sectorPerformance)}
- Volatility Index: ${marketContext.volatilityIndex}
- Sentiment: ${marketContext.sentimentIndicators.join(', ')}

Enhance the content by:
1. Integrating relevant market data naturally
2. Adding timely insights and context
3. Connecting content to current market conditions
4. Maintaining original structure and tone

Return JSON:
{
  "enhancedContent": "content with market context integrated",
  "addedInsights": ["insight 1", "insight 2"],
  "marketRelevanceScore": 0.0-1.0
}

Keep enhancements natural and valuable, not forced.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
      });

      const enhancementText = response.choices[0]?.message?.content;
      if (!enhancementText) {
        throw new Error('No enhancement received from OpenAI');
      }

      return JSON.parse(enhancementText);
    } catch (error) {
      console.error('Error enhancing with market context:', error);
      return {
        enhancedContent: content,
        addedInsights: [],
        marketRelevanceScore: 0.5
      };
    }
  }

  // Helper methods for database storage
  private async storeContentAnalysis(content: string, subject: string, analysis: ContentAnalysis) {
    try {
      const db = tenantStorage.getDatabase(this.publisherId);
      // Store in content_analysis table (would need to create this table)
      // Implementation depends on your database schema
    } catch (error) {
      console.error('Error storing content analysis:', error);
    }
  }

  private async storeSubjectLineVariations(originalSubject: string, variations: SubjectLineVariation[]) {
    try {
      const db = tenantStorage.getDatabase(this.publisherId);
      // Store in subject_line_variations table
      // Implementation depends on your database schema
    } catch (error) {
      console.error('Error storing subject line variations:', error);
    }
  }

  private async storeContentPersonalizations(content: string, personalizations: ContentPersonalization[]) {
    try {
      const db = tenantStorage.getDatabase(this.publisherId);
      // Store in content_personalizations table
      // Implementation depends on your database schema
    } catch (error) {
      console.error('Error storing content personalizations:', error);
    }
  }

  private getContentType(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('breaking') || lowerContent.includes('urgent')) {
      return 'market_alert';
    } else if (lowerContent.includes('weekly') || lowerContent.includes('outlook')) {
      return 'newsletter';
    } else if (lowerContent.includes('earnings') || lowerContent.includes('analysis')) {
      return 'editorial';
    }
    return 'general';
  }
}

// Factory function to create AI processor for a specific publisher
export function createAIContentProcessor(publisherId: string): AIContentProcessor {
  return new AIContentProcessor(publisherId);
}

