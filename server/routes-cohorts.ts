import express from 'express';
import { db } from './db';
import { subscribers } from '../shared/schema-multitenant';
import { eq, sql } from 'drizzle-orm';

const router = express.Router();

// All demo functionality removed - cohorts now return empty for all accounts
router.get('/api/cohorts/available', async (req, res) => {
  try {
    res.json({
      success: true,
      cohorts: []
    });
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohorts' });
  }
});

router.get('/api/cohorts', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohorts' });
  }
});

export default router;