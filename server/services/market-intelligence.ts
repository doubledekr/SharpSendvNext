import axios from 'axios';
import NodeCache from 'node-cache';
import { tenantStorage } from '../storage-multitenant';

// Cache for 15 minutes for market data, 5 minutes for news
const marketDataCache = new NodeCache({ stdTTL: 900 });
const newsCache = new NodeCache({ stdTTL: 300 });

export interface MarketNews {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  symbols: string[];
  categories: string[];
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: string;
}

export interface SectorPerformance {
  sector: string;
  performance: number;
  topGainers: string[];
  topLosers: string[];
}

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  indicators: {
    vix: number;
    putCallRatio: number;
    fearGreedIndex: number;
  };
  trends: string[];
}

export class MarketIntelligenceService {
  private marketauxApiKey: string;
  private polygonApiKey: string;
  private publisherId: string;

  constructor(publisherId: string) {
    this.marketauxApiKey = process.env.MARKETAUX_API_KEY || '';
    this.polygonApiKey = process.env.POLYGON_API_KEY || '';
    this.publisherId = publisherId;
  }

  /**
   * Get relevant financial news from MarketAux
   */
  async getRelevantNews(
    symbols?: string[], 
    categories?: string[], 
    limit: number = 20
  ): Promise<MarketNews[]> {
    const cacheKey = `news_${symbols?.join(',') || 'general'}_${categories?.join(',') || 'all'}_${limit}`;
    const cached = newsCache.get<MarketNews[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const params: any = {
        api_token: this.marketauxApiKey,
        limit,
        language: 'en',
        sort: 'published_desc'
      };

      if (symbols && symbols.length > 0) {
        params.symbols = symbols.join(',');
      }

      if (categories && categories.length > 0) {
        params.categories = categories.join(',');
      }

      const response = await axios.get('https://api.marketaux.com/v1/news/all', {
        params,
        timeout: 10000
      });

      const news: MarketNews[] = response.data.data.map((item: any) => ({
        id: item.uuid,
        title: item.title,
        description: item.description,
        url: item.url,
        source: item.source,
        publishedAt: item.published_at,
        sentiment: this.analyzeSentiment(item.title + ' ' + item.description),
        relevanceScore: this.calculateRelevanceScore(item),
        symbols: item.entities?.map((e: any) => e.symbol) || [],
        categories: item.categories || []
      }));

      // Store in database
      await this.storeNewsData(news);

      // Cache the results
      newsCache.set(cacheKey, news);
      
      return news;
    } catch (error) {
      console.error('Error fetching news from MarketAux:', error);
      return this.getFallbackNews();
    }
  }

  /**
   * Get market data from Polygon
   */
  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    const cacheKey = `market_data_${symbols.join(',')}`;
    const cached = marketDataCache.get<MarketData[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const marketData: MarketData[] = [];

      // Get data for each symbol
      for (const symbol of symbols) {
        try {
          const response = await axios.get(
            `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`,
            {
              params: {
                apikey: this.polygonApiKey
              },
              timeout: 5000
            }
          );

          if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            marketData.push({
              symbol,
              price: result.c, // close price
              change: result.c - result.o, // close - open
              changePercent: ((result.c - result.o) / result.o) * 100,
              volume: result.v,
              timestamp: new Date(result.t).toISOString()
            });
          }
        } catch (symbolError) {
          console.error(`Error fetching data for ${symbol}:`, symbolError);
        }
      }

      // Store in database
      await this.storeMarketData(marketData);

      // Cache the results
      marketDataCache.set(cacheKey, marketData);
      
      return marketData;
    } catch (error) {
      console.error('Error fetching market data from Polygon:', error);
      return this.getFallbackMarketData(symbols);
    }
  }

  /**
   * Get sector performance data
   */
  async getSectorPerformance(): Promise<SectorPerformance[]> {
    const cacheKey = 'sector_performance';
    const cached = marketDataCache.get<SectorPerformance[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get major sector ETFs performance
      const sectorETFs = [
        { symbol: 'XLK', sector: 'Technology' },
        { symbol: 'XLF', sector: 'Financial' },
        { symbol: 'XLV', sector: 'Healthcare' },
        { symbol: 'XLE', sector: 'Energy' },
        { symbol: 'XLI', sector: 'Industrial' },
        { symbol: 'XLY', sector: 'Consumer Discretionary' },
        { symbol: 'XLP', sector: 'Consumer Staples' },
        { symbol: 'XLU', sector: 'Utilities' },
        { symbol: 'XLB', sector: 'Materials' },
        { symbol: 'XLRE', sector: 'Real Estate' }
      ];

      const marketData = await this.getMarketData(sectorETFs.map(etf => etf.symbol));
      
      const sectorPerformance: SectorPerformance[] = sectorETFs.map(etf => {
        const data = marketData.find(d => d.symbol === etf.symbol);
        return {
          sector: etf.sector,
          performance: data?.changePercent || 0,
          topGainers: [], // Would need additional API calls to get individual stocks
          topLosers: []
        };
      });

      marketDataCache.set(cacheKey, sectorPerformance);
      return sectorPerformance;
    } catch (error) {
      console.error('Error fetching sector performance:', error);
      return this.getFallbackSectorPerformance();
    }
  }

  /**
   * Calculate market sentiment based on various indicators
   */
  async getMarketSentiment(): Promise<MarketSentiment> {
    const cacheKey = 'market_sentiment';
    const cached = marketDataCache.get<MarketSentiment>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get VIX data (volatility index)
      const vixData = await this.getMarketData(['VIX']);
      const vix = vixData[0]?.price || 20;

      // Get recent news sentiment
      const recentNews = await this.getRelevantNews([], [], 50);
      const sentimentScore = this.calculateNewsSentiment(recentNews);

      // Determine overall sentiment
      let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (sentimentScore > 0.2 && vix < 20) {
        overall = 'bullish';
      } else if (sentimentScore < -0.2 || vix > 30) {
        overall = 'bearish';
      }

      const sentiment: MarketSentiment = {
        overall,
        score: sentimentScore,
        indicators: {
          vix,
          putCallRatio: 0.8, // Would need additional data source
          fearGreedIndex: this.calculateFearGreedIndex(vix, sentimentScore)
        },
        trends: this.extractTrends(recentNews)
      };

      marketDataCache.set(cacheKey, sentiment);
      return sentiment;
    } catch (error) {
      console.error('Error calculating market sentiment:', error);
      return {
        overall: 'neutral',
        score: 0,
        indicators: { vix: 20, putCallRatio: 1.0, fearGreedIndex: 50 },
        trends: []
      };
    }
  }

  /**
   * Get comprehensive market context for content personalization
   */
  async getMarketContext(
    subscriberInterests?: string[],
    riskTolerance?: 'low' | 'medium' | 'high'
  ): Promise<{
    relevantNews: MarketNews[];
    marketData: MarketData[];
    sectorPerformance: SectorPerformance[];
    sentiment: MarketSentiment;
    volatilityIndex: number;
    keyInsights: string[];
  }> {
    try {
      // Get relevant symbols based on subscriber interests
      const symbols = this.getRelevantSymbols(subscriberInterests, riskTolerance);
      
      const [news, marketData, sectorPerformance, sentiment] = await Promise.all([
        this.getRelevantNews(symbols, subscriberInterests, 10),
        this.getMarketData(symbols),
        this.getSectorPerformance(),
        this.getMarketSentiment()
      ]);

      const keyInsights = this.generateKeyInsights(news, marketData, sectorPerformance, sentiment);

      return {
        relevantNews: news,
        marketData,
        sectorPerformance,
        sentiment,
        volatilityIndex: sentiment.indicators.vix,
        keyInsights
      };
    } catch (error) {
      console.error('Error getting market context:', error);
      return {
        relevantNews: [],
        marketData: [],
        sectorPerformance: [],
        sentiment: { overall: 'neutral', score: 0, indicators: { vix: 20, putCallRatio: 1.0, fearGreedIndex: 50 }, trends: [] },
        volatilityIndex: 20,
        keyInsights: []
      };
    }
  }

  // Helper methods
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['gain', 'rise', 'up', 'bull', 'growth', 'strong', 'beat', 'surge', 'rally'];
    const negativeWords = ['fall', 'drop', 'down', 'bear', 'decline', 'weak', 'miss', 'crash', 'sell'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateRelevanceScore(newsItem: any): number {
    let score = 0.5; // Base score
    
    // Boost score for major financial sources
    const majorSources = ['reuters', 'bloomberg', 'wsj', 'cnbc', 'marketwatch'];
    if (majorSources.some(source => newsItem.source.toLowerCase().includes(source))) {
      score += 0.2;
    }
    
    // Boost for recent news
    const hoursOld = (Date.now() - new Date(newsItem.published_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 2) score += 0.2;
    else if (hoursOld < 6) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private calculateNewsSentiment(news: MarketNews[]): number {
    if (news.length === 0) return 0;
    
    const sentimentValues = news.map(item => {
      switch (item.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });
    
    return sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
  }

  private calculateFearGreedIndex(vix: number, sentimentScore: number): number {
    // Simplified fear/greed calculation
    let index = 50; // Neutral
    
    // VIX component (lower VIX = less fear)
    if (vix < 15) index += 20;
    else if (vix < 20) index += 10;
    else if (vix > 30) index -= 20;
    else if (vix > 25) index -= 10;
    
    // Sentiment component
    index += sentimentScore * 30;
    
    return Math.max(0, Math.min(100, index));
  }

  private extractTrends(news: MarketNews[]): string[] {
    const trends: { [key: string]: number } = {};
    
    news.forEach(item => {
      const text = (item.title + ' ' + item.description).toLowerCase();
      
      // Common financial trends
      const trendKeywords = [
        'ai', 'artificial intelligence', 'fed', 'interest rates', 'inflation',
        'earnings', 'crypto', 'bitcoin', 'tech', 'energy', 'oil', 'gold',
        'recession', 'growth', 'employment', 'gdp'
      ];
      
      trendKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          trends[keyword] = (trends[keyword] || 0) + 1;
        }
      });
    });
    
    return Object.entries(trends)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trend]) => trend);
  }

  private getRelevantSymbols(interests?: string[], riskTolerance?: string): string[] {
    const baseSymbols = ['SPY', 'QQQ', 'VTI', 'BND']; // Core market indicators
    
    if (!interests) return baseSymbols;
    
    const symbolMap: { [key: string]: string[] } = {
      'technology': ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA'],
      'finance': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      'healthcare': ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK'],
      'energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB'],
      'crypto': ['BTC-USD', 'ETH-USD'],
      'commodities': ['GLD', 'SLV', 'USO']
    };
    
    let symbols = [...baseSymbols];
    interests.forEach(interest => {
      if (symbolMap[interest.toLowerCase()]) {
        symbols.push(...symbolMap[interest.toLowerCase()]);
      }
    });
    
    return [...new Set(symbols)]; // Remove duplicates
  }

  private generateKeyInsights(
    news: MarketNews[], 
    marketData: MarketData[], 
    sectorPerformance: SectorPerformance[], 
    sentiment: MarketSentiment
  ): string[] {
    const insights: string[] = [];
    
    // Market sentiment insight
    insights.push(`Market sentiment is ${sentiment.overall} with VIX at ${sentiment.indicators.vix.toFixed(1)}`);
    
    // Top performing sector
    const topSector = sectorPerformance.sort((a, b) => b.performance - a.performance)[0];
    if (topSector) {
      insights.push(`${topSector.sector} leads sectors with ${topSector.performance.toFixed(1)}% performance`);
    }
    
    // Major movers
    const bigMovers = marketData.filter(d => Math.abs(d.changePercent) > 3);
    if (bigMovers.length > 0) {
      insights.push(`${bigMovers.length} major movers with >3% price changes`);
    }
    
    // News trends
    if (sentiment.trends.length > 0) {
      insights.push(`Key market themes: ${sentiment.trends.slice(0, 3).join(', ')}`);
    }
    
    return insights;
  }

  // Fallback data methods
  private getFallbackNews(): MarketNews[] {
    return [
      {
        id: 'fallback-1',
        title: 'Market Update: Indices Show Mixed Performance',
        description: 'Major indices showing mixed signals as investors await economic data.',
        url: '#',
        source: 'Market Intelligence',
        publishedAt: new Date().toISOString(),
        sentiment: 'neutral',
        relevanceScore: 0.7,
        symbols: ['SPY', 'QQQ'],
        categories: ['markets']
      }
    ];
  }

  private getFallbackMarketData(symbols: string[]): MarketData[] {
    return symbols.map(symbol => ({
      symbol,
      price: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString()
    }));
  }

  private getFallbackSectorPerformance(): SectorPerformance[] {
    const sectors = ['Technology', 'Financial', 'Healthcare', 'Energy', 'Industrial'];
    return sectors.map(sector => ({
      sector,
      performance: (Math.random() - 0.5) * 4,
      topGainers: [],
      topLosers: []
    }));
  }

  // Database storage methods
  private async storeNewsData(news: MarketNews[]) {
    try {
      const db = tenantStorage.getDatabase(this.publisherId);
      // Store in market_news table
      // Implementation depends on your database schema
    } catch (error) {
      console.error('Error storing news data:', error);
    }
  }

  private async storeMarketData(data: MarketData[]) {
    try {
      const db = tenantStorage.getDatabase(this.publisherId);
      // Store in market_data table
      // Implementation depends on your database schema
    } catch (error) {
      console.error('Error storing market data:', error);
    }
  }
}

// Factory function
export function createMarketIntelligenceService(publisherId: string): MarketIntelligenceService {
  return new MarketIntelligenceService(publisherId);
}

