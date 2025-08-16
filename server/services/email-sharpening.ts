import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailSharpening {
  personalizedSubject: string;
  personalizedContent: string;
  personalizedCTA: string;
  reasoning: string;
  predictedOpenRate: number;
  predictedClickRate: number;
  optimalSendTime: string;
}

export interface CohortProfile {
  id: string;
  name: string;
  characteristics: string[];
  investmentSophistication: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentStyle: 'value' | 'growth' | 'income' | 'trading';
  preferredContentTypes: string[];
  avgEngagementScore: number;
}

export class EmailSharpeningService {
  
  /**
   * Sharpen email content for specific subscriber cohorts
   */
  async sharpenEmailForCohorts(
    baseSubject: string,
    baseContent: string,
    cohorts: CohortProfile[],
    marketContext?: {
      currentMarketCondition: string;
      majorMarketEvents: string[];
      sectorPerformance: Record<string, number>;
    }
  ): Promise<{
    cohortId: string;
    cohortName: string;
    subscriberCount: number;
    sharpening: EmailSharpening;
  }[]> {
    
    const sharpenedEmails = [];
    
    for (const cohort of cohorts) {
      try {
        const sharpening = await this.generateCohortPersonalization(
          baseSubject,
          baseContent,
          cohort,
          marketContext
        );
        
        sharpenedEmails.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          subscriberCount: 0, // This would be populated from actual cohort data
          sharpening
        });
      } catch (error) {
        console.error(`Error sharpening email for cohort ${cohort.id}:`, error);
        // Fallback to base content
        sharpenedEmails.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          subscriberCount: 0,
          sharpening: {
            personalizedSubject: baseSubject,
            personalizedContent: baseContent,
            personalizedCTA: 'Read Full Analysis →',
            reasoning: 'Using base content due to personalization error',
            predictedOpenRate: 35,
            predictedClickRate: 8,
            optimalSendTime: '09:00 AM EST'
          }
        });
      }
    }
    
    return sharpenedEmails;
  }

  /**
   * Generate personalized email content for a specific cohort
   */
  private async generateCohortPersonalization(
    baseSubject: string,
    baseContent: string,
    cohort: CohortProfile,
    marketContext?: any
  ): Promise<EmailSharpening> {
    
    const prompt = this.buildPersonalizationPrompt(baseSubject, baseContent, cohort, marketContext);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert financial content personalization AI for SharpSend, specializing in creating precisely targeted financial newsletter content for different investor cohorts. Your role is to "sharpen" email content by adapting it to specific subscriber characteristics while maintaining analytical accuracy and editorial integrity.

Key Principles:
1. Maintain factual accuracy and regulatory compliance
2. Adapt complexity and presentation to match subscriber sophistication
3. Emphasize content most relevant to the cohort's investment approach
4. Optimize subject lines for engagement without being clickbait
5. Provide actionable insights appropriate to the cohort's risk tolerance and investment style

Always respond with valid JSON containing the required fields.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const personalization = JSON.parse(content);
      
      // Validate required fields
      if (!personalization.personalizedSubject || !personalization.personalizedContent) {
        throw new Error('Invalid personalization response format');
      }

      return {
        personalizedSubject: personalization.personalizedSubject,
        personalizedContent: personalization.personalizedContent,
        personalizedCTA: personalization.personalizedCTA || 'Learn More →',
        reasoning: personalization.reasoning || 'Personalized for cohort characteristics',
        predictedOpenRate: personalization.predictedOpenRate || this.estimateOpenRate(cohort),
        predictedClickRate: personalization.predictedClickRate || this.estimateClickRate(cohort),
        optimalSendTime: personalization.optimalSendTime || this.determineOptimalSendTime(cohort)
      };

    } catch (error) {
      console.error('Error in AI personalization:', error);
      throw error;
    }
  }

  /**
   * Build personalization prompt for AI
   */
  private buildPersonalizationPrompt(
    baseSubject: string,
    baseContent: string,
    cohort: CohortProfile,
    marketContext?: any
  ): string {
    const marketInfo = marketContext ? `
Current Market Context:
- Market Condition: ${marketContext.currentMarketCondition}
- Major Events: ${marketContext.majorMarketEvents?.join(', ') || 'None'}
- Sector Performance: ${JSON.stringify(marketContext.sectorPerformance || {})}
` : '';

    return `
Please personalize the following financial newsletter content for the specified subscriber cohort:

ORIGINAL EMAIL:
Subject: ${baseSubject}
Content: ${baseContent}

TARGET COHORT PROFILE:
- Name: ${cohort.name}
- Investment Sophistication: ${cohort.investmentSophistication}
- Risk Tolerance: ${cohort.riskTolerance}
- Investment Style: ${cohort.investmentStyle}
- Preferred Content: ${cohort.preferredContentTypes.join(', ')}
- Characteristics: ${cohort.characteristics.join(', ')}
- Average Engagement Score: ${cohort.avgEngagementScore}/10

${marketInfo}

PERSONALIZATION REQUIREMENTS:
1. Adapt the subject line to resonate with this cohort's interests and sophistication level
2. Modify the content to emphasize aspects most relevant to their investment style and risk tolerance
3. Adjust the complexity and technical depth to match their sophistication level
4. Create a compelling call-to-action that aligns with their preferred engagement style
5. Provide reasoning for the personalization choices
6. Estimate engagement metrics based on cohort characteristics

Please respond with a JSON object containing these fields:
{
  "personalizedSubject": "string",
  "personalizedContent": "string", 
  "personalizedCTA": "string",
  "reasoning": "string explaining personalization strategy",
  "predictedOpenRate": number,
  "predictedClickRate": number,
  "optimalSendTime": "string in format 'HH:MM AM/PM EST'"
}

Focus on creating content that cuts through inbox noise and delivers maximum value to this specific cohort.
`;
  }

  /**
   * Estimate open rate based on cohort characteristics
   */
  private estimateOpenRate(cohort: CohortProfile): number {
    let baseRate = 35;
    
    // Adjust based on sophistication
    if (cohort.investmentSophistication === 'professional') baseRate += 15;
    else if (cohort.investmentSophistication === 'advanced') baseRate += 10;
    else if (cohort.investmentSophistication === 'beginner') baseRate += 5;
    
    // Adjust based on engagement score
    baseRate += (cohort.avgEngagementScore - 5) * 2;
    
    // Adjust based on investment style
    if (cohort.investmentStyle === 'trading') baseRate += 8; // Traders check emails frequently
    else if (cohort.investmentStyle === 'income') baseRate -= 5; // More patient investors
    
    return Math.min(85, Math.max(15, baseRate));
  }

  /**
   * Estimate click rate based on cohort characteristics
   */
  private estimateClickRate(cohort: CohortProfile): number {
    let baseRate = 8;
    
    // Higher sophistication tends to engage more deeply
    if (cohort.investmentSophistication === 'professional') baseRate += 8;
    else if (cohort.investmentSophistication === 'advanced') baseRate += 5;
    
    // Adjust based on investment style
    if (cohort.investmentStyle === 'trading') baseRate += 5;
    else if (cohort.investmentStyle === 'growth') baseRate += 3;
    
    // Engagement score impact
    baseRate += (cohort.avgEngagementScore - 5) * 1.5;
    
    return Math.min(45, Math.max(2, baseRate));
  }

  /**
   * Determine optimal send time based on cohort characteristics
   */
  private determineOptimalSendTime(cohort: CohortProfile): string {
    // Professional investors often check emails early
    if (cohort.investmentSophistication === 'professional') {
      return '07:30 AM EST';
    }
    
    // Traders prefer pre-market hours
    if (cohort.investmentStyle === 'trading') {
      return '08:00 AM EST';
    }
    
    // Conservative investors prefer standard business hours
    if (cohort.riskTolerance === 'conservative') {
      return '10:00 AM EST';
    }
    
    // Default for most cohorts
    return '09:00 AM EST';
  }

  /**
   * Analyze email performance and provide optimization recommendations
   */
  async analyzeEmailPerformance(
    campaignId: string,
    cohortPerformance: {
      cohortId: string;
      sent: number;
      opened: number;
      clicked: number;
      unsubscribed: number;
    }[]
  ): Promise<{
    overallPerformance: {
      avgOpenRate: number;
      avgClickRate: number;
      unsubscribeRate: number;
    };
    cohortAnalysis: {
      cohortId: string;
      performance: 'excellent' | 'good' | 'average' | 'poor';
      recommendations: string[];
    }[];
    optimizationInsights: string[];
  }> {
    
    const totalSent = cohortPerformance.reduce((sum, c) => sum + c.sent, 0);
    const totalOpened = cohortPerformance.reduce((sum, c) => sum + c.opened, 0);
    const totalClicked = cohortPerformance.reduce((sum, c) => sum + c.clicked, 0);
    const totalUnsubscribed = cohortPerformance.reduce((sum, c) => sum + c.unsubscribed, 0);

    const overallPerformance = {
      avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0
    };

    const cohortAnalysis = cohortPerformance.map(cohort => {
      const openRate = cohort.sent > 0 ? (cohort.opened / cohort.sent) * 100 : 0;
      const clickRate = cohort.sent > 0 ? (cohort.clicked / cohort.sent) * 100 : 0;
      
      let performance: 'excellent' | 'good' | 'average' | 'poor';
      let recommendations: string[] = [];

      if (openRate > 50 && clickRate > 15) {
        performance = 'excellent';
        recommendations.push('Maintain current personalization strategy');
        recommendations.push('Consider this as a template for similar cohorts');
      } else if (openRate > 35 && clickRate > 8) {
        performance = 'good';
        recommendations.push('Test subject line variations for higher open rates');
        recommendations.push('Optimize call-to-action placement and wording');
      } else if (openRate > 20 && clickRate > 4) {
        performance = 'average';
        recommendations.push('Increase personalization depth');
        recommendations.push('Review content relevance to cohort interests');
        recommendations.push('Test different send times');
      } else {
        performance = 'poor';
        recommendations.push('Reassess cohort characteristics and preferences');
        recommendations.push('Implement re-engagement campaign');
        recommendations.push('Review unsubscribe feedback for insights');
      }

      return {
        cohortId: cohort.cohortId,
        performance,
        recommendations
      };
    });

    const optimizationInsights = [
      'Successful cohorts show strong preference for personalized subject lines',
      'Technical analysis content performs best with trading-focused cohorts',
      'Educational content drives higher engagement among beginner investors',
      'Professional cohorts respond well to data-rich, comprehensive analysis'
    ];

    return {
      overallPerformance,
      cohortAnalysis,
      optimizationInsights
    };
  }
}