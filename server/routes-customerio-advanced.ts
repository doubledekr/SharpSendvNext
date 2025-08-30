import { Router } from 'express';
import { CustomerIoIntegrationService } from './services/customerio-integration';

// Initialize Customer.io service with hardcoded credentials
const customerIOService = new CustomerIoIntegrationService({
  siteId: process.env.CUSTOMERIO_SITE_ID || 'dc2065fe6d3d877344ce',
  trackApiKey: process.env.CUSTOMERIO_TRACK_API_KEY || 'c3de70c01cac3fa70b5a',
  appApiKey: process.env.CUSTOMERIO_APP_API_KEY || 'd81e4a4d305d30569f6867081bade0c9',
  region: (process.env.CUSTOMERIO_REGION as 'us' | 'eu') || 'us'
});

const router = Router();

// Individual User Management Routes

/**
 * POST /api/customerio/users/track-with-tags
 * Track individual user with SharpSend attributes and tags
 */
router.post('/users/track-with-tags', async (req, res) => {
  try {
    const { userId, attributes, tags } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await customerIOService.trackUserWithTags(userId, attributes || {}, tags || []);
    
    res.json({
      success: true,
      message: `User ${userId} tracked with ${tags?.length || 0} tags`,
      userId,
      tagsApplied: tags || []
    });
  } catch (error: any) {
    console.error('Error tracking user with tags:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customerio/users/auto-tag
 * Auto-tag users based on behavior analysis
 */
router.post('/users/auto-tag', async (req, res) => {
  try {
    const { userData } = req.body;
    
    if (!Array.isArray(userData)) {
      return res.status(400).json({ error: 'userData must be an array' });
    }

    await customerIOService.autoTagUsersByBehavior(userData);
    
    res.json({
      success: true,
      message: `Auto-tagged ${userData.length} users based on behavior`,
      processedUsers: userData.length
    });
  } catch (error: any) {
    console.error('Error auto-tagging users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Segment Management Routes

/**
 * POST /api/customerio/segments/create-from-tags
 * Create dynamic segment based on tags and criteria
 */
router.post('/segments/create-from-tags', async (req, res) => {
  try {
    const { name, description, requiredTags, additionalCriteria } = req.body;
    
    if (!name || !requiredTags || !Array.isArray(requiredTags)) {
      return res.status(400).json({ error: 'name and requiredTags array are required' });
    }

    const segment = await customerIOService.createSegmentFromTags(
      name, 
      description || `Segment created from tags: ${requiredTags.join(', ')}`,
      requiredTags,
      additionalCriteria || []
    );
    
    res.json({
      success: true,
      message: `Segment "${name}" created with ${requiredTags.length} tag requirements`,
      segment
    });
  } catch (error: any) {
    console.error('Error creating segment from tags:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customerio/segments/:segmentId/add-users
 * Add users to manual segment
 */
router.post('/segments/:segmentId/add-users', async (req, res) => {
  try {
    const { segmentId } = req.params;
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    await customerIOService.addUsersToSegment(segmentId, userIds);
    
    res.json({
      success: true,
      message: `Added ${userIds.length} users to segment ${segmentId}`,
      segmentId,
      usersAdded: userIds.length
    });
  } catch (error: any) {
    console.error('Error adding users to segment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customerio/segments/:segmentId/members-with-tags
 * Get segment members with their tags and attributes
 */
router.get('/segments/:segmentId/members-with-tags', async (req, res) => {
  try {
    const { segmentId } = req.params;
    
    const members = await customerIOService.getSegmentMembersWithTags(segmentId);
    
    res.json({
      success: true,
      segmentId,
      memberCount: members.length,
      members
    });
  } catch (error: any) {
    console.error('Error getting segment members with tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Advanced Integration Routes

/**
 * POST /api/customerio/assignments/:assignmentId/create-targeted-variations
 * Create email variations for targeted groups based on assignment
 */
router.post('/assignments/:assignmentId/create-targeted-variations', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { targetSegments } = req.body;
    
    if (!Array.isArray(targetSegments)) {
      return res.status(400).json({ error: 'targetSegments must be an array' });
    }

    const variations = await Promise.all(targetSegments.map(async (segmentId: string) => {
      try {
        // Get segment members with tags
        const members = await customerIOService.getSegmentMembersWithTags(segmentId);
        
        // Analyze common tags
        const tagFrequency: Record<string, number> = {};
        members.forEach(member => {
          member.sharpsendTags?.forEach((tag: string) => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        });
        
        // Find most common tags (present in >50% of members)
        const commonTags = Object.entries(tagFrequency)
          .filter(([tag, count]) => count > members.length * 0.5)
          .map(([tag]) => tag);
        
        // Generate email variation based on common tags
        const variation = {
          segmentId,
          subscriberCount: members.length,
          commonTags,
          emailVariation: {
            subject: generateSubjectForTags(assignmentId, commonTags),
            tone: getToneForTags(commonTags),
            contentDepth: getContentDepthForTags(commonTags),
            callToAction: getCTAForTags(commonTags)
          }
        };
        
        return variation;
      } catch (error) {
        console.error(`Error processing segment ${segmentId}:`, error);
        return {
          segmentId,
          error: error.message,
          subscriberCount: 0,
          commonTags: [],
          emailVariation: null
        };
      }
    }));
    
    res.json({
      success: true,
      assignmentId,
      variations,
      totalSegments: targetSegments.length
    });
  } catch (error: any) {
    console.error('Error creating targeted variations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customerio/pixel-tracking/:pixelId/process
 * Process pixel tracking and update user engagement data
 */
router.post('/pixel-tracking/:pixelId/process', async (req, res) => {
  try {
    const { pixelId } = req.params;
    const { actionType, userId, assignmentId } = req.body;
    
    if (!userId || !assignmentId) {
      return res.status(400).json({ error: 'userId and assignmentId are required' });
    }

    // Update user engagement based on action
    const engagementUpdates: Record<string, any> = {
      sharpsend_last_interaction: new Date().toISOString(),
      sharpsend_last_assignment: assignmentId
    };

    if (actionType === 'open') {
      engagementUpdates.sharpsend_last_open = new Date().toISOString();
      // Increment open count (would need to fetch current value in real implementation)
      engagementUpdates.sharpsend_total_opens = 'increment';
    } else if (actionType === 'click') {
      engagementUpdates.sharpsend_last_click = new Date().toISOString();
      engagementUpdates.sharpsend_total_clicks = 'increment';
    }

    // Auto-tag based on engagement level
    const tags = [];
    if (actionType === 'open') tags.push('email_opener');
    if (actionType === 'click') tags.push('active_clicker');

    await customerIOService.trackUserWithTags(userId, engagementUpdates, tags);
    
    res.json({
      success: true,
      message: `Processed ${actionType} tracking for user ${userId}`,
      pixelId,
      actionType,
      userId,
      assignmentId,
      tagsApplied: tags
    });
  } catch (error: any) {
    console.error('Error processing pixel tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for email personalization

function generateSubjectForTags(assignmentId: string, tags: string[]): string {
  if (tags.includes('high_engagement')) {
    return "Exclusive: Advanced Market Analysis Inside";
  }
  if (tags.includes('crypto_enthusiast')) {
    return "Crypto Alert: Key Developments You Need to Know";
  }
  if (tags.includes('high_value')) {
    return "Premium Insights: Your VIP Market Report";
  }
  return "Market Update: Important Developments";
}

function getToneForTags(tags: string[]): string {
  if (tags.includes('high_engagement') || tags.includes('premium_subscriber')) {
    return 'expert';
  }
  if (tags.includes('crypto_enthusiast')) {
    return 'analytical';
  }
  return 'professional';
}

function getContentDepthForTags(tags: string[]): string {
  if (tags.includes('high_engagement') || tags.includes('premium_subscriber')) {
    return 'advanced';
  }
  if (tags.includes('consistent_reader')) {
    return 'intermediate';
  }
  return 'basic';
}

function getCTAForTags(tags: string[]): string {
  if (tags.includes('premium_subscriber')) {
    return 'premium_webinar';
  }
  if (tags.includes('high_value')) {
    return 'exclusive_content';
  }
  if (tags.includes('crypto_enthusiast')) {
    return 'crypto_analysis';
  }
  return 'learn_more';
}

export default router;