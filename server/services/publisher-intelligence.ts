import { MarketAlertService, MarketEvent } from './market-alerts';
import { EmailPlatformService, EmailPlatformMetrics } from './email-platform-integration';
import axios from 'axios';

export interface PublisherInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'alert';
  title: string;
  description: string;
  actionable: boolean;
  urgency: 'high' | 'medium' | 'low';
  targetCohorts: string[];
  suggestedContent: string;
  marketData?: any;
  timestamp: Date;
}

export interface ContentEnhancement {
  originalText: string;
  enhancedText: string;
  addedData: {
    prices: Array<{ symbol: string; price: number; change: string }>;
    percentages: Array<{ metric: string; value: string }>;
    citations: string[];
  };
  marketContext: string;
}

export class PublisherIntelligenceService {
  private marketAlerts: MarketAlertService;
  private emailPlatformService: EmailPlatformService;

  constructor() {
    this.marketAlerts = new MarketAlertService();
    this.emailPlatformService = new EmailPlatformService();
  }

  /**
   * Generate proactive publisher insights and opportunities
   */
  async generatePublisherInsights(publisherId: string): Promise<{
    insights: PublisherInsight[];
    immediateActions: string[];
    contentOpportunities: string[];
  }> {
    const [marketEvents, sectorPerformance, alerts] = await Promise.all([
      this.marketAlerts.getMarketEvents(),
      this.marketAlerts.getSectorPerformance(),
      this.marketAlerts.checkMarketAlerts(publisherId)
    ]);

    const insights: PublisherInsight[] = [];
    const immediateActions: string[] = [];
    const contentOpportunities: string[] = [];

    // Analyze market events for content opportunities
    const highImpactEvents = marketEvents.filter(event => event.impact === 'high');
    for (const event of highImpactEvents) {
      insights.push({
        id: `insight-${event.id}`,
        type: 'opportunity',
        title: `Breaking: ${event.title}`,
        description: `High-impact ${event.type} event detected. Immediate content opportunity for subscriber engagement.`,
        actionable: true,
        urgency: 'high',
        targetCohorts: this.determineCohortTargets(event),
        suggestedContent: this.generateContentSuggestion(event),
        marketData: event,
        timestamp: new Date()
      });

      immediateActions.push(`Send breaking news alert about ${event.symbol || event.type} to ${this.determineCohortTargets(event).join(', ')} cohorts`);
    }

    // Sector rotation analysis
    const topSectors = Object.entries(sectorPerformance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    const bottomSectors = Object.entries(sectorPerformance)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 2);

    if (topSectors[0][1] > 2) {
      insights.push({
        id: 'sector-leader',
        type: 'trend',
        title: `${topSectors[0][0]} Leading Market with ${topSectors[0][1]}% Gain`,
        description: 'Strong sector performance suggests rotation opportunity for growth-focused content.',
        actionable: true,
        urgency: 'medium',
        targetCohorts: ['growth-investors', 'professional-investors'],
        suggestedContent: `Create sector spotlight: "${topSectors[0][0]} Momentum: Why Smart Money is Rotating In"`,
        timestamp: new Date()
      });

      contentOpportunities.push(`Sector rotation newsletter highlighting ${topSectors[0][0]} momentum`);
    }

    // Volatility opportunities
    const volatileEvents = marketEvents.filter(event => 
      event.type === 'earnings' && Math.abs(event.priceImpact || 0) > 0.05
    );

    for (const event of volatileEvents) {
      insights.push({
        id: `volatility-${event.id}`,
        type: 'alert',
        title: `${event.symbol} Volatility Alert: ${event.priceImpact! > 0 ? 'Surge' : 'Drop'} Detected`,
        description: `Significant price movement following ${event.type}. Opportunity for real-time analysis content.`,
        actionable: true,
        urgency: 'high',
        targetCohorts: ['professional-investors', 'trading-focused'],
        suggestedContent: this.generateVolatilityContent(event),
        marketData: event,
        timestamp: new Date()
      });
    }

    // Fed/Economic events
    const fedEvents = marketEvents.filter(event => 
      event.title.toLowerCase().includes('fed') || 
      event.title.toLowerCase().includes('federal reserve')
    );

    for (const event of fedEvents) {
      insights.push({
        id: `fed-${event.id}`,
        type: 'alert',
        title: 'Fed Event Detected: Multi-Cohort Content Opportunity',
        description: 'Federal Reserve activity requires different analysis depths for different subscriber segments.',
        actionable: true,
        urgency: 'high',
        targetCohorts: ['all'],
        suggestedContent: this.generateFedContent(event),
        marketData: event,
        timestamp: new Date()
      });

      immediateActions.push('Prepare Fed analysis newsletter with cohort-specific complexity levels');
    }

    // Alert-based insights
    for (const recommendation of alerts.recommendations) {
      immediateActions.push(recommendation);
    }

    return { insights, immediateActions, contentOpportunities };
  }

  /**
   * Enhance email content with real market data, prices, and citations
   */
  async enhanceEmailContent(
    originalContent: string,
    symbols: string[] = [],
    autoDetectSymbols: boolean = true
  ): Promise<ContentEnhancement> {
    // Auto-detect stock symbols in content
    if (autoDetectSymbols) {
      const detectedSymbols = this.extractStockSymbols(originalContent);
      symbols = [...symbols, ...detectedSymbols];
      symbols = symbols.filter((symbol, index, array) => array.indexOf(symbol) === index);
    }

    const topics = this.extractTopics(originalContent);
    const enhancedData = await this.marketAlerts.getEnhancedContentData(symbols, topics);

    // Enhance content with real data
    let enhancedText = originalContent;

    // Add current prices
    const priceData: Array<{ symbol: string; price: number; change: string }> = [];
    for (const [symbol, data] of Object.entries(enhancedData.prices)) {
      priceData.push({
        symbol,
        price: data.current,
        change: `${data.changePercent >= 0 ? '+' : ''}${data.changePercent}%`
      });

      // Replace generic mentions with specific data
      const genericPattern = new RegExp(`${symbol}\\s+(is|was|has)\\s+(up|down|trading)`, 'gi');
      enhancedText = enhancedText.replace(genericPattern, 
        `${symbol} is trading at $${data.current} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`
      );
    }

    // Add sector performance data
    const sectorPerf = await this.marketAlerts.getSectorPerformance();
    const percentageData: Array<{ metric: string; value: string }> = [];
    
    Object.entries(sectorPerf).forEach(([sector, perf]) => {
      percentageData.push({
        metric: `${sector} Sector Performance`,
        value: `${perf >= 0 ? '+' : ''}${perf}%`
      });

      // Enhance sector mentions
      const sectorPattern = new RegExp(`${sector.toLowerCase()}\\s+sector`, 'gi');
      enhancedText = enhancedText.replace(sectorPattern,
        `${sector} sector (${perf >= 0 ? '+' : ''}${perf}% today)`
      );
    });

    // Add market context
    if (enhancedData.marketContext) {
      enhancedText += `\n\n[Market Context: ${enhancedData.marketContext}]`;
    }

    // Add citations from recent news
    const citations = enhancedData.citations;

    return {
      originalText: originalContent,
      enhancedText,
      addedData: {
        prices: priceData,
        percentages: percentageData,
        citations
      },
      marketContext: enhancedData.marketContext
    };
  }

  /**
   * Get publisher dashboard with only legitimate data from authorized sources
   */
  async getPublisherDashboardData(publisherId: string, emailIntegration?: {
    platform: 'mailchimp' | 'convertkit' | 'brevo';
    credentials: any;
  }): Promise<{
    marketOverview: {
      majorIndices: Record<string, { value: number; change: number }>;
      sectorLeaders: Array<{ sector: string; performance: number }>;
      volatilityIndex: number;
    };
    activeAlerts: any[];
    contentSuggestions: string[];
    emailMetrics: {
      totalSubscribers: number;
      recentCampaigns: number;
      avgOpenRate: number;
      avgClickRate: number;
    };
  }> {
    const [sectorPerf, alerts, insights, emailMetrics] = await Promise.all([
      this.marketAlerts.getSectorPerformance(),
      this.marketAlerts.checkMarketAlerts(publisherId),
      this.generatePublisherInsights(publisherId),
      emailIntegration 
        ? this.emailPlatformService.getEmailPlatformMetrics(emailIntegration)
        : Promise.resolve(this.getDefaultEmailMetrics())
    ]);

    // Mock major indices data (in production, fetch from Polygon)
    const majorIndices = {
      'S&P 500': { value: 4567.12, change: 0.8 },
      'NASDAQ': { value: 14321.45, change: 1.2 },
      'DOW': { value: 35678.90, change: 0.5 }
    };

    const sectorLeaders = Object.entries(sectorPerf)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([sector, performance]) => ({ sector, performance: performance as number }));

    // Calculate volatility index (simplified)
    const topPerf = sectorLeaders[0]?.performance || 0;
    const bottomPerf = sectorLeaders[sectorLeaders.length - 1]?.performance || 0;
    const volatilityIndex = Math.abs(topPerf) + Math.abs(bottomPerf);

    return {
      marketOverview: {
        majorIndices,
        sectorLeaders,
        volatilityIndex: Math.round(volatilityIndex * 10) / 10
      },
      activeAlerts: alerts.triggeredAlerts,
      contentSuggestions: insights.contentOpportunities,
      emailMetrics: {
        totalSubscribers: emailMetrics.totalSubscribers,
        recentCampaigns: emailMetrics.recentCampaigns,
        avgOpenRate: emailMetrics.avgOpenRate,
        avgClickRate: emailMetrics.avgClickRate
      }
    };
  }

  private extractStockSymbols(content: string): string[] {
    // Enhanced regex to capture stock symbols
    const symbolPattern = /\b[A-Z]{1,5}\b(?=\s|$|[^A-Z])/g;
    const matches = content.match(symbolPattern) || [];
    
    // Filter common false positives
    const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'HAS', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DAY', 'GET', 'MAY', 'OWN', 'SAY', 'SHE', 'USE', 'HER', 'HOW', 'ITS', 'OUT', 'TOP', 'WAY', 'WHY'];
    
    return matches.filter(symbol => 
      symbol.length >= 2 && 
      symbol.length <= 5 && 
      !commonWords.includes(symbol)
    );
  }

  private extractTopics(content: string): string[] {
    const topics = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('earnings') || lowerContent.includes('quarterly')) topics.push('earnings');
    if (lowerContent.includes('fed') || lowerContent.includes('federal reserve')) topics.push('fed');
    if (lowerContent.includes('dividend')) topics.push('dividend');
    if (lowerContent.includes('merger') || lowerContent.includes('acquisition')) topics.push('merger');
    if (lowerContent.includes('crypto') || lowerContent.includes('bitcoin')) topics.push('crypto');
    
    return topics;
  }

  private determineCohortTargets(event: MarketEvent): string[] {
    switch (event.type) {
      case 'earnings':
        return ['professional-investors', 'growth-investors'];
      case 'fed_announcement':
        return ['all'];
      case 'volatility_spike':
        return ['professional-investors', 'trading-focused'];
      case 'dividend':
        return ['income-investors', 'conservative-investors'];
      default:
        return ['professional-investors'];
    }
  }

  private generateContentSuggestion(event: MarketEvent): string {
    switch (event.type) {
      case 'earnings':
        return `Breaking Analysis: ${event.symbol} Earnings - What It Means for Your Portfolio`;
      case 'fed_announcement':
        return `Fed Update: Immediate Market Impact and Strategy Adjustments`;
      case 'volatility_spike':
        return `Market Alert: ${event.symbol} Volatility - Risk or Opportunity?`;
      default:
        return `Market Update: ${event.title}`;
    }
  }

  private generateVolatilityContent(event: MarketEvent): string {
    const direction = event.priceImpact! > 0 ? 'Surge' : 'Drop';
    return `${event.symbol} Volatility Alert: ${direction} Analysis and Next Moves for Active Traders`;
  }

  private generateFedContent(event: MarketEvent): string {
    return `Fed Decision Breakdown: Multi-Level Analysis (Beginner to Professional)`;
  }

  private getDefaultEmailMetrics(): EmailPlatformMetrics {
    return {
      totalSubscribers: 0,
      activeSubscribers: 0,
      recentCampaigns: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      unsubscribeRate: 0,
      lastSyncTime: new Date()
    };
  }
}