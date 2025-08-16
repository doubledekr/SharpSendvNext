import fetch from 'node-fetch';

interface MarketContext {
  currentMarketCondition: string;
  majorMarketEvents: string[];
  sectorPerformance: Record<string, number>;
  economicIndicators: {
    spyPrice: number;
    vixLevel: number;
    tenYearYield: number;
  };
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
}

export class MarketIntelligenceService {
  private marketauxApiKey = process.env.MARKETAUX_API_KEY;
  private polygonApiKey = process.env.POLYGON_API_KEY;

  /**
   * Get comprehensive market context for content personalization
   */
  async getMarketContext(): Promise<MarketContext> {
    try {
      const [marketNews, marketData] = await Promise.all([
        this.getMarketNews(),
        this.getMarketData()
      ]);

      return {
        currentMarketCondition: this.assessMarketCondition(marketData),
        majorMarketEvents: marketNews.slice(0, 3),
        sectorPerformance: await this.getSectorPerformance(),
        economicIndicators: marketData,
        marketSentiment: this.calculateMarketSentiment(marketData)
      };
    } catch (error) {
      console.error('Error fetching market context:', error);
      // Return fallback market context
      return this.getFallbackMarketContext();
    }
  }

  /**
   * Fetch recent market news for context
   */
  private async getMarketNews(): Promise<string[]> {
    if (!this.marketauxApiKey) {
      return [
        'Federal Reserve maintains current interest rates',
        'Technology sector shows strong earnings growth',
        'Economic indicators suggest continued expansion'
      ];
    }

    try {
      const response = await fetch(
        `https://api.marketaux.com/v1/news/all?industries=Financial&limit=5&api_token=${this.marketauxApiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`MarketAux API error: ${response.status}`);
      }

      const data: any = await response.json();
      return data.data?.map((article: any) => article.title) || [];
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [
        'Market volatility remains elevated amid economic uncertainty',
        'Earnings season delivers mixed results across sectors',
        'Central bank policy decisions impact market sentiment'
      ];
    }
  }

  /**
   * Get current market data from Polygon
   */
  private async getMarketData(): Promise<{
    spyPrice: number;
    vixLevel: number;
    tenYearYield: number;
  }> {
    if (!this.polygonApiKey) {
      return {
        spyPrice: 485.50,
        vixLevel: 18.2,
        tenYearYield: 4.25
      };
    }

    try {
      // Get SPY price (S&P 500 ETF as market proxy)
      const spyResponse = await fetch(
        `https://api.polygon.io/v1/last/stocks/SPY?apikey=${this.polygonApiKey}`
      );
      
      const spyData: any = await spyResponse.json();
      const spyPrice = spyData.last?.price || 485.50;

      return {
        spyPrice,
        vixLevel: 18.2, // Would integrate VIX data in production
        tenYearYield: 4.25 // Would integrate Treasury data in production
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {
        spyPrice: 485.50,
        vixLevel: 18.2,
        tenYearYield: 4.25
      };
    }
  }

  /**
   * Get sector performance data
   */
  private async getSectorPerformance(): Promise<Record<string, number>> {
    // In production, this would fetch real sector ETF data
    return {
      'Technology': 2.3,
      'Healthcare': 1.1,
      'Financial Services': 0.8,
      'Consumer Discretionary': -0.5,
      'Energy': 1.7,
      'Industrial': 0.9,
      'Materials': -0.2,
      'Utilities': 0.3,
      'Real Estate': -0.8,
      'Communication Services': 1.4,
      'Consumer Staples': 0.6
    };
  }

  /**
   * Assess current market condition based on data
   */
  private assessMarketCondition(marketData: any): string {
    const { vixLevel } = marketData;
    
    if (vixLevel > 25) {
      return 'High Volatility - Uncertain Market Conditions';
    } else if (vixLevel > 20) {
      return 'Moderate Volatility - Mixed Market Sentiment';
    } else {
      return 'Low Volatility - Stable Market Environment';
    }
  }

  /**
   * Calculate overall market sentiment
   */
  private calculateMarketSentiment(marketData: any): 'bullish' | 'bearish' | 'neutral' {
    const { vixLevel } = marketData;
    
    if (vixLevel < 16) {
      return 'bullish';
    } else if (vixLevel > 25) {
      return 'bearish';
    } else {
      return 'neutral';
    }
  }

  /**
   * Provide fallback market context when APIs are unavailable
   */
  private getFallbackMarketContext(): MarketContext {
    return {
      currentMarketCondition: 'Stable Market Environment',
      majorMarketEvents: [
        'Federal Reserve maintains current interest rate policy',
        'Earnings season shows mixed results across sectors',
        'Economic indicators suggest continued growth'
      ],
      sectorPerformance: {
        'Technology': 1.5,
        'Healthcare': 0.8,
        'Financial Services': 0.5,
        'Energy': 1.2,
        'Industrial': 0.7
      },
      economicIndicators: {
        spyPrice: 485.50,
        vixLevel: 18.2,
        tenYearYield: 4.25
      },
      marketSentiment: 'neutral'
    };
  }

  /**
   * Analyze market conditions for optimal email send timing
   */
  async getOptimalSendTiming(): Promise<{
    recommendedTime: string;
    reasoning: string;
    marketFactors: string[];
  }> {
    try {
      const marketContext = await this.getMarketContext();
      
      let recommendedTime = '09:00 AM EST';
      let reasoning = 'Standard market open timing for broad audience engagement';
      const marketFactors = [];

      // Adjust timing based on market conditions
      if (marketContext.marketSentiment === 'bearish') {
        recommendedTime = '08:30 AM EST';
        reasoning = 'Earlier send during volatile conditions to reach subscribers before market anxiety peaks';
        marketFactors.push('High market volatility detected');
        marketFactors.push('Bearish sentiment requires early communication');
      } else if (marketContext.economicIndicators.vixLevel > 25) {
        recommendedTime = '08:00 AM EST';
        reasoning = 'Pre-market send during high volatility to provide guidance before trading begins';
        marketFactors.push('Elevated VIX levels indicate market stress');
      } else if (marketContext.marketSentiment === 'bullish') {
        recommendedTime = '09:30 AM EST';
        reasoning = 'Market open timing to capitalize on positive sentiment and trading activity';
        marketFactors.push('Bullish sentiment supports market open timing');
      }

      return {
        recommendedTime,
        reasoning,
        marketFactors
      };
    } catch (error) {
      console.error('Error analyzing send timing:', error);
      return {
        recommendedTime: '09:00 AM EST',
        reasoning: 'Standard market timing for financial content',
        marketFactors: ['Using default timing due to analysis error']
      };
    }
  }

  /**
   * Get content emphasis recommendations based on market conditions
   */
  async getContentEmphasisRecommendations(): Promise<{
    primaryFocus: string;
    secondaryTopics: string[];
    avoidTopics: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
  }> {
    try {
      const marketContext = await this.getMarketContext();
      
      let primaryFocus = 'Market Analysis';
      let secondaryTopics = ['Investment Opportunities', 'Economic Trends'];
      let avoidTopics: string[] = [];
      let urgencyLevel: 'low' | 'medium' | 'high' = 'medium';

      // Adjust content focus based on market conditions
      if (marketContext.marketSentiment === 'bearish') {
        primaryFocus = 'Risk Management';
        secondaryTopics = ['Defensive Strategies', 'Market Volatility', 'Portfolio Protection'];
        avoidTopics = ['Aggressive Growth', 'Speculative Investments'];
        urgencyLevel = 'high';
      } else if (marketContext.marketSentiment === 'bullish') {
        primaryFocus = 'Growth Opportunities';
        secondaryTopics = ['Sector Rotation', 'Momentum Plays', 'Market Expansion'];
        urgencyLevel = 'medium';
      }

      // Identify top performing sectors for emphasis
      const topSectors = Object.entries(marketContext.sectorPerformance)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([sector]) => sector);
      
      secondaryTopics.push(...topSectors);

      return {
        primaryFocus,
        secondaryTopics,
        avoidTopics,
        urgencyLevel
      };
    } catch (error) {
      console.error('Error getting content recommendations:', error);
      return {
        primaryFocus: 'Market Analysis',
        secondaryTopics: ['Investment Opportunities', 'Economic Trends'],
        avoidTopics: [],
        urgencyLevel: 'medium'
      };
    }
  }
}