import express from 'express';
import { createCohortEngine } from './services/cohort-engine';
import { createAIContentProcessor } from './services/ai-content-processor';
import { MarketIntelligenceService } from './services/market-intelligence';
import { requireTenant } from './middleware/tenant';

const router = express.Router();

// Apply tenant requirement middleware to all routes  
router.use(requireTenant);

// Helper function to get tenant ID from request
const getTenantId = (req: express.Request): string => {
  return req.tenant?.id || '07db1cad-c3b5-4eb3-87ef-69fb38a212c3';
};

interface EmailCampaign {
  id: string;
  title: string;
  baseSubject: string;
  baseContent: string;
  targetCohorts: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'sent';
  createdAt: string;
  scheduledAt?: string;
  variations: EmailVariation[];
  marketTriggers: string[];
}

interface EmailVariation {
  cohortId: string;
  cohortName: string;
  subscriberCount: number;
  personalizedSubject: string;
  personalizedContent: string;
  personalizedCTA: string;
  predictedOpenRate: number;
  predictedClickRate: number;
  optimalSendTime: string;
  reasoning: string;
  approved: boolean;
}

interface MarketTrigger {
  id: string;
  type: 'news' | 'price_movement' | 'volatility' | 'earnings' | 'economic_data';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  relevantCohorts: string[];
  suggestedContent: string;
  suggestedSubjects: string[];
  timestamp: string;
  source: string;
}

/**
 * Create a new email campaign with AI-generated variations for different cohorts
 */
router.post('/create-campaign', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { title, subject, content, targetCohorts } = req.body;

    if (!title || !subject || !content) {
      return res.status(400).json({ 
        error: 'Title, subject, and content are required' 
      });
    }

    const cohortEngine = createCohortEngine(publisherId);
    const aiProcessor = createAIContentProcessor(publisherId);

    // Get available cohorts if none specified
    let cohortsToTarget = targetCohorts;
    if (!cohortsToTarget || cohortsToTarget.length === 0) {
      const allCohorts = await cohortEngine.generateDynamicCohorts();
      cohortsToTarget = allCohorts.map(c => c.id);
    }

    // Generate personalized variations for each cohort
    const variations: EmailVariation[] = [];
    
    for (const cohortId of cohortsToTarget) {
      try {
        // Get cohort information
        const cohorts = await cohortEngine.generateDynamicCohorts();
        const cohort = cohorts.find(c => c.id === cohortId);
        
        if (!cohort) continue;

        // Generate AI-powered personalization for this cohort
        const aiAnalysis = await aiProcessor.analyzeContent(content, subject);
        const subjectVariations = await aiProcessor.generateSubjectVariations(subject, cohort.characteristics);
        
        // Select best subject variation for this cohort
        const bestSubject = subjectVariations.variations[0] || subject;
        
        // Generate personalized content (simplified for demo)
        let personalizedContent = content;
        let personalizedCTA = 'Learn More';
        
        // Customize based on cohort characteristics
        if (cohort.characteristics.includes('Conservative')) {
          personalizedContent = content.replace(/growth/gi, 'stable growth')
                                    .replace(/opportunity/gi, 'stable opportunity');
          personalizedCTA = 'View Conservative Options';
        } else if (cohort.characteristics.includes('High risk tolerance')) {
          personalizedContent = `🚀 GROWTH ALERT: ${content}`;
          personalizedCTA = 'Explore High-Growth Opportunities';
        }

        variations.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          subscriberCount: cohort.size,
          personalizedSubject: bestSubject.subject,
          personalizedContent,
          personalizedCTA,
          predictedOpenRate: bestSubject.predictedOpenRate,
          predictedClickRate: cohort.engagementMetrics.averageClickRate * 1.2, // Boost from personalization
          optimalSendTime: cohort.contentPreferences.optimalSendTime,
          reasoning: `Personalized for ${cohort.characteristics.join(', ')} with ${bestSubject.style} subject line`,
          approved: false
        });
      } catch (error) {
        console.error(`Error generating variation for cohort ${cohortId}:`, error);
      }
    }

    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}`,
      title,
      baseSubject: subject,
      baseContent: content,
      targetCohorts: cohortsToTarget,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      variations,
      marketTriggers: []
    };

    res.json({
      success: true,
      campaign,
      summary: {
        totalVariations: variations.length,
        totalSubscribers: variations.reduce((sum, v) => sum + v.subscriberCount, 0),
        avgPredictedOpenRate: variations.reduce((sum, v) => sum + v.predictedOpenRate, 0) / variations.length,
        avgPredictedClickRate: variations.reduce((sum, v) => sum + v.predictedClickRate, 0) / variations.length
      }
    });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    res.status(500).json({ error: 'Failed to create email campaign' });
  }
});

/**
 * Get current market triggers that suggest email opportunities
 */
router.get('/market-triggers', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const marketService = MarketIntelligenceService(publisherId);
    
    // Get market context and generate triggers
    const marketContext = await marketService.getMarketContext();
    
    const triggers: MarketTrigger[] = [];

    // Generate triggers based on market conditions
    if (marketContext.volatilityIndex > 25) {
      triggers.push({
        id: `volatility_${Date.now()}`,
        type: 'volatility',
        title: `High Volatility Alert: VIX at ${marketContext.volatilityIndex}`,
        description: 'Market volatility has increased significantly, creating opportunities for active traders',
        urgency: 'high',
        relevantCohorts: ['aggressive_investors', 'volatility_responsive'],
        suggestedContent: 'Volatility trading strategies, risk management techniques, and opportunity identification',
        suggestedSubjects: [
          '🚨 Volatility Spike: Trading Opportunities Now',
          'Market Turbulence: How to Profit from Uncertainty',
          'High VIX Alert: Strategic Moves for Active Traders'
        ],
        timestamp: new Date().toISOString(),
        source: 'Market Intelligence Engine'
      });
    }

    // Check for significant news
    if (marketContext.newsAnalysis && marketContext.newsAnalysis.length > 0) {
      const significantNews = marketContext.newsAnalysis.filter(news => news.sentiment !== 'neutral');
      
      significantNews.slice(0, 3).forEach((news, index) => {
        triggers.push({
          id: `news_${Date.now()}_${index}`,
          type: 'news',
          title: news.title,
          description: news.summary,
          urgency: Math.abs(news.sentimentScore) > 0.7 ? 'high' : 'medium',
          relevantCohorts: news.relevantSectors.includes('Technology') ? 
            ['tech_focused', 'aggressive_investors'] : 
            ['conservative_investors', 'moderate_investors'],
          suggestedContent: `Analysis of ${news.title} and its market implications`,
          suggestedSubjects: [
            `Breaking: ${news.title.substring(0, 40)}...`,
            `Market Impact: ${news.title}`,
            `Analysis: ${news.title}`
          ],
          timestamp: news.publishedAt,
          source: 'MarketAux News'
        });
      });
    }

    // Generate earnings-based triggers (simulated)
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour <= 10) { // Morning earnings window
      triggers.push({
        id: `earnings_${Date.now()}`,
        type: 'earnings',
        title: 'Morning Earnings Reports Available',
        description: 'Several companies have reported earnings this morning with significant market impact',
        urgency: 'medium',
        relevantCohorts: ['aggressive_investors', 'tech_focused'],
        suggestedContent: 'Earnings analysis, stock reactions, and investment implications',
        suggestedSubjects: [
          'Earnings Alert: Key Reports This Morning',
          'Market Movers: Earnings Edition',
          'Quarterly Results: Winners and Losers'
        ],
        timestamp: new Date().toISOString(),
        source: 'Earnings Calendar'
      });
    }

    res.json({
      success: true,
      triggers: triggers.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }),
      marketContext: {
        volatilityIndex: marketContext.volatilityIndex,
        marketSentiment: marketContext.marketSentiment,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching market triggers:', error);
    res.status(500).json({ error: 'Failed to fetch market triggers' });
  }
});

/**
 * Approve email variations for sending
 */
router.post('/approve-variations', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { campaignId, approvedCohorts } = req.body;

    if (!campaignId || !approvedCohorts || !Array.isArray(approvedCohorts)) {
      return res.status(400).json({ 
        error: 'Campaign ID and approved cohorts array are required' 
      });
    }

    // In a real implementation, this would update the database
    const approvalResult = {
      campaignId,
      approvedCohorts,
      approvedAt: new Date().toISOString(),
      totalApproved: approvedCohorts.length,
      status: 'approved'
    };

    res.json({
      success: true,
      approval: approvalResult,
      message: `Approved ${approvedCohorts.length} email variations for sending`
    });
  } catch (error) {
    console.error('Error approving email variations:', error);
    res.status(500).json({ error: 'Failed to approve email variations' });
  }
});

/**
 * Schedule approved email variations for sending
 */
router.post('/schedule-send', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { campaignId, cohortId, sendTime } = req.body;

    if (!campaignId || !cohortId) {
      return res.status(400).json({ 
        error: 'Campaign ID and cohort ID are required' 
      });
    }

    const scheduledSend = {
      id: `send_${Date.now()}`,
      campaignId,
      cohortId,
      scheduledAt: sendTime || new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Default to 5 minutes from now
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      scheduledSend,
      message: 'Email send scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling email send:', error);
    res.status(500).json({ error: 'Failed to schedule email send' });
  }
});

/**
 * Get email campaign performance analytics
 */
router.get('/campaign-analytics/:campaignId', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { campaignId } = req.params;

    // Generate sample analytics data
    const analytics = {
      campaignId,
      totalSent: 2890,
      totalOpened: 2167,
      totalClicked: 462,
      totalConverted: 139,
      openRate: 0.75,
      clickRate: 0.16,
      conversionRate: 0.048,
      revenue: 8950,
      cohortBreakdown: [
        {
          cohortId: 'conservative_investors',
          cohortName: 'Conservative Investors',
          sent: 1250,
          opened: 900,
          clicked: 126,
          converted: 50,
          revenue: 2500
        },
        {
          cohortId: 'aggressive_investors',
          cohortName: 'Growth Seekers',
          sent: 890,
          opened: 757,
          clicked: 196,
          converted: 59,
          revenue: 3540
        },
        {
          cohortId: 'tech_focused',
          cohortName: 'Tech Specialists',
          sent: 650,
          opened: 507,
          clicked: 117,
          converted: 26,
          revenue: 2080
        }
      ],
      timeline: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        opens: Math.floor(Math.random() * 100) + 20,
        clicks: Math.floor(Math.random() * 30) + 5
      })),
      insights: [
        'Growth Seekers cohort showed 22% higher click rates than average',
        'Conservative Investors had the highest conversion rate at 4%',
        'Tech Specialists engaged most with technical content sections',
        'Optimal send time appears to be 8-10 AM for this campaign'
      ]
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

/**
 * Generate AI-powered email suggestions based on market triggers
 */
router.post('/generate-from-trigger', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { triggerId, selectedCohorts } = req.body;

    if (!triggerId) {
      return res.status(400).json({ error: 'Trigger ID is required' });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    
    // Generate content based on trigger (simplified for demo)
    const suggestions = {
      triggerId,
      generatedAt: new Date().toISOString(),
      suggestions: [
        {
          title: 'Market Volatility Alert: Strategic Opportunities',
          subject: '🚨 VIX Spike: How to Navigate Market Turbulence',
          content: `Dear Investor,

Today's market volatility presents both challenges and opportunities for strategic investors.

Key Points:
• VIX has spiked to elevated levels, indicating increased uncertainty
• Historical data shows volatility often precedes significant moves
• Defensive positioning may be prudent for conservative portfolios
• Active traders may find opportunities in the increased price swings

Our analysis suggests focusing on:
1. Quality companies with strong balance sheets
2. Defensive sectors that typically outperform during uncertainty
3. Volatility-based strategies for experienced traders

Stay informed and stay strategic.

Best regards,
The Investment Team`,
          targetCohorts: selectedCohorts || ['conservative_investors', 'aggressive_investors'],
          urgency: 'high'
        }
      ]
    };

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating email from trigger:', error);
    res.status(500).json({ error: 'Failed to generate email suggestions' });
  }
});

/**
 * Get email optimization recommendations
 */
router.get('/optimization-recommendations', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    
    const recommendations = {
      subjectLines: [
        {
          recommendation: 'Use urgency indicators for Growth Seekers cohort',
          example: 'Add 🚀 or ⚡ emojis to increase open rates by 15%',
          impact: 'high'
        },
        {
          recommendation: 'Personalize with investment focus',
          example: 'Include "Dividend Focus" or "Growth Alert" based on cohort',
          impact: 'medium'
        }
      ],
      sendTiming: [
        {
          recommendation: 'Optimize send times by cohort',
          details: 'Conservative investors: 9 AM, Aggressive investors: 8 AM, Tech specialists: 9:30 AM',
          impact: 'high'
        }
      ],
      content: [
        {
          recommendation: 'Adjust content depth by experience level',
          details: 'Beginners prefer educational content, experts want detailed analysis',
          impact: 'medium'
        },
        {
          recommendation: 'Include market context for relevance',
          details: 'Reference current market conditions to increase engagement',
          impact: 'high'
        }
      ],
      frequency: [
        {
          recommendation: 'Vary frequency by engagement level',
          details: 'High engagement cohorts can handle daily emails, others prefer weekly',
          impact: 'medium'
        }
      ]
    };

    res.json({
      success: true,
      recommendations,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching optimization recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch optimization recommendations' });
  }
});

export { router as emailOptimizationRoutes };

