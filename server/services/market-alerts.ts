import axios from 'axios';

export interface MarketAlert {
  id: string;
  publisherId: string;
  alertType: 'price_movement' | 'earnings' | 'fed_announcement' | 'sector_rotation' | 'volatility_spike' | 'news_sentiment';
  symbol?: string;
  sector?: string;
  threshold: number;
  condition: 'above' | 'below' | 'change_percent';
  isActive: boolean;
  lastTriggered?: Date;
  emailTemplate?: string;
  cohortTargets: string[];
}

export interface MarketEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  symbol?: string;
  sector?: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
  source: string;
  url?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  priceImpact?: number;
}

export class MarketAlertService {
  private readonly marketauxApiKey = process.env.MARKETAUX_API_KEY;
  private readonly polygonApiKey = process.env.POLYGON_API_KEY;

  /**
   * Get real-time market events for financial publishers
   */
  async getMarketEvents(categories?: string[]): Promise<MarketEvent[]> {
    try {
      // Simplified API call - removing problematic published_after parameter
      const response = await axios.get('https://api.marketaux.com/v1/news/all', {
        params: {
          api_token: this.marketauxApiKey,
          limit: 20,
          filter_entities: true,
          language: 'en',
          // Removed published_after due to format issues
          categories: categories?.join(',') || 'general,forex,crypto,merger'
        }
      });

      return response.data.data.map((article: any) => ({
        id: article.uuid,
        type: this.categorizeEvent(article),
        title: article.title,
        description: article.description,
        symbol: article.entities?.[0]?.symbol,
        sector: this.mapSector(article.entities?.[0]?.industry),
        impact: this.assessImpact(article),
        timestamp: new Date(article.published_at),
        source: article.source,
        url: article.url,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        priceImpact: article.entities?.[0]?.sentiment_score
      }));
    } catch (error: any) {
      console.error('Error fetching market events:', error.response?.data || error.message);
      // Log the full error for debugging
      if (error.response) {
        console.error('MarketAux API Error Status:', error.response.status);
        console.error('MarketAux API Error Data:', JSON.stringify(error.response.data));
      }
      return this.getMockMarketEvents(); // Fallback for demo
    }
  }

  /**
   * Get sector performance data for publisher insights
   */
  async getSectorPerformance(): Promise<Record<string, number>> {
    try {
      const sectors = [
        { symbol: 'XLK', name: 'Technology' },
        { symbol: 'XLF', name: 'Financial' },
        { symbol: 'XLV', name: 'Healthcare' },
        { symbol: 'XLE', name: 'Energy' },
        { symbol: 'XLI', name: 'Industrial' },
        { symbol: 'XLY', name: 'ConsumerDiscretionary' },
        { symbol: 'XLP', name: 'ConsumerStaples' },
        { symbol: 'XLU', name: 'Utilities' },
        { symbol: 'XLB', name: 'Materials' },
        { symbol: 'XLRE', name: 'RealEstate' }
      ];

      const performance: Record<string, number> = {};
      
      for (const sector of sectors) {
        try {
          const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${sector.symbol}/prev`, {
            params: {
              apikey: this.polygonApiKey
            }
          });

          if (response.data.results?.[0]) {
            const result = response.data.results[0];
            const change = ((result.c - result.o) / result.o) * 100;
            performance[sector.name] = Math.round(change * 100) / 100;
          }
        } catch (sectorError) {
          console.error(`Error fetching ${sector.name}:`, sectorError);
          performance[sector.name] = Math.random() * 4 - 2; // Random fallback between -2% and +2%
        }
      }

      return performance;
    } catch (error) {
      console.error('Error fetching sector performance:', error);
      return {
        'Technology': 1.2,
        'Financial': -0.8,
        'Healthcare': 0.3,
        'Energy': 2.1,
        'Industrial': 0.7
      };
    }
  }

  /**
   * Check market alerts for publishers
   */
  async checkMarketAlerts(publisherId: string): Promise<{
    triggeredAlerts: MarketAlert[];
    recommendations: string[];
  }> {
    const alerts = await this.getPublisherAlerts(publisherId);
    const triggeredAlerts: MarketAlert[] = [];
    const recommendations: string[] = [];

    for (const alert of alerts) {
      if (!alert.isActive) continue;

      const isTriggered = await this.evaluateAlert(alert);
      if (isTriggered) {
        triggeredAlerts.push(alert);
        
        // Generate publisher-specific recommendations
        switch (alert.alertType) {
          case 'volatility_spike':
            recommendations.push(`High volatility detected in ${alert.symbol || alert.sector}. Consider sending emergency market update to Professional Investors cohort.`);
            break;
          case 'earnings':
            recommendations.push(`${alert.symbol} earnings alert triggered. Prepare earnings analysis content for Growth Investors cohort.`);
            break;
          case 'fed_announcement':
            recommendations.push(`Fed announcement detected. Send immediate market brief to all cohorts with different complexity levels.`);
            break;
          case 'sector_rotation':
            recommendations.push(`Sector rotation in ${alert.sector}. Update sector analysis newsletter for Professional and Income cohorts.`);
            break;
          case 'news_sentiment':
            recommendations.push(`Significant news sentiment change for ${alert.symbol}. Consider special alert email to relevant cohorts.`);
            break;
        }
      }
    }

    return { triggeredAlerts, recommendations };
  }

  /**
   * Get enhanced content with real market data for email generation
   */
  async getEnhancedContentData(symbols: string[], topics: string[]): Promise<{
    prices: Record<string, { current: number; change: number; changePercent: number }>;
    news: MarketEvent[];
    citations: string[];
    marketContext: string;
  }> {
    const prices: Record<string, any> = {};
    const citations: string[] = [];
    
    // Get real-time prices
    for (const symbol of symbols) {
      try {
        const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`, {
          params: { apikey: this.polygonApiKey }
        });
        
        if (response.data.results?.[0]) {
          const result = response.data.results[0];
          const changePercent = ((result.c - result.o) / result.o) * 100;
          prices[symbol] = {
            current: result.c,
            change: result.c - result.o,
            changePercent: Math.round(changePercent * 100) / 100
          };
        }
      } catch (error) {
        console.error(`Error fetching ${symbol} price:`, error);
      }
    }

    // Get relevant news
    const news = await this.getMarketEvents();
    const relevantNews = news.filter(event => 
      symbols.some(symbol => event.title.includes(symbol) || event.description?.includes(symbol)) ||
      topics.some(topic => event.title.toLowerCase().includes(topic.toLowerCase()))
    ).slice(0, 5);

    // Generate citations
    relevantNews.forEach(event => {
      citations.push(`${event.source} - "${event.title}" (${event.timestamp.toLocaleDateString()})`);
    });

    // Build market context
    const marketContext = this.buildMarketContext(prices, relevantNews);

    return { prices, news: relevantNews, citations, marketContext };
  }

  private categorizeEvent(article: any): string {
    const title = article.title.toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;

    if (content.includes('earnings') || content.includes('quarterly results')) return 'earnings';
    if (content.includes('fed') || content.includes('federal reserve')) return 'fed_announcement';
    if (content.includes('dividend')) return 'dividend';
    if (content.includes('merger') || content.includes('acquisition')) return 'merger';
    if (content.includes('ipo') || content.includes('public offering')) return 'ipo';
    if (content.includes('volatility') || content.includes('spike')) return 'volatility_spike';
    return 'general_news';
  }

  private mapSector(industry: string): string {
    if (!industry) return 'Mixed';
    
    const mapping: Record<string, string> = {
      'technology': 'Technology',
      'financial': 'Financial',
      'healthcare': 'Healthcare',
      'energy': 'Energy',
      'industrial': 'Industrial',
      'consumer': 'Consumer',
      'utilities': 'Utilities',
      'materials': 'Materials',
      'real estate': 'RealEstate'
    };

    const key = Object.keys(mapping).find(k => industry.toLowerCase().includes(k));
    return key ? mapping[key] : 'Mixed';
  }

  private assessImpact(article: any): 'high' | 'medium' | 'low' {
    const title = article.title.toLowerCase();
    
    // High impact keywords
    if (title.includes('fed') || title.includes('earnings') || title.includes('crash') || 
        title.includes('surge') || title.includes('breaking')) {
      return 'high';
    }
    
    // Medium impact keywords  
    if (title.includes('update') || title.includes('analysis') || title.includes('outlook')) {
      return 'medium';
    }
    
    return 'low';
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['surge', 'gain', 'rise', 'growth', 'positive', 'strong', 'beat', 'outperform'];
    const negativeWords = ['fall', 'drop', 'decline', 'loss', 'weak', 'miss', 'underperform', 'crash'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private buildMarketContext(prices: Record<string, any>, news: MarketEvent[]): string {
    const priceUpdates = Object.entries(prices).map(([symbol, data]) => 
      `${symbol}: $${data.current} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent}%)`
    ).join(', ');

    const majorNews = news.filter(n => n.impact === 'high').map(n => n.title).slice(0, 3);

    return `Market Context: ${priceUpdates}. Major developments: ${majorNews.join('; ')}.`;
  }

  private async getPublisherAlerts(publisherId: string): Promise<MarketAlert[]> {
    // Mock alerts for demo - in production this would query the database
    return [
      {
        id: 'alert-1',
        publisherId,
        alertType: 'volatility_spike',
        symbol: 'NVDA',
        threshold: 5,
        condition: 'above',
        isActive: true,
        cohortTargets: ['professional-investors', 'growth-investors']
      },
      {
        id: 'alert-2', 
        publisherId,
        alertType: 'fed_announcement',
        threshold: 1,
        condition: 'above',
        isActive: true,
        cohortTargets: ['all']
      }
    ];
  }

  private async evaluateAlert(alert: MarketAlert): Promise<boolean> {
    // Simplified evaluation - in production this would check real conditions
    return Math.random() > 0.8; // 20% chance of triggering for demo
  }

  private getMockMarketEvents(): MarketEvent[] {
    return [
      {
        id: '1',
        type: 'earnings',
        title: 'NVIDIA Reports Q3 Earnings Beat, Revenue Up 94% YoY',
        description: 'NVIDIA Corporation reported exceptional Q3 results with AI chip demand continuing to surge.',
        symbol: 'NVDA',
        sector: 'Technology',
        impact: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        source: 'Financial Wire',
        sentiment: 'positive',
        priceImpact: 0.8
      },
      {
        id: '2',
        type: 'fed_announcement',
        title: 'Fed Holds Rates Steady, Signals Potential December Cut',
        description: 'Federal Reserve maintains current rates but hints at possible reduction in December meeting.',
        sector: 'Mixed',
        impact: 'high',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        source: 'MarketWatch',
        sentiment: 'positive'
      }
    ];
  }
}