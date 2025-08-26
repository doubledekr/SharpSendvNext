/**
 * SharpSend Intelligence API Routes
 * Provides endpoints for advanced pixel tracking, AI segmentation, and behavioral intelligence
 */

import { Router } from 'express';
import { sharpSendPixelEngine } from './services/sharpsend-pixel-engine';
import { sharpSendSegmentationEngine } from './services/sharpsend-segmentation-engine';
import { sharpSendIntelligenceLoop } from './services/sharpsend-intelligence-loop';
import { db } from './db';
import { pixels, pixelEvents, behavioralPredictions, segmentDefinitions, subscribers } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

/**
 * Generate smart tracking pixel with behavioral predictions
 * POST /api/sharpsend/pixel/generate
 */
router.post('/pixel/generate', async (req, res) => {
  try {
    const { subscriberId, sendId, segmentContext } = req.body;
    const publisherId = req.tenant?.id || 'demo-publisher';
    
    if (!subscriberId || !sendId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Generate smart pixel with predictions
    const result = await sharpSendPixelEngine.generateSmartPixel(
      subscriberId,
      publisherId,
      sendId,
      segmentContext || []
    );
    
    res.json({
      success: true,
      pixelUrl: result.pixelUrl,
      pixelCode: result.pixelCode,
      predictions: result.predictions,
      message: 'Smart pixel generated with behavioral predictions'
    });
  } catch (error) {
    console.error('Error generating smart pixel:', error);
    res.status(500).json({ error: 'Failed to generate smart pixel' });
  }
});

/**
 * Process pixel hit and update segments
 * GET /api/sharpsend/px/:pixelCode.gif
 */
router.get('/px/:pixelCode.gif', async (req, res) => {
  try {
    const { pixelCode } = req.params;
    
    // Prepare hit data
    const hitData = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      referer: req.headers['referer'],
      timestamp: new Date()
    };
    
    // Process pixel hit
    const result = await sharpSendPixelEngine.processPixelHit(pixelCode, hitData);
    
    // Return 1x1 transparent GIF
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(gif);
    
    // Log the tracking result (async, non-blocking)
    console.log(`Pixel hit processed: ${pixelCode}`, {
      segmentUpdates: result.segmentUpdates.length,
      accuracyScore: result.accuracyScore
    });
  } catch (error) {
    console.error('Error processing pixel hit:', error);
    // Still return the GIF even if processing fails
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    res.send(gif);
  }
});

/**
 * Create AI-powered segments from subscriber data
 * POST /api/sharpsend/segments/generate
 */
router.post('/segments/generate', async (req, res) => {
  try {
    const { subscriberData, businessContext } = req.body;
    const publisherId = req.tenant?.id || 'demo-publisher';
    
    // Generate infinite segments from finite tags
    const segments = await sharpSendSegmentationEngine.createInfiniteSegmentsFromFiniteTags(
      publisherId,
      subscriberData || {}
    );
    
    res.json({
      success: true,
      segments,
      totalSegments: segments.length,
      message: `Generated ${segments.length} intelligent segments using AI`
    });
  } catch (error) {
    console.error('Error generating segments:', error);
    res.status(500).json({ error: 'Failed to generate segments' });
  }
});

/**
 * Sync segments across email platforms
 * POST /api/sharpsend/segments/sync
 */
router.post('/segments/sync', async (req, res) => {
  try {
    const { subscriberId, segmentFingerprint } = req.body;
    
    if (!subscriberId || segmentFingerprint === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Sync across platforms
    const syncResults = await sharpSendSegmentationEngine.syncAcrossPlatforms(
      subscriberId,
      segmentFingerprint
    );
    
    res.json({
      success: true,
      syncResults,
      message: 'Segments synchronized across platforms'
    });
  } catch (error) {
    console.error('Error syncing segments:', error);
    res.status(500).json({ error: 'Failed to sync segments' });
  }
});

/**
 * Process engagement feedback for model improvement
 * POST /api/sharpsend/intelligence/feedback
 */
router.post('/intelligence/feedback', async (req, res) => {
  try {
    const { engagementData } = req.body;
    const publisherId = req.tenant?.id || 'demo-publisher';
    
    // Process feedback and update models
    const result = await sharpSendIntelligenceLoop.processEngagementFeedback(
      publisherId,
      engagementData
    );
    
    res.json({
      success: true,
      modelUpdates: result.modelUpdates,
      newSegments: result.newSegments,
      testResults: result.testResults,
      message: 'Engagement feedback processed successfully'
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

/**
 * Generate optimized content for subscriber
 * POST /api/sharpsend/content/optimize
 */
router.post('/content/optimize', async (req, res) => {
  try {
    const { subscriberId } = req.body;
    const publisherId = req.tenant?.id || 'demo-publisher';
    
    if (!subscriberId) {
      return res.status(400).json({ error: 'Missing subscriberId' });
    }
    
    // Generate optimized content
    const result = await sharpSendIntelligenceLoop.adaptiveContentOptimization(
      subscriberId,
      publisherId
    );
    
    res.json({
      success: true,
      content: result.optimizedContent,
      parameters: result.parameters,
      confidence: result.confidence,
      message: 'Content optimized for subscriber'
    });
  } catch (error) {
    console.error('Error optimizing content:', error);
    res.status(500).json({ error: 'Failed to optimize content' });
  }
});

/**
 * Get behavioral predictions for subscriber
 * GET /api/sharpsend/predictions/:subscriberId
 */
router.get('/predictions/:subscriberId', async (req, res) => {
  try {
    const { subscriberId } = req.params;
    
    // Get latest predictions
    const [prediction] = await db.select()
      .from(behavioralPredictions)
      .where(eq(behavioralPredictions.subscriberId, subscriberId))
      .orderBy(desc(behavioralPredictions.createdAt))
      .limit(1);
    
    if (!prediction) {
      return res.status(404).json({ error: 'No predictions found for subscriber' });
    }
    
    res.json({
      success: true,
      subscriberId,
      predictions: prediction.predictions,
      accuracy: prediction.accuracy,
      createdAt: prediction.createdAt
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

/**
 * Get pixel events for analysis
 * GET /api/sharpsend/events
 */
router.get('/events', async (req, res) => {
  try {
    const publisherId = req.tenant?.id || 'demo-publisher';
    const { limit = 100, subscriberId, eventType } = req.query;
    
    // Build query
    const conditions = [eq(pixelEvents.publisherId, publisherId)];
    
    if (subscriberId) {
      conditions.push(eq(pixelEvents.subscriberId, subscriberId as string));
    }
    
    if (eventType) {
      conditions.push(eq(pixelEvents.eventType, eventType as string));
    }
    
    // Get events
    const events = await db.select()
      .from(pixelEvents)
      .where(and(...conditions))
      .orderBy(desc(pixelEvents.timestamp))
      .limit(Number(limit));
    
    res.json({
      success: true,
      events,
      totalEvents: events.length
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

/**
 * Get segment definitions
 * GET /api/sharpsend/segments
 */
router.get('/segments', async (req, res) => {
  try {
    const publisherId = req.tenant?.id || 'demo-publisher';
    
    // Get segment definitions
    const segments = await db.select()
      .from(segmentDefinitions)
      .where(eq(segmentDefinitions.publisherId, publisherId))
      .orderBy(desc(segmentDefinitions.createdAt));
    
    res.json({
      success: true,
      segments,
      totalSegments: segments.length
    });
  } catch (error) {
    console.error('Error getting segments:', error);
    res.status(500).json({ error: 'Failed to get segments' });
  }
});

/**
 * Calculate segment fingerprint
 * POST /api/sharpsend/segments/fingerprint
 */
router.post('/segments/fingerprint', async (req, res) => {
  try {
    const { taxonomyMapping } = req.body;
    
    if (!taxonomyMapping) {
      return res.status(400).json({ error: 'Missing taxonomy mapping' });
    }
    
    // Calculate fingerprint
    const fingerprint = sharpSendSegmentationEngine.calculateSegmentFingerprint(taxonomyMapping);
    
    // Convert fingerprint to platform tags
    const platformTags: Record<string, string[]> = {};
    const platforms = ['mailchimp', 'convertkit', 'sendgrid'];
    
    for (const platform of platforms) {
      platformTags[platform] = sharpSendSegmentationEngine.fingerprintToPlatformTags(
        fingerprint,
        platform
      );
    }
    
    res.json({
      success: true,
      fingerprint,
      taxonomyMapping,
      platformTags,
      message: 'Segment fingerprint calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating fingerprint:', error);
    res.status(500).json({ error: 'Failed to calculate fingerprint' });
  }
});

/**
 * Health check for SharpSend Intelligence
 * GET /api/sharpsend/health
 */
router.get('/health', async (req, res) => {
  try {
    // Check if services are initialized
    const health = {
      pixelEngine: !!sharpSendPixelEngine,
      segmentationEngine: !!sharpSendSegmentationEngine,
      intelligenceLoop: !!sharpSendIntelligenceLoop,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      status: 'healthy',
      services: health,
      message: 'SharpSend Intelligence services are operational'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed'
    });
  }
});

export const sharpSendIntelligenceRoutes = router;