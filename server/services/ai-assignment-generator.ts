// import { OpenAIService } from './openai'; // Will implement when needed
import { MarketIntelligenceService } from './market-intelligence';
import { CohortDetectionService } from './cohort-detection';

export interface AIAssignmentSuggestion {
  id: string;
  type: 'email_content' | 'subject_line' | 'market_analysis' | 'cohort_targeting';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetCohorts: string[];
  marketContext?: {
    trigger: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    urgency: number;
  };
  briefing: {
    instructions: string;
    keyPoints: string[];
    tone: string;
    estimatedTimeHours: number;
    requirements: Record<string, any>;
  };
  generatedAt: Date;
  expiresAt: Date;
}

export interface OneOffAssignmentRequest {
  targetCohort?: string;
  assignmentType: 'email_content' | 'subject_line' | 'email_design' | 'content_review' | 'fact_check';
  urgency: 'standard' | 'priority' | 'rush';
  customInstructions?: string;
  marketEvent?: string;
}

export class AIAssignmentGeneratorService {
  // private openaiService: OpenAIService;
  private marketService: MarketIntelligenceService;
  private cohortService: CohortDetectionService;

  constructor() {
    // this.openaiService = new OpenAIService();
    this.marketService = new MarketIntelligenceService();
    this.cohortService = new CohortDetectionService();
  }

  /**
   * Generate daily suggested assignments based on market conditions and cohort needs
   */
  async generateDailyAssignments(): Promise<AIAssignmentSuggestion[]> {
    try {
      // Get current market context
      const marketContext = await this.marketService.getMarketContext();
      
      // Get active cohorts that need content
      const cohorts = await this.cohortService.getAllCohorts();
      
      // Generate AI-powered assignment suggestions
      const suggestions: AIAssignmentSuggestion[] = [];

      // Market-triggered assignments
      if (marketContext.volatilitySpike) {
        suggestions.push(await this.generateMarketVolatilityAssignment(cohorts));
      }

      if (marketContext.majorNews && marketContext.majorNews.length > 0) {
        suggestions.push(await this.generateNewsAnalysisAssignment(marketContext.majorNews[0], cohorts));
      }

      // Cohort-specific content needs
      for (const cohort of cohorts) {
        const cohortAssignment = await this.generateCohortSpecificAssignment(cohort);
        if (cohortAssignment) {
          suggestions.push(cohortAssignment);
        }
      }

      // Seasonal/Calendar-based assignments
      const seasonalAssignment = await this.generateSeasonalAssignment();
      if (seasonalAssignment) {
        suggestions.push(seasonalAssignment);
      }

      return suggestions.sort((a, b) => this.getPriorityScore(b) - this.getPriorityScore(a));
    } catch (error) {
      console.error('Error generating daily assignments:', error);
      return [];
    }
  }

  /**
   * Generate event-inspired assignments based on specific market events
   */
  async generateEventInspiredAssignments(eventType: string, eventData: any): Promise<AIAssignmentSuggestion[]> {
    const suggestions: AIAssignmentSuggestion[] = [];

    switch (eventType) {
      case 'earnings_surprise':
        suggestions.push(await this.generateEarningsAssignment(eventData));
        break;
      case 'fed_announcement':
        suggestions.push(await this.generateFedAnnouncementAssignment(eventData));
        break;
      case 'market_crash':
        suggestions.push(await this.generateCrisisAssignment(eventData));
        break;
      case 'sector_rotation':
        suggestions.push(await this.generateSectorRotationAssignment(eventData));
        break;
    }

    return suggestions;
  }

  /**
   * Generate one-off assignment with unique link
   */
  async generateOneOffAssignment(request: OneOffAssignmentRequest): Promise<AIAssignmentSuggestion> {
    const marketContext = await this.marketService.getMarketContext();
    
    const prompt = `
    Generate a detailed assignment briefing for a financial newsletter copywriter.
    
    Assignment Type: ${request.assignmentType}
    Target Cohort: ${request.targetCohort || 'General Financial Audience'}
    Urgency: ${request.urgency}
    Custom Instructions: ${request.customInstructions || 'Standard financial content guidelines'}
    Market Event: ${request.marketEvent || 'Current market conditions'}
    
    Current Market Context:
    - S&P 500: ${marketContext.sp500?.price || 'N/A'} (${marketContext.sp500?.changePercent || 'N/A'}%)
    - VIX: ${marketContext.vix?.price || 'N/A'}
    - Key News: ${marketContext.majorNews?.[0]?.title || 'No major news'}
    
    Provide:
    1. Detailed instructions (150-250 words)
    2. 5-7 key points to cover
    3. Recommended tone (professional, urgent, educational, etc.)
    4. Estimated completion time in hours
    5. Success criteria
    `;

    // Mock response for now - integrate with OpenAI when available
    const aiResponse = { 
      content: `Generate ${request.assignmentType.replace('_', ' ')} content for ${request.targetCohort || 'financial audience'}.

Instructions:
1. Create compelling content that resonates with the target cohort
2. Use market context: ${request.marketEvent || 'current conditions'}
3. Maintain professional tone with urgency level: ${request.urgency}
4. Include data-driven insights and actionable recommendations
5. Ensure compliance with financial content guidelines

Key Points:
- Market timing and opportunity analysis
- Risk assessment and management strategies  
- Specific recommendations for the cohort
- Clear call-to-action with next steps
- Performance tracking metrics

Success Criteria:
- Engagement rate >15% improvement
- Clear value proposition delivery
- Compliance with all regulations
- Timely completion within deadline`
    };
    
    return {
      id: `oneoff_${Date.now()}`,
      type: request.assignmentType,
      title: `${request.urgency.toUpperCase()}: ${request.assignmentType.replace('_', ' ')} Assignment`,
      description: aiResponse.content.substring(0, 200) + '...',
      priority: request.urgency === 'rush' ? 'urgent' : request.urgency === 'priority' ? 'high' : 'medium',
      targetCohorts: request.targetCohort ? [request.targetCohort] : ['General'],
      marketContext: {
        trigger: request.marketEvent || 'Custom request',
        sentiment: marketContext.sp500?.changePercent > 1 ? 'bullish' : 
                  marketContext.sp500?.changePercent < -1 ? 'bearish' : 'neutral',
        urgency: request.urgency === 'rush' ? 9 : request.urgency === 'priority' ? 7 : 5
      },
      briefing: {
        instructions: aiResponse.content,
        keyPoints: this.extractKeyPoints(aiResponse.content),
        tone: this.determineTone(request),
        estimatedTimeHours: this.estimateTime(request.assignmentType, request.urgency),
        requirements: {
          wordCount: this.getWordCountRequirement(request.assignmentType),
          deadline: this.calculateDeadline(request.urgency),
          reviewRequired: request.assignmentType === 'email_content',
        }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + (request.urgency === 'rush' ? 6 : 24) * 60 * 60 * 1000)
    };
  }

  /**
   * Generate assignment based on sentiment analysis toggle
   */
  async generateSentimentBasedAssignment(
    sentimentEnabled: boolean, 
    currentSentiment: 'bullish' | 'bearish' | 'neutral'
  ): Promise<AIAssignmentSuggestion | null> {
    if (!sentimentEnabled) return null;

    const marketContext = await this.marketService.getMarketContext();
    
    const prompt = `
    The sentiment analysis system is currently ${sentimentEnabled ? 'ENABLED' : 'DISABLED'}.
    Current market sentiment: ${currentSentiment}
    
    Generate an assignment that leverages sentiment analysis to create more targeted content:
    
    When sentiment analysis is ENABLED:
    - Content adapts to real-time market emotions
    - Subject lines reflect current investor psychology  
    - Call-to-actions match sentiment-driven behaviors
    - Risk warnings adjust based on fear/greed indicators
    
    When sentiment analysis is DISABLED:
    - Content uses static, balanced messaging
    - Subject lines remain neutral and informational
    - Standard risk disclosures apply
    - No emotional triggers in content
    
    Create an assignment that demonstrates this sentiment-aware approach.
    `;

    // Mock response for now - integrate with OpenAI when available  
    const aiResponse = { 
      content: `Create ${sentimentEnabled ? 'sentiment-aware' : 'neutral'} content for ${currentSentiment} market conditions.

When Sentiment Analysis is ${sentimentEnabled ? 'ENABLED' : 'DISABLED'}:

ENABLED Features:
- Real-time emotion tracking from market data
- Dynamic subject lines based on fear/greed index
- Behavioral triggers matching investor psychology
- Risk warnings that adapt to sentiment extremes
- Content tone shifts with market volatility

DISABLED Features: 
- Static, balanced messaging approach
- Neutral subject lines focused on information
- Standard risk disclosures without emotional triggers
- Consistent tone regardless of market conditions
- Equal weight to all investment perspectives

Assignment: Create two versions of the same content - one with sentiment analysis enabled showing ${currentSentiment} adaptation, and one with neutral messaging. Demonstrate the difference in engagement potential.`
    };
    
    return {
      id: `sentiment_${Date.now()}`,
      type: 'email_content',
      title: `Sentiment-${sentimentEnabled ? 'Aware' : 'Neutral'} Content Assignment`,
      description: `Create ${currentSentiment} content using ${sentimentEnabled ? 'active' : 'disabled'} sentiment analysis`,
      priority: 'medium',
      targetCohorts: ['Sentiment-Sensitive Traders', 'Emotional Investors'],
      marketContext: {
        trigger: 'Sentiment Analysis System',
        sentiment: currentSentiment,
        urgency: 6
      },
      briefing: {
        instructions: aiResponse.content,
        keyPoints: [
          'Explain sentiment analysis impact',
          'Demonstrate content differences',
          'Show behavioral triggers',
          'Include risk considerations'
        ],
        tone: sentimentEnabled ? `${currentSentiment} and responsive` : 'balanced and neutral',
        estimatedTimeHours: 2,
        requirements: {
          sentimentEnabled,
          currentSentiment,
          compareVersions: true
        }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // Private helper methods
  private async generateMarketVolatilityAssignment(cohorts: any[]): Promise<AIAssignmentSuggestion> {
    return {
      id: `volatility_${Date.now()}`,
      type: 'email_content',
      title: 'URGENT: Market Volatility Response',
      description: 'Create immediate content addressing current market volatility',
      priority: 'urgent',
      targetCohorts: cohorts.filter(c => c.riskTolerance === 'conservative').map(c => c.name),
      marketContext: {
        trigger: 'Volatility Spike Detected',
        sentiment: 'bearish',
        urgency: 9
      },
      briefing: {
        instructions: 'Write urgent but reassuring content about market volatility. Focus on historical context and defensive strategies.',
        keyPoints: ['Historical volatility patterns', 'Defensive positioning', 'Emotional discipline', 'Opportunity in crisis'],
        tone: 'Calm but urgent',
        estimatedTimeHours: 1.5,
        requirements: { immediatePublish: true }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    };
  }

  private async generateNewsAnalysisAssignment(newsItem: any, cohorts: any[]): Promise<AIAssignmentSuggestion> {
    return {
      id: `news_${Date.now()}`,
      type: 'market_analysis',
      title: `Breaking: ${newsItem.title}`,
      description: `Analyze impact of: ${newsItem.title.substring(0, 100)}...`,
      priority: 'high',
      targetCohorts: ['Active Traders', 'News-Driven Investors'],
      briefing: {
        instructions: `Provide expert analysis of this breaking news and its market implications.`,
        keyPoints: ['Immediate impact', 'Sector implications', 'Trading opportunities', 'Risk assessment'],
        tone: 'Expert and analytical',
        estimatedTimeHours: 2,
        requirements: { newsSource: newsItem.url, publishWithin: '2 hours' }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000)
    };
  }

  private async generateCohortSpecificAssignment(cohort: any): Promise<AIAssignmentSuggestion | null> {
    // Generate assignments based on cohort characteristics
    if (cohort.engagementTrend === 'declining') {
      return {
        id: `cohort_${cohort.id}_${Date.now()}`,
        type: 'email_content',
        title: `Re-engage ${cohort.name} Cohort`,
        description: `Create compelling content to re-engage declining ${cohort.name} subscribers`,
        priority: 'medium',
        targetCohorts: [cohort.name],
        briefing: {
          instructions: `Create re-engagement content specifically for ${cohort.name} cohort members who have shown declining engagement.`,
          keyPoints: ['Value proposition refresh', 'Exclusive insights', 'Personal success stories', 'Clear next steps'],
          tone: 'Personal and valuable',
          estimatedTimeHours: 3,
          requirements: { cohortSpecific: true, engagementFocus: true }
        },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };
    }
    return null;
  }

  private async generateSeasonalAssignment(): Promise<AIAssignmentSuggestion | null> {
    const month = new Date().getMonth();
    const season = this.getCurrentSeason(month);
    
    if (season) {
      return {
        id: `seasonal_${Date.now()}`,
        type: 'email_content',
        title: `${season} Investment Strategy`,
        description: `Create seasonal content focused on ${season} investment themes`,
        priority: 'low',
        targetCohorts: ['Long-term Investors', 'Strategic Planners'],
        briefing: {
          instructions: `Develop content around ${season} investment themes and market patterns.`,
          keyPoints: ['Seasonal trends', 'Historical patterns', 'Strategic positioning', 'Risk management'],
          tone: 'Educational and strategic',
          estimatedTimeHours: 4,
          requirements: { seasonal: season, dataBackedClaims: true }
        },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
      };
    }
    return null;
  }

  private async generateEarningsAssignment(eventData: any): Promise<AIAssignmentSuggestion> {
    return {
      id: `earnings_${Date.now()}`,
      type: 'email_content',
      title: `Earnings Alert: ${eventData.company}`,
      description: `Cover surprise earnings from ${eventData.company}`,
      priority: 'high',
      targetCohorts: ['Earnings Traders', 'Growth Investors'],
      briefing: {
        instructions: 'Create immediate analysis of earnings surprise and trading implications.',
        keyPoints: ['Earnings highlights', 'Guidance changes', 'Sector impact', 'Trading setup'],
        tone: 'Analytical and actionable',
        estimatedTimeHours: 1,
        requirements: { realTimeData: true }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    };
  }

  private async generateFedAnnouncementAssignment(eventData: any): Promise<AIAssignmentSuggestion> {
    return {
      id: `fed_${Date.now()}`,
      type: 'market_analysis',
      title: 'Fed Decision Analysis',
      description: 'Comprehensive analysis of Federal Reserve announcement',
      priority: 'urgent',
      targetCohorts: ['Macro Investors', 'Bond Traders', 'Rate-Sensitive Investors'],
      briefing: {
        instructions: 'Provide expert analysis of Fed decision and market implications across asset classes.',
        keyPoints: ['Rate decision rationale', 'Forward guidance', 'Market reactions', 'Portfolio implications'],
        tone: 'Authoritative and comprehensive',
        estimatedTimeHours: 2,
        requirements: { fedData: eventData, crossAssetAnalysis: true }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000)
    };
  }

  private async generateCrisisAssignment(eventData: any): Promise<AIAssignmentSuggestion> {
    return {
      id: `crisis_${Date.now()}`,
      type: 'email_content',
      title: 'Crisis Response: Market Stability Guide',
      description: 'Emergency content to address market crisis and subscriber concerns',
      priority: 'urgent',
      targetCohorts: ['All Subscribers'],
      briefing: {
        instructions: 'Create calming but realistic crisis response content with actionable guidance.',
        keyPoints: ['Historical context', 'Immediate actions', 'Long-term perspective', 'Risk management'],
        tone: 'Calm, authoritative, reassuring',
        estimatedTimeHours: 1,
        requirements: { emergencyPublish: true, legalReview: true }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000)
    };
  }

  private async generateSectorRotationAssignment(eventData: any): Promise<AIAssignmentSuggestion> {
    return {
      id: `sector_${Date.now()}`,
      type: 'market_analysis',
      title: `Sector Rotation: ${eventData.fromSector} → ${eventData.toSector}`,
      description: `Analysis of rotation from ${eventData.fromSector} to ${eventData.toSector}`,
      priority: 'medium',
      targetCohorts: ['Sector Traders', 'Rotation Strategists'],
      briefing: {
        instructions: 'Analyze current sector rotation and provide actionable trading strategies.',
        keyPoints: ['Rotation drivers', 'Sector winners/losers', 'Timing considerations', 'ETF plays'],
        tone: 'Strategic and tactical',
        estimatedTimeHours: 3,
        requirements: { sectorData: eventData, backtesting: true }
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  private getPriorityScore(suggestion: AIAssignmentSuggestion): number {
    const scores = { urgent: 4, high: 3, medium: 2, low: 1 };
    return scores[suggestion.priority];
  }

  private extractKeyPoints(content: string): string[] {
    // Simple extraction - in production, use NLP
    const points = content.match(/\d+\.\s+([^.!?]+[.!?])/g) || [];
    return points.slice(0, 7).map(p => p.replace(/^\d+\.\s+/, ''));
  }

  private determineTone(request: OneOffAssignmentRequest): string {
    if (request.urgency === 'rush') return 'Urgent and direct';
    if (request.urgency === 'priority') return 'Professional and focused';
    return 'Educational and thorough';
  }

  private estimateTime(type: string, urgency: string): number {
    const baseHours = {
      email_content: 3,
      subject_line: 0.5,
      email_design: 4,
      content_review: 1,
      fact_check: 2
    };
    
    const urgencyMultiplier = urgency === 'rush' ? 0.7 : urgency === 'priority' ? 0.8 : 1;
    return (baseHours[type as keyof typeof baseHours] || 2) * urgencyMultiplier;
  }

  private getWordCountRequirement(type: string): number {
    const requirements = {
      email_content: 800,
      subject_line: 10,
      email_design: 200,
      content_review: 300,
      fact_check: 500
    };
    return requirements[type as keyof typeof requirements] || 400;
  }

  private calculateDeadline(urgency: string): string {
    const hours = urgency === 'rush' ? 6 : urgency === 'priority' ? 24 : 72;
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }

  private getCurrentSeason(month: number): string | null {
    if (month === 11 || month <= 1) return 'Year-End Tax Planning';
    if (month >= 2 && month <= 4) return 'Q1 Earnings Season';
    if (month >= 5 && month <= 7) return 'Summer Trading Lull';
    if (month >= 8 && month <= 10) return 'Fall Market Volatility';
    return null;
  }
}