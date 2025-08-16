import express from 'express';
import { createAIContentProcessor } from './services/ai-content-processor';
import { createMarketIntelligenceService } from './services/market-intelligence';
import { authenticateAndSetTenant, requireTenant } from './middleware/tenant';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateAndSetTenant);
router.use(requireTenant);

// Helper function to get tenant ID from request
const getTenantId = (req: express.Request): string => {
  return req.tenant!.publisherId;
};

/**
 * Analyze content for sentiment, readability, and engagement
 */
router.post('/analyze-content', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { content, subject } = req.body;

    if (!content || !subject) {
      return res.status(400).json({ error: 'Content and subject are required' });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    const analysis = await aiProcessor.analyzeContent(content, subject);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

/**
 * Generate subject line variations
 */
router.post('/generate-subject-variations', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { originalSubject, content, targetAudience } = req.body;

    if (!originalSubject || !content || !targetAudience) {
      return res.status(400).json({ 
        error: 'Original subject, content, and target audience are required' 
      });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    const variations = await aiProcessor.generateSubjectLineVariations(
      originalSubject, 
      content, 
      targetAudience
    );

    res.json({
      success: true,
      variations
    });
  } catch (error) {
    console.error('Error generating subject variations:', error);
    res.status(500).json({ error: 'Failed to generate subject variations' });
  }
});

/**
 * Generate content suggestions
 */
router.post('/generate-suggestions', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { content, targetAudience, includeMarketContext } = req.body;

    if (!content || !targetAudience) {
      return res.status(400).json({ 
        error: 'Content and target audience are required' 
      });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    let marketContext;

    if (includeMarketContext) {
      const marketService = createMarketIntelligenceService(publisherId);
      const context = await marketService.getMarketContext();
      marketContext = {
        relevantNews: context.relevantNews.map(n => n.title),
        marketTrends: context.keyInsights,
        sectorPerformance: Object.fromEntries(
          context.sectorPerformance.map(s => [s.sector, s.performance])
        ),
        volatilityIndex: context.volatilityIndex,
        sentimentIndicators: [context.sentiment.overall]
      };
    }

    const suggestions = await aiProcessor.generateContentSuggestions(
      content, 
      targetAudience, 
      marketContext
    );

    res.json({
      success: true,
      suggestions,
      marketContext
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

/**
 * Personalize content for cohorts
 */
router.post('/personalize-cohorts', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { content, subject, cohorts } = req.body;

    if (!content || !subject || !cohorts || !Array.isArray(cohorts)) {
      return res.status(400).json({ 
        error: 'Content, subject, and cohorts array are required' 
      });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    const personalizations = await aiProcessor.personalizeForCohorts(
      content, 
      subject, 
      cohorts
    );

    res.json({
      success: true,
      personalizations
    });
  } catch (error) {
    console.error('Error personalizing for cohorts:', error);
    res.status(500).json({ error: 'Failed to personalize content' });
  }
});

/**
 * Optimize send timing
 */
router.post('/optimize-timing', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { content, targetAudience, urgencyLevel = 0.5 } = req.body;

    if (!content || !targetAudience) {
      return res.status(400).json({ 
        error: 'Content and target audience are required' 
      });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    const timing = await aiProcessor.optimizeSendTiming(
      content, 
      targetAudience, 
      urgencyLevel
    );

    res.json({
      success: true,
      timing
    });
  } catch (error) {
    console.error('Error optimizing timing:', error);
    res.status(500).json({ error: 'Failed to optimize timing' });
  }
});

/**
 * Enhance content with market context
 */
router.post('/enhance-market-context', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { content, symbols, categories } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const marketService = createMarketIntelligenceService(publisherId);
    const aiProcessor = createAIContentProcessor(publisherId);

    // Get market context
    const context = await marketService.getMarketContext(categories);
    
    // Enhance content with market context
    const enhancement = await aiProcessor.enhanceWithMarketContext(content, {
      relevantNews: context.relevantNews.map(n => n.title),
      marketTrends: context.keyInsights,
      sectorPerformance: Object.fromEntries(
        context.sectorPerformance.map(s => [s.sector, s.performance])
      ),
      volatilityIndex: context.volatilityIndex,
      sentimentIndicators: [context.sentiment.overall]
    });

    res.json({
      success: true,
      enhancement,
      marketContext: context
    });
  } catch (error) {
    console.error('Error enhancing with market context:', error);
    res.status(500).json({ error: 'Failed to enhance content' });
  }
});

/**
 * Get market intelligence data
 */
router.get('/market-intelligence', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { symbols, categories, limit } = req.query;

    const marketService = createMarketIntelligenceService(publisherId);
    
    const symbolsArray = symbols ? (symbols as string).split(',') : undefined;
    const categoriesArray = categories ? (categories as string).split(',') : undefined;
    const newsLimit = limit ? parseInt(limit as string) : 20;

    const [news, marketData, sectorPerformance, sentiment] = await Promise.all([
      marketService.getRelevantNews(symbolsArray, categoriesArray, newsLimit),
      symbolsArray ? marketService.getMarketData(symbolsArray) : Promise.resolve([]),
      marketService.getSectorPerformance(),
      marketService.getMarketSentiment()
    ]);

    res.json({
      success: true,
      data: {
        news,
        marketData,
        sectorPerformance,
        sentiment,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch market intelligence' });
  }
});

/**
 * Get comprehensive market context for content creation
 */
router.get('/market-context', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { interests, riskTolerance } = req.query;

    const marketService = createMarketIntelligenceService(publisherId);
    
    const interestsArray = interests ? (interests as string).split(',') : undefined;
    const riskLevel = riskTolerance as 'low' | 'medium' | 'high' | undefined;

    const context = await marketService.getMarketContext(interestsArray, riskLevel);

    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Error fetching market context:', error);
    res.status(500).json({ error: 'Failed to fetch market context' });
  }
});

/**
 * Process complete content workflow (analysis + personalization + optimization)
 */
router.post('/process-workflow', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { 
      content, 
      subject, 
      targetAudience, 
      cohorts, 
      includeMarketContext = true,
      optimizeTiming = true 
    } = req.body;

    if (!content || !subject || !targetAudience) {
      return res.status(400).json({ 
        error: 'Content, subject, and target audience are required' 
      });
    }

    const aiProcessor = createAIContentProcessor(publisherId);
    const marketService = createMarketIntelligenceService(publisherId);

    // Run all processing steps in parallel where possible
    const [analysis, variations, suggestions] = await Promise.all([
      aiProcessor.analyzeContent(content, subject),
      aiProcessor.generateSubjectLineVariations(subject, content, targetAudience),
      aiProcessor.generateContentSuggestions(content, targetAudience)
    ]);

    let marketContext;
    let enhancement;
    if (includeMarketContext) {
      const context = await marketService.getMarketContext();
      marketContext = context;
      
      enhancement = await aiProcessor.enhanceWithMarketContext(content, {
        relevantNews: context.relevantNews.map(n => n.title),
        marketTrends: context.keyInsights,
        sectorPerformance: Object.fromEntries(
          context.sectorPerformance.map(s => [s.sector, s.performance])
        ),
        volatilityIndex: context.volatilityIndex,
        sentimentIndicators: [context.sentiment.overall]
      });
    }

    let personalizations;
    if (cohorts && Array.isArray(cohorts)) {
      personalizations = await aiProcessor.personalizeForCohorts(content, subject, cohorts);
    }

    let timing;
    if (optimizeTiming) {
      timing = await aiProcessor.optimizeSendTiming(content, targetAudience, analysis.urgencyLevel);
    }

    res.json({
      success: true,
      workflow: {
        analysis,
        variations,
        suggestions,
        personalizations,
        timing,
        marketContext,
        enhancement,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing workflow:', error);
    res.status(500).json({ error: 'Failed to process content workflow' });
  }
});

export { router as aiProcessingRoutes };

