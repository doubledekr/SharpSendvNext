import { Router } from 'express';
// Remove unused z import
import { db } from './database';
import { contentRequests, contentDrafts, emailCampaigns, insertContentRequestSchema, insertContentDraftSchema, insertEmailCampaignSchema } from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

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

export { router as contentManagementRoutes };