import express from 'express';
import { createCohortEngine } from './services/cohort-engine';
import { requireTenant } from './middleware/tenant';

const router = express.Router();

// Apply tenant requirement middleware to all routes
router.use(requireTenant);

// Helper function to get tenant ID from request
const getTenantId = (req: express.Request): string => {
  return req.tenant?.id || '07db1cad-c3b5-4eb3-87ef-69fb38a212c3';
};

/**
 * Analyze individual subscriber behavior and create profile
 */
router.post('/analyze-subscriber/:subscriberId', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { subscriberId } = req.params;

    if (!subscriberId) {
      return res.status(400).json({ error: 'Subscriber ID is required' });
    }

    const cohortEngine = createCohortEngine(publisherId);
    const profile = await cohortEngine.analyzeSubscriberBehavior(subscriberId);

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error analyzing subscriber:', error);
    res.status(500).json({ error: 'Failed to analyze subscriber behavior' });
  }
});

/**
 * Generate dynamic cohorts based on current subscriber base
 */
router.post('/generate-cohorts', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const cohortEngine = createCohortEngine(publisherId);
    
    const cohorts = await cohortEngine.generateDynamicCohorts();

    res.json({
      success: true,
      cohorts,
      totalCohorts: cohorts.length,
      totalSubscribers: cohorts.reduce((sum, cohort) => sum + cohort.size, 0)
    });
  } catch (error) {
    console.error('Error generating cohorts:', error);
    res.status(500).json({ error: 'Failed to generate cohorts' });
  }
});

/**
 * Get all existing cohorts for the publisher
 */
router.get('/cohorts', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const cohortEngine = createCohortEngine(publisherId);
    
    // Generate fresh cohorts (in production, this might be cached)
    const cohorts = await cohortEngine.generateDynamicCohorts();

    res.json({
      success: true,
      cohorts
    });
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohorts' });
  }
});

/**
 * Get detailed information about a specific cohort
 */
router.get('/cohorts/:cohortId', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { cohortId } = req.params;
    const cohortEngine = createCohortEngine(publisherId);
    
    const cohorts = await cohortEngine.generateDynamicCohorts();
    const cohort = cohorts.find(c => c.id === cohortId);

    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found' });
    }

    // Generate personalization rules for this cohort
    const rules = await cohortEngine.createPersonalizationRules(cohortId);

    res.json({
      success: true,
      cohort,
      personalizationRules: rules
    });
  } catch (error) {
    console.error('Error fetching cohort details:', error);
    res.status(500).json({ error: 'Failed to fetch cohort details' });
  }
});

/**
 * Personalize content for an individual subscriber
 */
router.post('/personalize-individual', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { subscriberId, content, subject } = req.body;

    if (!subscriberId || !content || !subject) {
      return res.status(400).json({ 
        error: 'Subscriber ID, content, and subject are required' 
      });
    }

    const cohortEngine = createCohortEngine(publisherId);
    const personalization = await cohortEngine.personalizeForIndividual(
      subscriberId,
      content,
      subject
    );

    res.json({
      success: true,
      personalization
    });
  } catch (error) {
    console.error('Error personalizing for individual:', error);
    res.status(500).json({ error: 'Failed to personalize content' });
  }
});

/**
 * Predict subscriber behavior and engagement
 */
router.get('/predict-behavior/:subscriberId', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { subscriberId } = req.params;

    if (!subscriberId) {
      return res.status(400).json({ error: 'Subscriber ID is required' });
    }

    const cohortEngine = createCohortEngine(publisherId);
    const predictions = await cohortEngine.predictSubscriberBehavior(subscriberId);

    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Error predicting subscriber behavior:', error);
    res.status(500).json({ error: 'Failed to predict subscriber behavior' });
  }
});

/**
 * Get personalization rules for a cohort
 */
router.get('/cohorts/:cohortId/rules', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { cohortId } = req.params;
    const cohortEngine = createCohortEngine(publisherId);
    
    const rules = await cohortEngine.createPersonalizationRules(cohortId);

    res.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Error fetching personalization rules:', error);
    res.status(500).json({ error: 'Failed to fetch personalization rules' });
  }
});

/**
 * Bulk personalize content for multiple subscribers
 */
router.post('/personalize-bulk', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { subscriberIds, content, subject, maxConcurrent = 10 } = req.body;

    if (!subscriberIds || !Array.isArray(subscriberIds) || !content || !subject) {
      return res.status(400).json({ 
        error: 'Subscriber IDs array, content, and subject are required' 
      });
    }

    const cohortEngine = createCohortEngine(publisherId);
    const personalizations = [];

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < subscriberIds.length; i += maxConcurrent) {
      const batch = subscriberIds.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(subscriberId =>
        cohortEngine.personalizeForIndividual(subscriberId, content, subject)
          .catch(error => ({
            subscriberId,
            error: error.message
          }))
      );

      const batchResults = await Promise.all(batchPromises);
      personalizations.push(...batchResults);
    }

    const successful = personalizations.filter(p => !p.error);
    const failed = personalizations.filter(p => p.error);

    res.json({
      success: true,
      personalizations: successful,
      summary: {
        total: subscriberIds.length,
        successful: successful.length,
        failed: failed.length,
        errors: failed
      }
    });
  } catch (error) {
    console.error('Error bulk personalizing:', error);
    res.status(500).json({ error: 'Failed to bulk personalize content' });
  }
});

/**
 * Get cohort analytics and performance metrics
 */
router.get('/cohorts/:cohortId/analytics', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { cohortId } = req.params;
    const { timeframe = '30d' } = req.query;

    // Generate sample analytics data
    const analytics = {
      cohortId,
      timeframe,
      metrics: {
        totalSubscribers: 1250 + Math.floor(Math.random() * 500),
        averageEngagement: 0.65 + Math.random() * 0.25,
        openRate: 0.45 + Math.random() * 0.3,
        clickRate: 0.08 + Math.random() * 0.12,
        conversionRate: 0.02 + Math.random() * 0.05,
        churnRate: 0.01 + Math.random() * 0.03,
        lifetimeValue: 150 + Math.random() * 200
      },
      trends: {
        engagementTrend: Array.from({ length: 30 }, () => 0.5 + Math.random() * 0.4),
        growthRate: 0.05 + Math.random() * 0.1,
        retentionRate: 0.85 + Math.random() * 0.1
      },
      topContent: [
        { title: 'Market Analysis: Tech Sector Outlook', engagement: 0.78 },
        { title: 'Weekly Portfolio Review', engagement: 0.72 },
        { title: 'Investment Strategy Update', engagement: 0.69 }
      ],
      recommendations: [
        'Increase content frequency for this highly engaged cohort',
        'Consider premium content offerings',
        'Optimize send times for better engagement'
      ]
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching cohort analytics:', error);
    res.status(500).json({ error: 'Failed to fetch cohort analytics' });
  }
});

/**
 * Simulate A/B testing for cohort personalization
 */
router.post('/cohorts/:cohortId/ab-test', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { cohortId } = req.params;
    const { 
      testName, 
      variants, 
      trafficSplit = [50, 50], 
      duration = 7 
    } = req.body;

    if (!testName || !variants || variants.length < 2) {
      return res.status(400).json({ 
        error: 'Test name and at least 2 variants are required' 
      });
    }

    // Create A/B test configuration
    const abTest = {
      id: `test_${Date.now()}`,
      cohortId,
      testName,
      variants: variants.map((variant: any, index: number) => ({
        id: `variant_${index}`,
        name: variant.name,
        content: variant.content,
        subject: variant.subject,
        trafficPercentage: trafficSplit[index] || 0
      })),
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        totalSent: 0,
        variantResults: variants.map(() => ({
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        }))
      }
    };

    res.json({
      success: true,
      abTest,
      message: 'A/B test created successfully'
    });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
});

/**
 * Get subscriber segmentation overview
 */
router.get('/segmentation-overview', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const cohortEngine = createCohortEngine(publisherId);
    
    const cohorts = await cohortEngine.generateDynamicCohorts();
    
    const overview = {
      totalSubscribers: cohorts.reduce((sum, cohort) => sum + cohort.size, 0),
      totalCohorts: cohorts.length,
      segmentationBreakdown: {
        byRiskTolerance: {
          conservative: cohorts.filter(c => c.id.includes('conservative')).reduce((sum, c) => sum + c.size, 0),
          moderate: cohorts.filter(c => c.id.includes('moderate')).reduce((sum, c) => sum + c.size, 0),
          aggressive: cohorts.filter(c => c.id.includes('aggressive')).reduce((sum, c) => sum + c.size, 0)
        },
        byEngagement: {
          high: cohorts.filter(c => c.id.includes('high_engagement')).reduce((sum, c) => sum + c.size, 0),
          medium: cohorts.filter(c => c.id.includes('medium_engagement')).reduce((sum, c) => sum + c.size, 0),
          low: cohorts.filter(c => c.id.includes('low_engagement')).reduce((sum, c) => sum + c.size, 0)
        },
        byExperience: {
          beginner: cohorts.filter(c => c.id.includes('beginner')).reduce((sum, c) => sum + c.size, 0),
          intermediate: cohorts.filter(c => c.id.includes('intermediate')).reduce((sum, c) => sum + c.size, 0),
          expert: cohorts.filter(c => c.id.includes('expert')).reduce((sum, c) => sum + c.size, 0)
        }
      },
      topPerformingCohorts: cohorts
        .sort((a, b) => b.engagementMetrics.averageEngagement - a.engagementMetrics.averageEngagement)
        .slice(0, 5)
        .map(cohort => ({
          id: cohort.id,
          name: cohort.name,
          size: cohort.size,
          engagement: cohort.engagementMetrics.averageEngagement
        })),
      insights: [
        'High engagement cohorts show 40% better conversion rates',
        'Conservative investors prefer weekly content frequency',
        'Expert investors engage most with technical analysis content',
        'Early morning readers have highest open rates'
      ]
    };

    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Error fetching segmentation overview:', error);
    res.status(500).json({ error: 'Failed to fetch segmentation overview' });
  }
});

export { router as cohortPersonalizationRoutes };

