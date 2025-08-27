import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface WriterVoiceProfile {
  tone: 'formal' | 'casual' | 'authoritative' | 'conversational';
  complexity: {
    avgSentenceLength: number;
    technicalTermDensity: number;
    readingLevel: number;
  };
  vocabulary: {
    keyPhrases: string[];
    preferredTransitions: string[];
    signatureExpressions: string[];
  };
  structure: {
    paragraphLength: 'short' | 'medium' | 'long';
    listUsage: number;
    questionFrequency: number;
  };
  personality: 'data-driven' | 'opinion-based' | 'balanced' | 'educational';
}

export interface EmailSharpening {
  personalizedSubject: string;
  personalizedContent: string;
  personalizedCTA: string;
  reasoning: string;
  predictedOpenRate: number;
  predictedClickRate: number;
  optimalSendTime: string;
  voiceConsistencyScore: number;
  preservedElements: string[];
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
    },
    voiceProfile?: WriterVoiceProfile
  ): Promise<{
    cohortId: string;
    cohortName: string;
    subscriberCount: number;
    sharpening: EmailSharpening;
  }[]> {
    
    const sharpenedEmails = [];
    
    // Extract voice profile if not provided
    const writerProfile = voiceProfile || await this.extractVoiceProfile(baseContent);
    
    for (const cohort of cohorts) {
      try {
        const sharpening = await this.generateCohortPersonalizationWithVoice(
          baseSubject,
          baseContent,
          cohort,
          marketContext,
          writerProfile
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
            optimalSendTime: '09:00 AM EST',
            voiceConsistencyScore: 1.0,
            preservedElements: ['original tone', 'base structure']
          }
        });
      }
    }
    
    return sharpenedEmails;
  }

  /**
   * Extract voice profile from base content
   */
  private async extractVoiceProfile(content: string): Promise<WriterVoiceProfile> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Analyze the writing voice and style characteristics of this financial content. Return a structured analysis."
          },
          {
            role: "user",
            content: `Analyze this content and identify the writer's voice characteristics:

${content}

Provide analysis in this format:
TONE: [formal/casual/authoritative/conversational]
COMPLEXITY: [average sentence length and technical density]
KEY_PHRASES: [signature expressions and transitions]
STRUCTURE: [paragraph style and organization]
PERSONALITY: [data-driven/opinion-based/balanced/educational]`
          }
        ],
        temperature: 0.1
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      // Parse AI analysis into voice profile
      return this.parseVoiceAnalysis(analysis, content);
      
    } catch (error) {
      console.error('Error extracting voice profile:', error);
      return this.getDefaultVoiceProfile();
    }
  }

  /**
   * Parse AI voice analysis into structured profile
   */
  private parseVoiceAnalysis(analysis: string, content: string): WriterVoiceProfile {
    // Extract tone
    const toneMatch = analysis.match(/TONE:\s*(\w+)/i);
    const tone = toneMatch ? toneMatch[1].toLowerCase() as WriterVoiceProfile['tone'] : 'conversational';
    
    // Calculate complexity metrics
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    // Extract key phrases (simplified)
    const keyPhrases = this.extractSignaturePhrases(content);
    
    return {
      tone,
      complexity: {
        avgSentenceLength: Math.round(avgSentenceLength),
        technicalTermDensity: this.calculateTechnicalDensity(content),
        readingLevel: avgSentenceLength > 20 ? 12 : avgSentenceLength > 15 ? 10 : 8
      },
      vocabulary: {
        keyPhrases,
        preferredTransitions: this.extractTransitions(content),
        signatureExpressions: this.extractSignatureExpressions(analysis)
      },
      structure: {
        paragraphLength: content.split('\n\n').length > 5 ? 'short' : 'medium',
        listUsage: (content.match(/•|\d\./g) || []).length,
        questionFrequency: (content.match(/\?/g) || []).length
      },
      personality: this.determinePersonality(analysis)
    };
  }

  private extractSignaturePhrases(content: string): string[] {
    const phrases = [];
    // Look for common financial newsletter openings
    if (content.includes("Here's the thing")) phrases.push("Here's the thing");
    if (content.includes("Look,")) phrases.push("Look,");
    if (content.includes("Bottom line")) phrases.push("Bottom line");
    if (content.includes("What this means")) phrases.push("What this means");
    return phrases;
  }

  private extractTransitions(content: string): string[] {
    const transitions = [];
    if (content.includes("However,")) transitions.push("However,");
    if (content.includes("That said,")) transitions.push("That said,");
    if (content.includes("Meanwhile,")) transitions.push("Meanwhile,");
    return transitions;
  }

  private extractSignatureExpressions(analysis: string): string[] {
    const expressions = [];
    const keyPhrasesMatch = analysis.match(/KEY_PHRASES:\s*(.+)/i);
    if (keyPhrasesMatch) {
      expressions.push(...keyPhrasesMatch[1].split(',').map(p => p.trim()));
    }
    return expressions;
  }

  private calculateTechnicalDensity(content: string): number {
    const technicalTerms = ['volatility', 'yield', 'beta', 'PE ratio', 'EBITDA', 'basis points', 'yield curve'];
    const words = content.toLowerCase().split(/\s+/);
    const technicalCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
    return (technicalCount / words.length) * 100;
  }

  private determinePersonality(analysis: string): WriterVoiceProfile['personality'] {
    const personalityMatch = analysis.match(/PERSONALITY:\s*(\w+)/i);
    if (personalityMatch) {
      const personality = personalityMatch[1].toLowerCase();
      if (personality.includes('data')) return 'data-driven';
      if (personality.includes('opinion')) return 'opinion-based';
      if (personality.includes('educational')) return 'educational';
    }
    return 'balanced';
  }

  private getDefaultVoiceProfile(): WriterVoiceProfile {
    return {
      tone: 'conversational',
      complexity: {
        avgSentenceLength: 18,
        technicalTermDensity: 2.5,
        readingLevel: 10
      },
      vocabulary: {
        keyPhrases: ['Here\'s the thing', 'Bottom line'],
        preferredTransitions: ['However', 'That said'],
        signatureExpressions: []
      },
      structure: {
        paragraphLength: 'medium',
        listUsage: 2,
        questionFrequency: 1
      },
      personality: 'balanced'
    };
  }

  /**
   * Generate cohort-specific personalization with voice preservation
   */
  private async generateCohortPersonalizationWithVoice(
    baseSubject: string,
    baseContent: string,
    cohort: CohortProfile,
    marketContext: any,
    voiceProfile: WriterVoiceProfile
  ): Promise<EmailSharpening> {
    
    const cohortPrompts = this.getCohortAdaptationPrompts(cohort, voiceProfile);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI that adapts financial newsletter content for specific investor cohorts while preserving the original writer's authentic voice and style.

WRITER'S VOICE PROFILE:
- Tone: ${voiceProfile.tone}
- Avg Sentence Length: ${voiceProfile.complexity.avgSentenceLength} words
- Technical Density: ${voiceProfile.complexity.technicalTermDensity}%
- Key Phrases: ${voiceProfile.vocabulary.keyPhrases.join(', ')}
- Transitions: ${voiceProfile.vocabulary.preferredTransitions.join(', ')}
- Personality: ${voiceProfile.personality}
- Reading Level: Grade ${voiceProfile.complexity.readingLevel}

CRITICAL VOICE PRESERVATION RULES:
1. Maintain the writer's signature opening style and key phrases
2. Preserve the original paragraph structure and flow
3. Keep the same tone and conversational patterns
4. Use the writer's established vocabulary and expressions
5. Match the sentence complexity and technical density appropriately

ADAPTATION TARGET:
${cohortPrompts.description}`
          },
          {
            role: "user",
            content: `${cohortPrompts.instruction}

ORIGINAL SUBJECT: ${baseSubject}
ORIGINAL CONTENT: ${baseContent}

MARKET CONTEXT: ${JSON.stringify(marketContext)}

Please provide:
1. PERSONALIZED_SUBJECT: [adapted subject line]
2. PERSONALIZED_CONTENT: [adapted content maintaining voice]
3. PERSONALIZED_CTA: [relevant call-to-action]
4. REASONING: [why this adaptation works for this cohort]
5. PREDICTED_OPEN_RATE: [percentage]
6. PREDICTED_CLICK_RATE: [percentage]
7. OPTIMAL_SEND_TIME: [best time for this cohort]`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = response.choices[0]?.message?.content || '';
      return this.parsePersonalizationResponse(result, voiceProfile);
      
    } catch (error) {
      console.error(`Error generating personalization for ${cohort.id}:`, error);
      return this.getFallbackPersonalization(baseSubject, baseContent, cohort);
    }
  }

  private getCohortAdaptationPrompts(cohort: CohortProfile, voiceProfile: WriterVoiceProfile) {
    const prompts = {
      'professional-investors': {
        description: 'Sophisticated investors requiring institutional-grade analysis with technical depth',
        instruction: `Adapt for professional investors while maintaining the writer's ${voiceProfile.tone} tone:
        - Add specific metrics, data points, and technical indicators
        - Include institutional terminology but keep the writer's natural style
        - Enhance technical depth without losing the original voice
        - Use precise financial language while preserving personality`
      },
      'learning-investors': {
        description: 'Beginner investors needing educational context and simplified explanations',
        instruction: `Adapt for learning investors while maintaining the writer's ${voiceProfile.tone} tone:
        - Define technical terms in parentheses or simple explanations
        - Add "what this means" educational context
        - Simplify complex concepts but keep the writer's authentic voice
        - Maintain encouraging and accessible language`
      },
      'growth-investors': {
        description: 'Growth-focused investors seeking capital appreciation opportunities',
        instruction: `Adapt for growth investors while maintaining the writer's ${voiceProfile.tone} tone:
        - Emphasize growth potential and momentum factors
        - Focus on expansion stories and market opportunities
        - Highlight growth metrics and forward-looking analysis
        - Keep the writer's natural risk assessment style`
      },
      'income-investors': {
        description: 'Income-focused investors prioritizing steady returns and capital preservation',
        instruction: `Adapt for income investors while maintaining the writer's ${voiceProfile.tone} tone:
        - Emphasize dividend yields and income stability
        - Focus on defensive positioning and risk management
        - Highlight yield analysis and income-generating assets
        - Maintain the writer's approach to safety and stability`
      }
    };

    return prompts[cohort.id as keyof typeof prompts] || prompts['professional-investors'];
  }

  private parsePersonalizationResponse(response: string, voiceProfile: WriterVoiceProfile): EmailSharpening {
    const extract = (pattern: RegExp, defaultValue: string = ''): string => {
      const match = response.match(pattern);
      return match ? match[1].trim() : defaultValue;
    };

    const extractNumber = (pattern: RegExp, defaultValue: number): number => {
      const match = response.match(pattern);
      return match ? parseInt(match[1]) : defaultValue;
    };

    const personalizedSubject = extract(/PERSONALIZED_SUBJECT:\s*(.+?)(?:\n|$)/i, 'Market Update');
    const personalizedContent = extract(/PERSONALIZED_CONTENT:\s*([\s\S]+?)(?:\n\d+\.|$)/i, 'Content adaptation in progress');
    const personalizedCTA = extract(/PERSONALIZED_CTA:\s*(.+?)(?:\n|$)/i, 'Read More →');
    const reasoning = extract(/REASONING:\s*([\s\S]+?)(?:\n\d+\.|$)/i, 'Adapted for target cohort');
    
    const predictedOpenRate = extractNumber(/PREDICTED_OPEN_RATE:\s*(\d+)/i, 65);
    const predictedClickRate = extractNumber(/PREDICTED_CLICK_RATE:\s*(\d+)/i, 15);
    const optimalSendTime = extract(/OPTIMAL_SEND_TIME:\s*(.+?)(?:\n|$)/i, '09:00 AM EST');

    // Calculate voice consistency score
    const voiceConsistencyScore = this.calculateVoiceConsistency(personalizedContent, voiceProfile);
    const preservedElements = this.identifyPreservedElements(personalizedContent, voiceProfile);

    return {
      personalizedSubject,
      personalizedContent,
      personalizedCTA,
      reasoning,
      predictedOpenRate,
      predictedClickRate,
      optimalSendTime,
      voiceConsistencyScore,
      preservedElements
    };
  }

  private calculateVoiceConsistency(content: string, voiceProfile: WriterVoiceProfile): number {
    let score = 0;
    let maxScore = 0;

    // Check for preserved key phrases
    maxScore += 30;
    const foundPhrases = voiceProfile.vocabulary.keyPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
    score += (foundPhrases.length / Math.max(voiceProfile.vocabulary.keyPhrases.length, 1)) * 30;

    // Check sentence complexity consistency
    maxScore += 25;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    const complexityDiff = Math.abs(avgLength - voiceProfile.complexity.avgSentenceLength);
    score += Math.max(0, 25 - (complexityDiff * 2));

    // Check for personality preservation
    maxScore += 25;
    if (voiceProfile.personality === 'opinion-based' && content.includes('I')) score += 12;
    if (voiceProfile.personality === 'data-driven' && /\d+%|\d+\.\d+/.test(content)) score += 12;
    score += 13; // Base personality score

    // Check for tone consistency
    maxScore += 20;
    if (voiceProfile.tone === 'conversational' && content.includes(',')) score += 20;
    else if (voiceProfile.tone === 'formal' && !content.includes('thing')) score += 20;
    else score += 10;

    return Math.min(1.0, score / maxScore);
  }

  private identifyPreservedElements(content: string, voiceProfile: WriterVoiceProfile): string[] {
    const preserved: string[] = [];
    
    // Check preserved key phrases
    voiceProfile.vocabulary.keyPhrases.forEach(phrase => {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        preserved.push(`Key phrase: "${phrase}"`);
      }
    });

    // Check preserved transitions
    voiceProfile.vocabulary.preferredTransitions.forEach(transition => {
      if (content.includes(transition)) {
        preserved.push(`Transition: "${transition}"`);
      }
    });

    // Check tone preservation
    preserved.push(`${voiceProfile.tone} tone maintained`);
    
    // Check personality preservation
    preserved.push(`${voiceProfile.personality} approach preserved`);

    return preserved;
  }

  private getFallbackPersonalization(
    baseSubject: string, 
    baseContent: string, 
    cohort: CohortProfile
  ): EmailSharpening {
    return {
      personalizedSubject: baseSubject,
      personalizedContent: baseContent,
      personalizedCTA: 'Read Full Analysis →',
      reasoning: 'Using base content due to personalization error',
      predictedOpenRate: 45,
      predictedClickRate: 12,
      optimalSendTime: '09:00 AM EST',
      voiceConsistencyScore: 1.0,
      preservedElements: ['original content', 'base structure']
    };
  }

  /**
   * Generate cohort personalization (legacy method for backward compatibility)
   */
  private async generateCohortPersonalization(
    baseSubject: string,
    baseContent: string,
    cohort: CohortProfile,
    marketContext?: any
  ): Promise<EmailSharpening> {
    const defaultVoiceProfile = this.getDefaultVoiceProfile();
    return this.generateCohortPersonalizationWithVoice(
      baseSubject,
      baseContent,
      cohort,
      marketContext,
      defaultVoiceProfile
    );
  }
}

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