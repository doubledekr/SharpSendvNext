import express from 'express';
import { inMemoryDemoStore, isDemoMode } from './services/in-memory-demo-store';
import { db } from './db';
import { subscribers } from '../shared/schema-multitenant';
import { eq, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/api/cohorts/available', async (req, res) => {
  try {
    if (isDemoMode()) {
      const publisherId = req.headers['x-tenant-id'] || 'demo-publisher-001';
      const cohorts = inMemoryDemoStore.getDemoCohorts(publisherId);
      
      res.json({
        success: true,
        cohorts: cohorts.map(cohort => ({
          id: cohort.id,
          name: cohort.name,
          description: cohort.description,
          subscriberCount: cohort.subscriberCount,
          avgEngagement: cohort.avgEngagement,
          avgRevenue: cohort.avgRevenue,
          characteristics: cohort.characteristics
        }))
      });
    } else {
      // Database implementation - try to fetch segments from subscribers
      try {
        // Group subscribers by segment to create cohorts
        const segments = await db
          .select({
            segment: subscribers.segment,
            subscriberCount: sql<number>`count(*)::int`,
            avgEngagement: sql<number>`avg(${subscribers.engagementScore})::float`,
            avgRevenue: sql<number>`avg(${subscribers.revenue})::float`
          })
          .from(subscribers)
          .groupBy(subscribers.segment)
          .limit(10);
        
        res.json({
          success: true,
          cohorts: segments.map((segment, index) => ({
            id: `segment-${index}`,
            name: segment.segment,
            description: `${segment.segment} subscriber segment`,
            subscriberCount: segment.subscriberCount || 0,
            avgEngagement: segment.avgEngagement || 0,
            avgRevenue: segment.avgRevenue || 0,
            characteristics: `Subscribers in the ${segment.segment} segment`
          }))
        });
      } catch (dbError) {
        // If database fails, return demo data as fallback
        console.warn('Database query failed, returning demo cohorts');
        const cohorts = inMemoryDemoStore.getDemoCohorts('demo-publisher-001');
        res.json({
          success: true,
          cohorts: cohorts.map(cohort => ({
            id: cohort.id,
            name: cohort.name,
            description: cohort.description,
            subscriberCount: cohort.subscriberCount,
            avgEngagement: cohort.avgEngagement,
            avgRevenue: cohort.avgRevenue,
            characteristics: cohort.characteristics
          }))
        });
      }
    }
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cohorts' });
  }
});

export default router;