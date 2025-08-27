import OpenAI from 'openai';

interface SegmentPattern {
  id: string;
  name: string;
  description: string;
  criteria: {
    engagement?: string;
    interests?: string[];
    behavior?: string;
    tradingStyle?: string;
    riskProfile?: string;
  };
  size: number;
  growth: number;
  performance: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  autoCreated: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface TrendAnalysis {
  emergingSegments: SegmentPattern[];
  decliningSegments: string[];
  recommendations: string[];
}

export class AISegmentManager {
  private openai: OpenAI;
  private segments: SegmentPattern[] = [];
  
  constructor() {
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ 
          apiKey: process.env.OPENAI_API_KEY 
        })
      : null as any; // Will handle null checks in methods
    this.initializeDefaultSegments();
    // Start auto-detection process
    this.startTrendMonitoring();
  }

  private initializeDefaultSegments() {
    this.segments = [
      {
        id: 'day-traders',
        name: 'Day Traders',
        description: 'Active intraday traders focused on quick profits from volatility',
        criteria: {
          tradingStyle: 'intraday',
          interests: ['options', 'volatility', 'technical-analysis'],
          behavior: 'high-frequency',
          riskProfile: 'aggressive'
        },
        size: 4250,
        growth: 12,
        performance: {
          openRate: 68,
          clickRate: 42,
          conversionRate: 28
        },
        autoCreated: false,
        createdAt: new Date('2024-01-15'),
        lastUpdated: new Date()
      },
      {
        id: 'long-term-investors',
        name: 'Long-term Investors',
        description: 'Value-focused investors with 5+ year horizons',
        criteria: {
          tradingStyle: 'buy-and-hold',
          interests: ['fundamentals', 'dividends', 'value-investing'],
          behavior: 'low-frequency',
          riskProfile: 'conservative'
        },
        size: 8500,
        growth: -3,
        performance: {
          openRate: 54,
          clickRate: 31,
          conversionRate: 19
        },
        autoCreated: false,
        createdAt: new Date('2024-01-15'),
        lastUpdated: new Date()
      }
    ];
  }

  async analyzeEmergingTrends(userBehaviorData: any): Promise<TrendAnalysis> {
    try {
      const prompt = `Analyze the following user behavior data and identify emerging segments or trends:
        
        Current segments: ${JSON.stringify(this.segments.map(s => ({ name: s.name, size: s.size, growth: s.growth })))}
        
        Recent user behaviors:
        - Increased searches for: crypto, DeFi, AI stocks, renewable energy
        - High engagement with: market volatility alerts, earnings reports
        - New signups interested in: international markets, ESG investing
        
        Identify:
        1. Any emerging segments that should be auto-created
        2. Existing segments that are declining
        3. Recommendations for segment optimization
        
        Return as JSON with emergingSegments, decliningSegments, and recommendations arrays.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in financial market segmentation and subscriber behavior analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Auto-create emerging segments
      if (analysis.emergingSegments) {
        for (const segment of analysis.emergingSegments) {
          await this.autoCreateSegment(segment);
        }
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return {
        emergingSegments: [],
        decliningSegments: [],
        recommendations: []
      };
    }
  }

  async autoCreateSegment(segmentData: any): Promise<SegmentPattern> {
    const newSegment: SegmentPattern = {
      id: segmentData.id || `auto-${Date.now()}`,
      name: segmentData.name,
      description: segmentData.description,
      criteria: segmentData.criteria || {},
      size: segmentData.estimatedSize || 0,
      growth: segmentData.growthRate || 0,
      performance: {
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      },
      autoCreated: true,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.segments.push(newSegment);
    console.log(`Auto-created segment: ${newSegment.name}`);
    return newSegment;
  }

  async generateEmailVariation(segment: SegmentPattern, baseContent: string): Promise<string> {
    try {
      const prompt = `You are crafting a personalized email for the "${segment.name}" segment.
        
        Segment Description: ${segment.description}
        Segment Characteristics: ${JSON.stringify(segment.criteria)}
        
        Base Content: ${baseContent}
        
        Create a variation that:
        1. Speaks directly to this segment's interests and behaviors
        2. Uses appropriate tone and terminology
        3. Emphasizes relevant benefits and opportunities
        4. Includes segment-specific calls to action
        
        Return the personalized email content optimized for this segment.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert financial copywriter specializing in segment-specific personalization."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8
      });

      return response.choices[0].message.content || baseContent;
    } catch (error) {
      console.error('Error generating variation:', error);
      return baseContent;
    }
  }

  async updateSegmentPerformance(segmentId: string, metrics: any) {
    const segment = this.segments.find(s => s.id === segmentId);
    if (segment) {
      segment.performance = {
        ...segment.performance,
        ...metrics
      };
      segment.lastUpdated = new Date();
      
      // Check if segment should be flagged for review
      if (segment.performance.openRate < 30 || segment.growth < -10) {
        console.log(`Segment ${segment.name} flagged for review - poor performance`);
      }
    }
  }

  private startTrendMonitoring() {
    // Run trend analysis every 24 hours
    setInterval(async () => {
      console.log('Running automated trend analysis...');
      const trends = await this.analyzeEmergingTrends({});
      
      // Log recommendations
      if (trends.recommendations.length > 0) {
        console.log('AI Recommendations:', trends.recommendations);
      }
    }, 24 * 60 * 60 * 1000);
  }

  getSegments(): SegmentPattern[] {
    return this.segments;
  }

  getSegmentById(id: string): SegmentPattern | undefined {
    return this.segments.find(s => s.id === id);
  }

  async createCustomSegment(name: string, description: string, criteria: any): Promise<SegmentPattern> {
    const newSegment: SegmentPattern = {
      id: `custom-${Date.now()}`,
      name,
      description,
      criteria,
      size: 0,
      growth: 0,
      performance: {
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      },
      autoCreated: false,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.segments.push(newSegment);
    return newSegment;
  }

  async suggestSegmentImprovements(segmentId: string): Promise<string[]> {
    const segment = this.getSegmentById(segmentId);
    if (!segment) return [];

    const suggestions = [];

    // Performance-based suggestions
    if (segment.performance.openRate < 40) {
      suggestions.push("Consider testing different subject lines for this segment");
    }
    if (segment.performance.clickRate < 20) {
      suggestions.push("Review and optimize CTAs for better alignment with segment interests");
    }
    if (segment.growth < 0) {
      suggestions.push("Segment is declining - consider re-engagement campaigns or merger with similar segments");
    }

    // Size-based suggestions
    if (segment.size < 1000) {
      suggestions.push("Small segment size - consider broader criteria or merging with related segments");
    }
    if (segment.size > 10000) {
      suggestions.push("Large segment - consider sub-segmentation for more targeted messaging");
    }

    return suggestions;
  }
}

// Export singleton instance
export const segmentManager = new AISegmentManager();