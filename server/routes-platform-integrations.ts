import { Router } from 'express';
import { IterableIntegrationService, type IterableConfig } from './services/iterable-integration';
import { CustomerIoIntegrationService, type CustomerIoConfig } from './services/customerio-integration';
import { KeapIntegrationService, type KeapConfig } from './services/keap-integration';
import { db } from './db';
import { emailIntegrations } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * Iterable Integration Routes
 */
router.post('/iterable/test-connection', async (req, res) => {
  try {
    const { apiKey, region } = req.body;
    
    if (!apiKey || !region) {
      return res.status(400).json({
        success: false,
        error: 'API key and region are required'
      });
    }

    const service = new IterableIntegrationService({ apiKey, region });
    const result = await service.testConnection();
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error testing Iterable connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

router.post('/iterable/connect', async (req, res) => {
  try {
    const { publisherId, apiKey, region, config } = req.body;
    
    if (!publisherId || !apiKey || !region) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID, API key, and region are required'
      });
    }

    // Test connection first
    const service = new IterableIntegrationService({ apiKey, region });
    const testResult = await service.testConnection();
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: `Connection test failed: ${testResult.message}`
      });
    }

    // Get platform capabilities
    const [lists, templates] = await Promise.all([
      service.getLists().catch(() => ({ lists: [] })),
      service.getTemplates().catch(() => ({ templates: [] }))
    ]);

    // Save integration to database
    const [integration] = await db
      .insert(emailIntegrations)
      .values({
        publisherId,
        platform: 'iterable',
        isConnected: true,
        apiKey,
        status: 'active',
        config: {
          region,
          listIds: lists.lists?.map((l: any) => l.id) || [],
          templateIds: templates.templates?.map((t: any) => t.templateId) || [],
          ...config
        },
        capabilities: {
          crossChannel: true,
          templates: true,
          automation: true,
          analytics: true,
          inAppMessaging: true,
          sms: true,
          push: true,
          realTimeData: true,
          segmentation: true,
          webhooks: true
        },
        lastSync: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailIntegrations.publisherId, emailIntegrations.platform],
        set: {
          isConnected: true,
          apiKey,
          status: 'active',
          config: {
            region,
            listIds: lists.lists?.map((l: any) => l.id) || [],
            templateIds: templates.templates?.map((t: any) => t.templateId) || [],
            ...config
          },
          lastSync: new Date(),
        }
      })
      .returning();

    res.json({
      success: true,
      integration,
      capabilities: {
        lists: lists.lists || [],
        templates: templates.templates || []
      }
    });
  } catch (error) {
    console.error('Error connecting to Iterable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Iterable'
    });
  }
});

router.get('/iterable/:publisherId/campaigns', async (req, res) => {
  try {
    const { publisherId } = req.params;
    
    const [integration] = await db
      .select()
      .from(emailIntegrations)
      .where(and(
        eq(emailIntegrations.publisherId, publisherId),
        eq(emailIntegrations.platform, 'iterable')
      ));

    if (!integration || !integration.isConnected) {
      return res.status(404).json({
        success: false,
        error: 'Iterable integration not found or not connected'
      });
    }

    const service = new IterableIntegrationService({
      apiKey: integration.apiKey!,
      region: (integration.config as any)?.region || 'us'
    });

    const campaigns = await service.getCampaigns();
    
    res.json({
      success: true,
      campaigns: campaigns.campaigns
    });
  } catch (error) {
    console.error('Error fetching Iterable campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

/**
 * Customer.io Integration Routes
 */
router.post('/customerio/test-connection', async (req, res) => {
  try {
    const { siteId, apiKey, region } = req.body;
    
    if (!siteId || !apiKey || !region) {
      return res.status(400).json({
        success: false,
        error: 'Site ID, API key, and region are required'
      });
    }

    const service = new CustomerIoIntegrationService({ siteId, apiKey, region });
    const result = await service.testConnection();
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error testing Customer.io connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

router.post('/customerio/connect', async (req, res) => {
  try {
    const { publisherId, siteId, apiKey, region, trackingKey, config } = req.body;
    
    if (!publisherId || !siteId || !apiKey || !region) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID, site ID, API key, and region are required'
      });
    }

    // Test connection first
    const service = new CustomerIoIntegrationService({ siteId, apiKey, region, trackingKey });
    const testResult = await service.testConnection();
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: `Connection test failed: ${testResult.message}`
      });
    }

    // Get platform capabilities
    const [campaigns, segments] = await Promise.all([
      service.getCampaigns().catch(() => ({ campaigns: [] })),
      service.getSegments().catch(() => ({ segments: [] }))
    ]);

    // Save integration to database
    const [integration] = await db
      .insert(emailIntegrations)
      .values({
        publisherId,
        platform: 'customerio',
        isConnected: true,
        apiKey,
        status: 'active',
        config: {
          siteId,
          region,
          trackingKey,
          appApiKey: apiKey,
          segmentIds: segments.segments?.map((s: any) => s.id) || [],
          ...config
        },
        capabilities: {
          crossChannel: true,
          templates: true,
          automation: true,
          analytics: true,
          inAppMessaging: true,
          sms: true,
          push: true,
          realTimeData: true,
          segmentation: true,
          webhooks: true
        },
        lastSync: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailIntegrations.publisherId, emailIntegrations.platform],
        set: {
          isConnected: true,
          apiKey,
          status: 'active',
          config: {
            siteId,
            region,
            trackingKey,
            appApiKey: apiKey,
            segmentIds: segments.segments?.map((s: any) => s.id) || [],
            ...config
          },
          lastSync: new Date(),
        }
      })
      .returning();

    res.json({
      success: true,
      integration,
      capabilities: {
        campaigns: campaigns.campaigns || [],
        segments: segments.segments || []
      }
    });
  } catch (error) {
    console.error('Error connecting to Customer.io:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Customer.io'
    });
  }
});

/**
 * Keap Integration Routes
 */
router.post('/keap/test-connection', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const service = new KeapIntegrationService({ 
      clientId: '', 
      clientSecret: '', 
      accessToken 
    });
    const result = await service.testConnection();
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error testing Keap connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

router.post('/keap/connect', async (req, res) => {
  try {
    const { publisherId, clientId, clientSecret, accessToken, refreshToken, config } = req.body;
    
    if (!publisherId || !clientId || !clientSecret || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID, client ID, client secret, and access token are required'
      });
    }

    // Test connection first
    const service = new KeapIntegrationService({ 
      clientId, 
      clientSecret, 
      accessToken, 
      refreshToken 
    });
    const testResult = await service.testConnection();
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: `Connection test failed: ${testResult.message}`
      });
    }

    // Get platform capabilities
    const [campaigns, tags] = await Promise.all([
      service.getCampaigns().catch(() => ({ campaigns: [] })),
      service.getTags().catch(() => ({ tags: [] }))
    ]);

    // Save integration to database
    const [integration] = await db
      .insert(emailIntegrations)
      .values({
        publisherId,
        platform: 'keap',
        isConnected: true,
        apiKey: accessToken,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: 'active',
        config: {
          clientId,
          clientSecret,
          campaignIds: campaigns.campaigns?.map((c: any) => c.id) || [],
          ...config
        },
        capabilities: {
          crossChannel: false,
          templates: true,
          automation: true,
          analytics: true,
          inAppMessaging: false,
          sms: false,
          push: false,
          crm: true,
          ecommerce: true,
          realTimeData: true,
          segmentation: true,
          webhooks: true
        },
        lastSync: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailIntegrations.publisherId, emailIntegrations.platform],
        set: {
          isConnected: true,
          apiKey: accessToken,
          accessToken,
          refreshToken,
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'active',
          config: {
            clientId,
            clientSecret,
            campaignIds: campaigns.campaigns?.map((c: any) => c.id) || [],
            ...config
          },
          lastSync: new Date(),
        }
      })
      .returning();

    res.json({
      success: true,
      integration,
      capabilities: {
        campaigns: campaigns.campaigns || [],
        tags: tags.tags || []
      }
    });
  } catch (error) {
    console.error('Error connecting to Keap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Keap'
    });
  }
});

router.get('/keap/:publisherId/contacts', async (req, res) => {
  try {
    const { publisherId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    
    const [integration] = await db
      .select()
      .from(emailIntegrations)
      .where(and(
        eq(emailIntegrations.publisherId, publisherId),
        eq(emailIntegrations.platform, 'keap')
      ));

    if (!integration || !integration.isConnected) {
      return res.status(404).json({
        success: false,
        error: 'Keap integration not found or not connected'
      });
    }

    const service = new KeapIntegrationService({
      clientId: (integration.config as any)?.clientId || '',
      clientSecret: (integration.config as any)?.clientSecret || '',
      accessToken: integration.accessToken!,
      refreshToken: integration.refreshToken!
    });

    const contacts = await service.getContacts({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    res.json({
      success: true,
      contacts: contacts.contacts,
      count: contacts.count
    });
  } catch (error) {
    console.error('Error fetching Keap contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts'
    });
  }
});

/**
 * General Integration Management Routes
 */
router.get('/:publisherId', async (req, res) => {
  try {
    const { publisherId } = req.params;
    
    const integrations = await db
      .select()
      .from(emailIntegrations)
      .where(eq(emailIntegrations.publisherId, publisherId));

    res.json({
      success: true,
      integrations
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integrations'
    });
  }
});

router.delete('/:publisherId/:platform', async (req, res) => {
  try {
    const { publisherId, platform } = req.params;
    
    await db
      .update(emailIntegrations)
      .set({
        isConnected: false,
        status: 'inactive'
      })
      .where(and(
        eq(emailIntegrations.publisherId, publisherId),
        eq(emailIntegrations.platform, platform)
      ));

    res.json({
      success: true,
      message: 'Integration disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect integration'
    });
  }
});

router.post('/:publisherId/:platform/sync', async (req, res) => {
  try {
    const { publisherId, platform } = req.params;
    
    const [integration] = await db
      .select()
      .from(emailIntegrations)
      .where(and(
        eq(emailIntegrations.publisherId, publisherId),
        eq(emailIntegrations.platform, platform)
      ));

    if (!integration || !integration.isConnected) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found or not connected'
      });
    }

    // Update last sync time
    await db
      .update(emailIntegrations)
      .set({
        lastSync: new Date()
      })
      .where(and(
        eq(emailIntegrations.publisherId, publisherId),
        eq(emailIntegrations.platform, platform)
      ));

    res.json({
      success: true,
      message: 'Sync completed successfully'
    });
  } catch (error) {
    console.error('Error syncing integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync integration'
    });
  }
});

export { router as platformIntegrationsRouter };
export function platformIntegrationsRoutes(app: any) {
  app.use('/api/integrations', router);
}