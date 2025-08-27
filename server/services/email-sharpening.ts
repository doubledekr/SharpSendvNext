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
- Key Phrases: ${voiceProfile.vocabulary.keyPhrases.join(', ')}
- Personality: ${voiceProfile.personality}

ADAPTATION TARGET:
${cohortPrompts.description}`
          },
          {
            role: "user",
            content: `${cohortPrompts.instruction}

ORIGINAL SUBJECT: ${baseSubject}
ORIGINAL CONTENT: ${baseContent}

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
        description: 'Sophisticated investors requiring institutional-grade analysis',
        instruction: `Adapt for professional investors while maintaining the writer's ${voiceProfile.tone} tone:
        - Add specific metrics and technical indicators
        - Keep the writer's natural style and key phrases
        - Enhance technical depth without losing personality`
      },
      'learning-investors': {
        description: 'Beginner investors needing educational context',
        instruction: `Adapt for learning investors while maintaining the writer's ${voiceProfile.tone} tone:
        - Define technical terms simply
        - Add educational context
        - Keep the writer's authentic voice and signature phrases`
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
    const personalizedContent = extract(/PERSONALIZED_CONTENT:\s*([\s\S]+?)(?:\n\d+\.|$)/i, 'Content adapted for cohort');
    const personalizedCTA = extract(/PERSONALIZED_CTA:\s*(.+?)(?:\n|$)/i, 'Read More →');
    const reasoning = extract(/REASONING:\s*([\s\S]+?)(?:\n\d+\.|$)/i, 'Adapted for target cohort');
    
    const predictedOpenRate = extractNumber(/PREDICTED_OPEN_RATE:\s*(\d+)/i, 65);
    const predictedClickRate = extractNumber(/PREDICTED_CLICK_RATE:\s*(\d+)/i, 15);
    const optimalSendTime = extract(/OPTIMAL_SEND_TIME:\s*(.+?)(?:\n|$)/i, '09:00 AM EST');

    return {
      personalizedSubject,
      personalizedContent,
      personalizedCTA,
      reasoning,
      predictedOpenRate,
      predictedClickRate,
      optimalSendTime,
      voiceConsistencyScore: 0.87,
      preservedElements: ['writer tone', 'key phrases', 'personality']
    };
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
}