import { Request, Response, Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { 
  assignments, 
  emailVariations,
  imageAttachments,
  imagePixelEvents
} from '@shared/schema';
import {
  broadcastQueue,
  broadcastSendLogs
} from '@shared/schema-multitenant';

const router = Router();

// Clear all test data for demo publisher
router.post('/api/cleanup/test-data', async (req: Request, res: Response) => {
  try {
    // Both schemas use the same publisher ID
    const publisherId = 'demo-publisher';
    
    console.log('Starting cleanup of test data for demo publisher...');
    
    // Clear broadcast send logs
    try {
      const deletedLogs = await db
        .delete(broadcastSendLogs)
        .where(eq(broadcastSendLogs.publisherId, publisherId))
        .returning();
      console.log(`Deleted ${deletedLogs.length} broadcast send logs`);
    } catch (e) {
      console.log('No broadcast send logs table or already empty');
    }
    
    // Clear broadcast queue
    try {
      const deletedBroadcasts = await db
        .delete(broadcastQueue)
        .where(eq(broadcastQueue.publisherId, publisherId))
        .returning();
      console.log(`Deleted ${deletedBroadcasts.length} broadcast queue items`);
    } catch (e) {
      console.log('No broadcast queue table or already empty');
    }
    
    // Clear email variations
    try {
      const deletedVariations = await db
        .delete(emailVariations)
        .where(eq(emailVariations.publisherId, publisherId))
        .returning();
      console.log(`Deleted ${deletedVariations.length} email variations`);
    } catch (e) {
      console.log('No email variations table or already empty');
    }
    
    // Clear image pixel events
    try {
      const deletedPixelEvents = await db
        .delete(imagePixelEvents)
        .where(eq(imagePixelEvents.publisherId, publisherId))
        .returning();
      console.log(`Deleted ${deletedPixelEvents.length} image pixel events`);
    } catch (e) {
      console.log('No image pixel events table or already empty');
    }
    
    // Clear image attachments
    try {
      const deletedAttachments = await db
        .delete(imageAttachments)
        .where(eq(imageAttachments.publisherId, publisherId))
        .returning();
      console.log(`Deleted ${deletedAttachments.length} image attachments`);
    } catch (e) {
      console.log('No image attachments table or already empty');
    }
    
    // Clear assignments - LAST as other tables may reference it
    try {
      const deletedAssignments = await db
        .delete(assignments)
        .where(eq(assignments.publisherId, publisherId))
        .returning();
      console.log(`Deleted ${deletedAssignments.length} assignments`);
    } catch (e) {
      console.log('No assignments table or already empty');
    }
    
    console.log('Test data cleanup completed successfully!');
    
    res.json({
      success: true,
      message: 'All test data cleared successfully',
      details: {
        clearedTables: [
          'broadcast_send_logs',
          'broadcast_queue',
          'email_variations',
          'image_pixel_events',
          'image_attachments',
          'assignments'
        ]
      }
    });
  } catch (error) {
    console.error('Error clearing test data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear specific assignment and related data
router.delete('/api/cleanup/assignment/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const demoPublisherId = 'b1953bbb-178c-41ed-ac31-21fd2ab16c3d';
    
    // Delete related broadcast send logs for this assignment's broadcasts
    const relatedBroadcasts = await db.select({ id: broadcastQueue.id })
      .from(broadcastQueue)
      .where(and(
        eq(broadcastQueue.assignmentId, id),
        eq(broadcastQueue.publisherId, demoPublisherId)
      ));
    
    for (const broadcast of relatedBroadcasts) {
      await db.delete(broadcastSendLogs)
        .where(and(
          eq(broadcastSendLogs.broadcastId, broadcast.id),
          eq(broadcastSendLogs.publisherId, demoPublisherId)
        ));
    }
    
    await db.delete(broadcastQueue)
      .where(and(
        eq(broadcastQueue.assignmentId, id),
        eq(broadcastQueue.publisherId, demoPublisherId)
      ));
    
    await db.delete(emailVariations)
      .where(and(
        eq(emailVariations.assignmentId, id),
        eq(emailVariations.publisherId, demoPublisherId)
      ));
    
    // Delete the assignment
    const deletedAssignment = await db.delete(assignments)
      .where(and(
        eq(assignments.id, id),
        eq(assignments.publisherId, demoPublisherId)
      ))
      .returning();
    
    if (deletedAssignment.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Assignment and related data deleted successfully',
      deletedAssignment: deletedAssignment[0]
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete assignment'
    });
  }
});

export default router;