import express from 'express';
import { createBrevoService, BrevoConfig } from './services/brevo';
import { authenticateAndSetTenant, requireTenant } from './middleware/tenant';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateAndSetTenant);
router.use(requireTenant);

// Helper function to get tenant ID from request
const getTenantId = (req: express.Request): string => {
  return req.tenant!.publisherId;
};

// Helper function to get Brevo configuration for tenant
const getBrevoConfig = (publisherId: string): BrevoConfig => {
  // In production, this would fetch tenant-specific Brevo credentials from database
  // For now, using environment variables as default
  return {
    apiKey: process.env.BREVO_API_KEY || 'demo_api_key',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@sharpsend.com',
    senderName: process.env.BREVO_SENDER_NAME || 'SharpSend',
    listId: parseInt(process.env.BREVO_DEFAULT_LIST_ID || '1')
  };
};

/**
 * Test Brevo connection and get account information
 */
router.get('/test-connection', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const result = await brevoService.testConnection();
    
    res.json({
      success: result.success,
      provider: 'Brevo',
      account: result.account,
      message: result.message,
      error: result.error
    });
  } catch (error) {
    console.error('Brevo connection test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to test Brevo connection' 
    });
  }
});

/**
 * Sync subscribers to Brevo contact lists
 */
router.post('/sync-subscribers', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { subscribers, listName } = req.body;

    if (!subscribers || !Array.isArray(subscribers)) {
      return res.status(400).json({ 
        error: 'Subscribers array is required' 
      });
    }

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    // Create or get contact list
    let listId = config.listId;
    if (listName) {
      const listResult = await brevoService.createContactList(`${publisherId}_${listName}`);
      if (listResult.success) {
        listId = listResult.listId;
      }
    }

    // Sync subscribers to Brevo
    const results = [];
    for (const subscriber of subscribers) {
      const contact = {
        email: subscriber.email,
        attributes: {
          FIRSTNAME: subscriber.firstName || '',
          LASTNAME: subscriber.lastName || '',
          INVESTMENT_PROFILE: subscriber.investmentProfile || 'moderate',
          RISK_TOLERANCE: subscriber.riskTolerance || 'medium',
          ENGAGEMENT_SCORE: subscriber.engagementScore || 0,
          SIGNUP_DATE: subscriber.createdAt || new Date().toISOString(),
          COHORT: subscriber.cohort || 'general'
        },
        listIds: listId ? [listId] : undefined
      };

      const result = await brevoService.createOrUpdateContact(contact);
      results.push({
        email: subscriber.email,
        success: result.success,
        error: result.error
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      totalSubscribers: subscribers.length,
      successful,
      failed,
      listId,
      results: results.slice(0, 10) // Return first 10 results for debugging
    });
  } catch (error) {
    console.error('Brevo subscriber sync error:', error);
    res.status(500).json({ 
      error: 'Failed to sync subscribers to Brevo' 
    });
  }
});

/**
 * Send personalized email campaign via Brevo
 */
router.post('/send-campaign', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { 
      campaignName,
      subject,
      htmlContent,
      textContent,
      recipients,
      scheduledAt
    } = req.body;

    if (!campaignName || !subject || !htmlContent || !recipients) {
      return res.status(400).json({ 
        error: 'Campaign name, subject, content, and recipients are required' 
      });
    }

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    if (scheduledAt) {
      // Create and schedule campaign
      const campaign = {
        name: `${publisherId}_${campaignName}`,
        subject,
        sender: {
          name: config.senderName,
          email: config.senderEmail
        },
        type: 'classic' as const,
        htmlContent,
        textContent: textContent || '',
        recipients: {
          listIds: config.listId ? [config.listId] : []
        },
        scheduledAt
      };

      const createResult = await brevoService.createEmailCampaign(campaign);
      if (!createResult.success) {
        return res.status(400).json({
          success: false,
          error: createResult.error
        });
      }

      const scheduleResult = await brevoService.scheduleCampaign(
        createResult.campaignId,
        scheduledAt
      );

      res.json({
        success: scheduleResult.success,
        campaignId: createResult.campaignId,
        scheduledAt,
        message: 'Campaign scheduled successfully'
      });
    } else {
      // Send personalized emails immediately
      const result = await brevoService.sendPersonalizedEmails(
        subject,
        htmlContent,
        textContent || '',
        recipients
      );

      res.json({
        success: result.success,
        totalSent: result.totalSent,
        successful: result.successful,
        failed: result.failed,
        message: 'Personalized emails sent successfully'
      });
    }
  } catch (error) {
    console.error('Brevo campaign send error:', error);
    res.status(500).json({ 
      error: 'Failed to send campaign via Brevo' 
    });
  }
});

/**
 * Send cohort-specific personalized emails
 */
router.post('/send-cohort-emails', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { 
      cohortId,
      cohortName,
      baseSubject,
      baseContent,
      personalizedVariations,
      sendImmediately = false
    } = req.body;

    if (!cohortId || !baseSubject || !baseContent || !personalizedVariations) {
      return res.status(400).json({ 
        error: 'Cohort ID, subject, content, and personalized variations are required' 
      });
    }

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    // Prepare recipients with personalized content
    const recipients = personalizedVariations.map((variation: any) => ({
      email: variation.email,
      name: variation.name || variation.email,
      personalizedSubject: variation.personalizedSubject || baseSubject,
      personalizedContent: variation.personalizedContent || baseContent,
      params: {
        firstName: variation.firstName || '',
        investmentProfile: variation.investmentProfile || '',
        cohortName: cohortName || cohortId,
        personalizedCTA: variation.personalizedCTA || 'Learn More'
      }
    }));

    if (sendImmediately) {
      // Send emails immediately
      const result = await brevoService.sendPersonalizedEmails(
        baseSubject,
        baseContent,
        '', // textContent
        recipients
      );

      res.json({
        success: result.success,
        cohortId,
        cohortName,
        totalSent: result.totalSent,
        successful: result.successful,
        failed: result.failed,
        message: `Cohort emails sent successfully to ${cohortName}`
      });
    } else {
      // Create campaign for later sending
      const campaign = {
        name: `${publisherId}_${cohortName}_${Date.now()}`,
        subject: baseSubject,
        sender: {
          name: config.senderName,
          email: config.senderEmail
        },
        type: 'classic' as const,
        htmlContent: baseContent,
        recipients: {
          listIds: config.listId ? [config.listId] : []
        }
      };

      const result = await brevoService.createEmailCampaign(campaign);

      res.json({
        success: result.success,
        campaignId: result.campaignId,
        cohortId,
        cohortName,
        totalRecipients: recipients.length,
        message: 'Cohort campaign created successfully'
      });
    }
  } catch (error) {
    console.error('Brevo cohort email error:', error);
    res.status(500).json({ 
      error: 'Failed to send cohort emails via Brevo' 
    });
  }
});

/**
 * Get campaign statistics from Brevo
 */
router.get('/campaign-stats/:campaignId', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { campaignId } = req.params;

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const stats = await brevoService.getCampaignStats(parseInt(campaignId));

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or stats unavailable'
      });
    }

    res.json({
      success: true,
      provider: 'Brevo',
      campaignId: parseInt(campaignId),
      stats: {
        sent: stats.sent,
        delivered: stats.delivered,
        opens: stats.opens,
        clicks: stats.clicks,
        bounces: stats.bounces,
        unsubscriptions: stats.unsubscriptions,
        openRate: stats.openRate,
        clickRate: stats.clickRate,
        bounceRate: stats.bounceRate,
        unsubscriptionRate: stats.unsubscriptionRate
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Brevo campaign stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch campaign statistics from Brevo' 
    });
  }
});

/**
 * Get all campaigns from Brevo
 */
router.get('/campaigns', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { limit = 50, offset = 0 } = req.query;

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const result = await brevoService.getCampaigns(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Filter campaigns for this publisher (by name prefix)
    const publisherCampaigns = result.campaigns.filter((campaign: any) => 
      campaign.name.startsWith(`${publisherId}_`)
    );

    res.json({
      success: true,
      provider: 'Brevo',
      campaigns: publisherCampaigns,
      totalCount: publisherCampaigns.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Brevo campaigns fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch campaigns from Brevo' 
    });
  }
});

/**
 * Get contact lists from Brevo
 */
router.get('/contact-lists', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { limit = 50, offset = 0 } = req.query;

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const result = await brevoService.getContactLists(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Filter lists for this publisher (by name prefix)
    const publisherLists = result.lists.filter((list: any) => 
      list.name.startsWith(`${publisherId}_`) || list.id === config.listId
    );

    res.json({
      success: true,
      provider: 'Brevo',
      lists: publisherLists,
      totalCount: publisherLists.length,
      defaultListId: config.listId
    });
  } catch (error) {
    console.error('Brevo contact lists fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contact lists from Brevo' 
    });
  }
});

/**
 * Create a new contact list in Brevo
 */
router.post('/create-contact-list', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'List name is required' 
      });
    }

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const listName = `${publisherId}_${name}`;
    const result = await brevoService.createContactList(listName);

    res.json({
      success: result.success,
      provider: 'Brevo',
      listId: result.listId,
      listName,
      message: result.message,
      error: result.error
    });
  } catch (error) {
    console.error('Brevo contact list creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create contact list in Brevo' 
    });
  }
});

/**
 * Setup webhook for email event tracking
 */
router.post('/setup-webhook', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { webhookUrl, events } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ 
        error: 'Webhook URL is required' 
      });
    }

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const defaultEvents = events || [
      'delivered',
      'opened',
      'clicked',
      'bounced',
      'spam',
      'unsubscribed',
      'error'
    ];

    const result = await brevoService.createWebhook(
      webhookUrl,
      defaultEvents,
      `SharpSend webhook for ${publisherId}`
    );

    res.json({
      success: result.success,
      provider: 'Brevo',
      webhookId: result.webhookId,
      webhookUrl,
      events: defaultEvents,
      message: result.message,
      error: result.error
    });
  } catch (error) {
    console.error('Brevo webhook setup error:', error);
    res.status(500).json({ 
      error: 'Failed to setup webhook in Brevo' 
    });
  }
});

/**
 * Get email templates from Brevo
 */
router.get('/email-templates', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { active = 'true', limit = 50, offset = 0 } = req.query;

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const result = await brevoService.getEmailTemplates(
      active as 'true' | 'false',
      parseInt(limit as string),
      parseInt(offset as string)
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      provider: 'Brevo',
      templates: result.templates,
      totalCount: result.count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Brevo email templates fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch email templates from Brevo' 
    });
  }
});

/**
 * Create email template in Brevo
 */
router.post('/create-email-template', async (req, res) => {
  try {
    const publisherId = getTenantId(req);
    const { 
      name,
      subject,
      htmlContent,
      textContent,
      tag
    } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ 
        error: 'Template name, subject, and HTML content are required' 
      });
    }

    const config = getBrevoConfig(publisherId);
    const brevoService = createBrevoService(config);

    const template = {
      name: `${publisherId}_${name}`,
      subject,
      htmlContent,
      textContent: textContent || '',
      sender: {
        name: config.senderName,
        email: config.senderEmail
      },
      tag: tag || 'sharpsend',
      isActive: true
    };

    const result = await brevoService.createEmailTemplate(template);

    res.json({
      success: result.success,
      provider: 'Brevo',
      templateId: result.templateId,
      templateName: template.name,
      message: result.message,
      error: result.error
    });
  } catch (error) {
    console.error('Brevo email template creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create email template in Brevo' 
    });
  }
});

export { router as brevoIntegrationRoutes };

