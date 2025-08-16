import { Router } from 'express';
import { db } from './database';
import { contentRequests, contentDrafts, emailCampaigns, insertContentRequestSchema, insertContentDraftSchema, insertEmailCampaignSchema } from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { CohortDetectionService } from './services/cohort-detection';
import { EmailSharpeningService } from './services/email-sharpening';
import { MarketIntelligenceService } from './services/market-intelligence';
import { PublisherIntelligenceService } from './services/publisher-intelligence';
import { MarketAlertService } from './services/market-alerts';

const router = Router();
const cohortDetectionService = new CohortDetectionService();
const emailSharpeningService = new EmailSharpeningService();
const marketIntelligenceService = new MarketIntelligenceService();
const publisherIntelligenceService = new PublisherIntelligenceService();
const marketAlertService = new MarketAlertService();

/**
 * Create a new content request
 */
router.post('/content-requests', async (req, res) => {
  try {
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication middleware
    const requestorId = 'demo-user'; // TODO: Extract from authentication middleware
    
    const validatedData = insertContentRequestSchema.parse({
      ...req.body,
      publisherId,
      requestorId,
    });

    const [newRequest] = await db
      .insert(contentRequests)
      .values(validatedData)
      .returning();

    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Content request created successfully'
    });
  } catch (error) {
    console.error('Error creating content request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create content request' 
    });
  }
});

/**
 * Get all content requests for a publisher
 */
router.get('/content-requests', async (req, res) => {
  try {
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication
    const { status, priority, assigneeId } = req.query;

    let query = db
      .select()
      .from(contentRequests)
      .where(eq(contentRequests.publisherId, publisherId));

    // Apply filters
    const conditions = [eq(contentRequests.publisherId, publisherId)];
    
    if (status) {
      conditions.push(eq(contentRequests.status, status as string));
    }
    if (priority) {
      conditions.push(eq(contentRequests.priority, priority as string));
    }
    if (assigneeId) {
      conditions.push(eq(contentRequests.assigneeId, assigneeId as string));
    }

    const requests = await db
      .select()
      .from(contentRequests)
      .where(and(...conditions))
      .orderBy(desc(contentRequests.createdAt));

    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching content requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content requests' 
    });
  }
});

/**
 * Get a specific content request by ID
 */
router.get('/content-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    const [request] = await db
      .select()
      .from(contentRequests)
      .where(and(
        eq(contentRequests.id, id),
        eq(contentRequests.publisherId, publisherId)
      ));

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Content request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching content request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content request' 
    });
  }
});

/**
 * Update a content request
 */
router.put('/content-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const [updatedRequest] = await db
      .update(contentRequests)
      .set(updateData)
      .where(and(
        eq(contentRequests.id, id),
        eq(contentRequests.publisherId, publisherId)
      ))
      .returning();

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        error: 'Content request not found'
      });
    }

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Content request updated successfully'
    });
  } catch (error) {
    console.error('Error updating content request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update content request' 
    });
  }
});

/**
 * Process content request with AI
 */
router.post('/content-requests/:id/process-ai', async (req, res) => {
  try {
    const { id } = req.params;
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    // Get the content request
    const [request] = await db
      .select()
      .from(contentRequests)
      .where(and(
        eq(contentRequests.id, id),
        eq(contentRequests.publisherId, publisherId)
      ));

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Content request not found'
      });
    }

    // TODO: Integrate with OpenAI service to generate content
    const aiGeneratedContent = `
# ${request.title}

## Executive Summary
Based on the request "${request.description}", here's a comprehensive content outline designed for financial newsletter subscribers.

## Key Points to Cover:
1. Market Overview and Current Conditions
2. Investment Opportunities and Risks
3. Sector-Specific Analysis
4. Actionable Recommendations

## Content Structure:
- Opening: Hook with current market relevance
- Main Body: Data-driven analysis with clear explanations
- Conclusion: Specific action items for subscribers

## Personalization Notes:
- Adjust complexity based on subscriber experience level
- Include relevant examples for different portfolio sizes
- Provide alternative strategies for varying risk tolerances

*This content was AI-generated and requires editorial review before publication.*
    `;

    // Update the content request with AI-generated content
    const [updatedRequest] = await db
      .update(contentRequests)
      .set({
        content: aiGeneratedContent,
        aiProcessed: true,
        status: 'review',
        updatedAt: new Date(),
      })
      .where(and(
        eq(contentRequests.id, id),
        eq(contentRequests.publisherId, publisherId)
      ))
      .returning();

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Content processed with AI successfully'
    });
  } catch (error) {
    console.error('Error processing content with AI:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process content with AI' 
    });
  }
});

/**
 * Create a content draft for a request
 */
router.post('/content-requests/:id/drafts', async (req, res) => {
  try {
    const { id: contentRequestId } = req.params;
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication
    const authorId = 'demo-user'; // TODO: Extract from authentication

    const validatedData = insertContentDraftSchema.parse({
      ...req.body,
      contentRequestId,
      publisherId,
      authorId,
      wordCount: req.body.content ? req.body.content.split(' ').length : 0,
    });

    const [newDraft] = await db
      .insert(contentDrafts)
      .values(validatedData)
      .returning();

    res.status(201).json({
      success: true,
      data: newDraft,
      message: 'Content draft created successfully'
    });
  } catch (error) {
    console.error('Error creating content draft:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create content draft' 
    });
  }
});

/**
 * Get all drafts for a content request
 */
router.get('/content-requests/:id/drafts', async (req, res) => {
  try {
    const { id: contentRequestId } = req.params;
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    const drafts = await db
      .select()
      .from(contentDrafts)
      .where(and(
        eq(contentDrafts.contentRequestId, contentRequestId),
        eq(contentDrafts.publisherId, publisherId)
      ))
      .orderBy(desc(contentDrafts.version));

    res.json({
      success: true,
      data: drafts,
      count: drafts.length
    });
  } catch (error) {
    console.error('Error fetching content drafts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content drafts' 
    });
  }
});

/**
 * Create email campaign from content request
 */
router.post('/content-requests/:id/create-campaign', async (req, res) => {
  try {
    const { id: contentRequestId } = req.params;
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication
    const createdBy = 'demo-user'; // TODO: Extract from authentication

    // Get the content request
    const [request] = await db
      .select()
      .from(contentRequests)
      .where(and(
        eq(contentRequests.id, contentRequestId),
        eq(contentRequests.publisherId, publisherId)
      ));

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Content request not found'
      });
    }

    if (!request.content) {
      return res.status(400).json({
        success: false,
        error: 'Content request must have content before creating campaign'
      });
    }

    const campaignData = insertEmailCampaignSchema.parse({
      contentRequestId,
      title: request.title,
      baseSubject: `${request.title} - Market Alert`,
      baseContent: request.content,
      targetCohorts: request.targetCohorts || [],
      marketTriggers: request.marketTriggers || [],
      publisherId,
      createdBy,
      status: 'draft'
    });

    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values([campaignData])
      .returning();

    // Update content request status
    await db
      .update(contentRequests)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(contentRequests.id, contentRequestId));

    res.status(201).json({
      success: true,
      data: newCampaign,
      message: 'Email campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create email campaign' 
    });
  }
});

/**
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    const [stats] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        pendingReview: sql<number>`count(*) filter (where status = 'review')`,
        inProgress: sql<number>`count(*) filter (where status = 'in_progress')`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        urgentPriority: sql<number>`count(*) filter (where priority = 'urgent')`,
        totalReach: sql<number>`sum(estimated_reach)`,
      })
      .from(contentRequests)
      .where(eq(contentRequests.publisherId, publisherId));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
});

/**
 * Get advanced cohort analysis
 */
router.get('/cohorts/analysis', async (req, res) => {
  try {
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    const cohortAnalysis = await cohortDetectionService.detectSubscriberCohorts(publisherId);
    
    res.json({
      success: true,
      data: cohortAnalysis,
      message: 'Cohort analysis completed successfully'
    });
  } catch (error) {
    console.error('Error in cohort analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze subscriber cohorts' 
    });
  }
});

/**
 * Get churn risk prediction
 */
router.get('/churn-prediction', async (req, res) => {
  try {
    const publisherId = 'demo-publisher'; // TODO: Extract from authentication

    const churnPrediction = await cohortDetectionService.predictChurnRisk(publisherId);
    
    res.json({
      success: true,
      data: churnPrediction,
      message: 'Churn prediction completed successfully'
    });
  } catch (error) {
    console.error('Error in churn prediction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to predict churn risk' 
    });
  }
});

/**
 * Sharpen email content for cohorts
 */
router.post('/email/sharpen', async (req, res) => {
  try {
    const { baseSubject, baseContent, targetCohorts, marketContext } = req.body;
    
    if (!baseSubject || !baseContent) {
      return res.status(400).json({
        success: false,
        error: 'Base subject and content are required'
      });
    }

    // Use provided cohorts or get from analysis
    let cohorts = targetCohorts;
    if (!cohorts || cohorts.length === 0) {
      const publisherId = 'demo-publisher'; // TODO: Extract from authentication
      const cohortAnalysis = await cohortDetectionService.detectSubscriberCohorts(publisherId);
      cohorts = cohortAnalysis.cohorts.map(c => ({
        id: c.id,
        name: c.name,
        characteristics: c.characteristics,
        investmentSophistication: 'intermediate', // Default
        riskTolerance: 'moderate', // Default
        investmentStyle: 'growth', // Default
        preferredContentTypes: c.engagementProfile.preferredContentTypes,
        avgEngagementScore: c.engagementProfile.avgEngagementScore
      }));
    }

    const sharpenedEmails = await emailSharpeningService.sharpenEmailForCohorts(
      baseSubject,
      baseContent,
      cohorts,
      marketContext
    );

    res.json({
      success: true,
      data: {
        sharpenedEmails,
        totalCohorts: cohorts.length
      },
      message: 'Email sharpening completed successfully'
    });
  } catch (error) {
    console.error('Error in email sharpening:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sharpen email content' 
    });
  }
});

/**
 * Analyze email campaign performance
 */
router.post('/campaigns/:id/analyze', async (req, res) => {
  try {
    const { id: campaignId } = req.params;
    const { cohortPerformance } = req.body;

    if (!cohortPerformance || !Array.isArray(cohortPerformance)) {
      return res.status(400).json({
        success: false,
        error: 'Cohort performance data is required'
      });
    }

    const analysis = await emailSharpeningService.analyzeEmailPerformance(
      campaignId,
      cohortPerformance
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Campaign performance analysis completed'
    });
  } catch (error) {
    console.error('Error in campaign analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze campaign performance' 
    });
  }
});

/**
 * Get market intelligence and context
 */
router.get('/market/context', async (req, res) => {
  try {
    const marketContext = await marketIntelligenceService.getMarketContext();
    
    res.json({
      success: true,
      data: marketContext,
      message: 'Market context retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching market context:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch market context' 
    });
  }
});

/**
 * Get optimal send timing based on market conditions
 */
router.get('/market/send-timing', async (req, res) => {
  try {
    const sendTiming = await marketIntelligenceService.getOptimalSendTiming();
    
    res.json({
      success: true,
      data: sendTiming,
      message: 'Send timing analysis completed'
    });
  } catch (error) {
    console.error('Error analyzing send timing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze send timing' 
    });
  }
});

/**
 * Get content emphasis recommendations
 */
router.get('/market/content-recommendations', async (req, res) => {
  try {
    const recommendations = await marketIntelligenceService.getContentEmphasisRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
      message: 'Content recommendations generated'
    });
  } catch (error) {
    console.error('Error generating content recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate content recommendations' 
    });
  }
});

/**
 * Get publisher intelligence dashboard
 */
router.get('/publisher/dashboard', async (req, res) => {
  try {
    const publisherId = 'demo-publisher';
    const dashboardData = await publisherIntelligenceService.getPublisherDashboardData(publisherId);
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Publisher dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching publisher dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * Get market insights and content opportunities
 */
router.get('/publisher/insights', async (req, res) => {
  try {
    const publisherId = 'demo-publisher';
    const insights = await publisherIntelligenceService.generatePublisherInsights(publisherId);
    
    res.json({
      success: true,
      data: insights,
      message: 'Publisher insights generated successfully'
    });
  } catch (error) {
    console.error('Error generating publisher insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

/**
 * Enhance email content with real market data
 */
router.post('/email/enhance', async (req, res) => {
  try {
    const { content, symbols = [], autoDetectSymbols = true } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const enhancement = await publisherIntelligenceService.enhanceEmailContent(
      content,
      symbols,
      autoDetectSymbols
    );
    
    res.json({
      success: true,
      data: enhancement,
      message: 'Email content enhanced with real market data'
    });
  } catch (error) {
    console.error('Error enhancing email content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance email content'
    });
  }
});

/**
 * Get real-time market events
 */
router.get('/market/events', async (req, res) => {
  try {
    const { categories } = req.query;
    const categoriesArray = categories ? (categories as string).split(',') : undefined;
    
    const events = await marketAlertService.getMarketEvents(categoriesArray);
    
    res.json({
      success: true,
      data: events,
      message: 'Market events retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching market events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market events'
    });
  }
});

/**
 * Get sector performance data
 */
router.get('/market/sectors', async (req, res) => {
  try {
    const sectorPerformance = await marketAlertService.getSectorPerformance();
    
    res.json({
      success: true,
      data: sectorPerformance,
      message: 'Sector performance data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sector performance'
    });
  }
});

/**
 * Check market alerts for publisher
 */
router.get('/market/alerts', async (req, res) => {
  try {
    const publisherId = 'demo-publisher';
    const alerts = await marketAlertService.checkMarketAlerts(publisherId);
    
    res.json({
      success: true,
      data: alerts,
      message: 'Market alerts checked successfully'
    });
  } catch (error) {
    console.error('Error checking market alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check market alerts'
    });
  }
});

export { router as contentRouter };
export function contentManagementRoutes(app: any) {
  app.use('/api/content', router);
}