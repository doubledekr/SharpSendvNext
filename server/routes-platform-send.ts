import { Router } from 'express';
import { db } from './db';
import { emailIntegrations, campaigns, subscribers, emailSegments } from '../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { MailchimpIntegrationService } from './services/mailchimp-integration';
import { SendGridIntegrationService } from './services/sendgrid-integration';
import { ConvertKitIntegrationService } from './services/convertkit-integration';
import { IterableIntegrationService } from './services/iterable-integration';
import { CustomerIoIntegrationService } from './services/customerio-integration';
import { KeapIntegrationService } from './services/keap-integration';

const router = Router();

/**
 * Universal send endpoint - routes to appropriate platform
 */
router.post('/send', async (req, res) => {
  try {
    const { 
      publisherId, 
      platform, 
      campaignId,
      segmentId,
      subject,
      content,
      fromName,
      fromEmail,
      replyTo,
      sendImmediately = true,
      sendAt
    } = req.body;

    if (!publisherId || !platform || !campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID, platform, and campaign ID are required'
      });
    }

    // Get integration config
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
        error: `${platform} integration not found or not connected`
      });
    }

    // Get campaign details
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get segment members if specified
    let targetEmails: string[] = [];
    if (segmentId) {
      const [segment] = await db
        .select()
        .from(emailSegments)
        .where(eq(emailSegments.id, segmentId));

      if (segment) {
        // Get subscribers based on segment criteria
        // For now, use segment name to match subscriber segment field
        const segmentSubscribers = await db
          .select()
          .from(subscribers)
          .where(and(
            eq(subscribers.publisherId, publisherId),
            eq(subscribers.segment, segment.name),
            eq(subscribers.isActive, true)
          ));
        targetEmails = segmentSubscribers.map(s => s.email);
      }
    } else {
      // Get all active subscribers
      const allSubscribers = await db
        .select()
        .from(subscribers)
        .where(and(
          eq(subscribers.publisherId, publisherId),
          eq(subscribers.isActive, true)
        ));
      targetEmails = allSubscribers.map(s => s.email);
    }

    let result: any;
    const config = integration.config as any;

    // Route to appropriate platform service
    switch (platform) {
      case 'mailchimp': {
        const service = new MailchimpIntegrationService({
          apiKey: integration.apiKey!,
          serverPrefix: config.serverPrefix
        });

        result = await service.sendCampaign({
          listId: config.defaultListId || config.listIds?.[0],
          segmentId: config.segmentIds?.find((id: string) => id === segmentId),
          subject: subject || campaign.subjectLine,
          fromName: fromName || config.fromName || 'SharpSend',
          fromEmail: fromEmail || config.fromEmail || 'newsletter@sharpsend.io',
          replyTo: replyTo || config.replyTo || fromEmail || config.fromEmail,
          htmlContent: content || campaign.content,
          textContent: campaign.plainTextContent
        });
        break;
      }

      case 'sendgrid': {
        const service = new SendGridIntegrationService({
          apiKey: integration.apiKey!
        });

        if (sendImmediately) {
          result = await service.sendCampaign({
            toEmails: targetEmails,
            subject: subject || campaign.subjectLine,
            fromName: fromName || config.fromName || 'SharpSend',
            fromEmail: fromEmail || config.fromEmail || 'newsletter@sharpsend.io',
            replyTo: replyTo || config.replyTo || fromEmail || config.fromEmail,
            htmlContent: content || campaign.content,
            textContent: campaign.plainTextContent
          });
        } else {
          result = await service.scheduleCampaign({
            name: campaign.name,
            sendAt: new Date(sendAt),
            listIds: config.listIds,
            segmentIds: config.segmentIds,
            fromEmail: fromEmail || config.fromEmail || 'newsletter@sharpsend.io',
            subject: subject || campaign.subjectLine,
            htmlContent: content || campaign.content,
            plainContent: campaign.plainTextContent
          });
        }
        break;
      }

      case 'convertkit': {
        const service = new ConvertKitIntegrationService({
          apiKey: integration.apiKey!,
          apiSecret: config.apiSecret
        });

        result = await service.sendCampaign({
          subject: subject || campaign.subjectLine,
          content: content || campaign.content,
          fromEmail: fromEmail || config.fromEmail,
          fromName: fromName || config.fromName,
          previewText: campaign.previewText,
          tagIds: config.tagIds,
          sendImmediately,
          sendAt: sendAt ? new Date(sendAt) : undefined
        });
        break;
      }

      case 'iterable': {
        const service = new IterableIntegrationService({
          apiKey: integration.apiKey!,
          region: config.region || 'us'
        });

        result = await service.sendCampaign({
          campaignId: parseInt(campaignId),
          recipientListIds: config.listIds,
          suppressionListIds: config.suppressionListIds,
          sendAt: sendAt ? new Date(sendAt) : new Date()
        });
        break;
      }

      case 'customerio': {
        const service = new CustomerIoIntegrationService({
          siteId: config.siteId,
          apiKey: integration.apiKey!,
          region: config.region || 'us',
          trackingKey: config.trackingKey
        });

        result = await service.sendBroadcast({
          name: `SharpSend_${campaign.name}`,
          from: fromEmail || config.fromEmail || 'newsletter@sharpsend.io',
          subject: subject || campaign.subjectLine,
          body: content || campaign.content,
          preheader: campaign.previewText,
          segmentId: config.segmentIds?.find((id: string) => id === segmentId)
        });
        break;
      }

      case 'keap': {
        const service = new KeapIntegrationService({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          accessToken: integration.accessToken!,
          refreshToken: integration.refreshToken
        });

        result = await service.sendEmail({
          contactIds: [], // Would need to fetch contact IDs from emails
          subject: subject || campaign.subjectLine,
          htmlContent: content || campaign.content,
          plainContent: campaign.plainTextContent,
          fromEmail: fromEmail || config.fromEmail || 'newsletter@sharpsend.io'
        });
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Platform ${platform} send not yet implemented`
        });
    }

    // Update campaign status
    await db
      .update(campaigns)
      .set({
        status: 'sent',
        sentAt: new Date(),
        subscriberCount: targetEmails.length
      })
      .where(eq(campaigns.id, campaignId));

    res.json({
      success: result.success || true,
      message: result.message || 'Campaign sent successfully',
      campaignId: result.campaignId || campaignId,
      recipientCount: targetEmails.length
    });

  } catch (error: any) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send campaign'
    });
  }
});

/**
 * Create segment on platform
 */
router.post('/create-segment', async (req, res) => {
  try {
    const {
      publisherId,
      platform,
      segmentName,
      conditions,
      memberEmails
    } = req.body;

    if (!publisherId || !platform || !segmentName) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID, platform, and segment name are required'
      });
    }

    // Get integration config
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
        error: `${platform} integration not found or not connected`
      });
    }

    const config = integration.config as any;
    let result: any;

    // Route to appropriate platform service
    switch (platform) {
      case 'mailchimp': {
        const service = new MailchimpIntegrationService({
          apiKey: integration.apiKey!,
          serverPrefix: config.serverPrefix
        });

        const listId = config.defaultListId || config.listIds?.[0];
        result = await service.createSegment(listId, {
          name: segmentName,
          conditions: conditions || [],
          description: `Created by SharpSend on ${new Date().toISOString()}`
        });
        break;
      }

      case 'sendgrid': {
        const service = new SendGridIntegrationService({
          apiKey: integration.apiKey!
        });

        result = await service.createSegment({
          name: segmentName,
          query: conditions?.query || '',
          parentListIds: config.listIds
        });
        break;
      }

      case 'convertkit': {
        const service = new ConvertKitIntegrationService({
          apiKey: integration.apiKey!,
          apiSecret: config.apiSecret
        });

        result = await service.createSegment({
          name: segmentName,
          subscriberEmails: memberEmails || []
        });
        break;
      }

      case 'iterable': {
        const service = new IterableIntegrationService({
          apiKey: integration.apiKey!,
          region: config.region || 'us'
        });

        // Iterable uses lists, not segments
        result = await service.createList({
          name: `SharpSend_${segmentName}`,
          description: `Created by SharpSend on ${new Date().toISOString()}`
        });
        break;
      }

      case 'customerio': {
        const service = new CustomerIoIntegrationService({
          siteId: config.siteId,
          apiKey: integration.apiKey!,
          region: config.region || 'us',
          trackingKey: config.trackingKey
        });

        result = await service.createSegment({
          name: `SharpSend_${segmentName}`,
          description: `Created by SharpSend on ${new Date().toISOString()}`,
          filter: conditions?.filter
        });
        break;
      }

      case 'keap': {
        const service = new KeapIntegrationService({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          accessToken: integration.accessToken!,
          refreshToken: integration.refreshToken
        });

        // Keap uses tags as segments
        result = await service.createTag({
          name: `SharpSend_${segmentName}`,
          description: `Created by SharpSend on ${new Date().toISOString()}`,
          category: 'SharpSend'
        });
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Platform ${platform} segment creation not yet implemented`
        });
    }

    res.json({
      success: true,
      segment: result,
      message: `Segment "${segmentName}" created successfully on ${platform}`
    });

  } catch (error: any) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create segment'
    });
  }
});

/**
 * Sync all SharpSend segments to platform (two-way sync)
 */
router.post('/sync-segments', async (req, res) => {
  try {
    const { publisherId, platform } = req.body;

    if (!publisherId || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID and platform are required'
      });
    }

    // Get all SharpSend segments
    const sharpSendSegments = await db
      .select()
      .from(emailSegments)
      .where(eq(emailSegments.publisherId, publisherId));

    // Prepare segments for sync
    const segmentsToSync = await Promise.all(
      sharpSendSegments.map(async segment => {
        // Get subscribers for this segment
        const segmentSubscribers = await db
          .select()
          .from(subscribers)
          .where(and(
            eq(subscribers.publisherId, publisherId),
            eq(subscribers.segment, segment.name),
            eq(subscribers.isActive, true)
          ));
        
        return {
          name: segment.name,
          conditions: segment.criteria?.tags || [],
          memberEmails: segmentSubscribers.map(s => s.email),
          query: segment.description || ''
        };
      })
    );

    let result: any;

    // Route to appropriate platform service
    switch (platform) {
      case 'mailchimp': {
        const service = new MailchimpIntegrationService({
          apiKey: '', // Will be fetched from DB in service
          serverPrefix: ''
        });
        result = await service.syncSegmentsToMailchimp(publisherId, segmentsToSync);
        break;
      }

      case 'sendgrid': {
        const service = new SendGridIntegrationService({
          apiKey: ''
        });
        result = await service.syncSegmentsToSendGrid(publisherId, segmentsToSync);
        break;
      }

      case 'convertkit': {
        const service = new ConvertKitIntegrationService({
          apiKey: ''
        });
        result = await service.syncSegmentsToConvertKit(publisherId, segmentsToSync);
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Platform ${platform} segment sync not yet implemented`
        });
    }

    res.json({
      success: result.success,
      syncedSegments: result.syncedSegments,
      errors: result.errors,
      message: `Synced ${result.syncedSegments} segments to ${platform}`
    });

  } catch (error: any) {
    console.error('Error syncing segments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync segments'
    });
  }
});

/**
 * Pull segments from platform to SharpSend (reverse sync)
 */
router.post('/pull-segments', async (req, res) => {
  try {
    const { publisherId, platform } = req.body;

    if (!publisherId || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Publisher ID and platform are required'
      });
    }

    // Get integration config
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
        error: `${platform} integration not found or not connected`
      });
    }

    const config = integration.config as any;
    let platformSegments: any[] = [];

    // Fetch segments from platform
    switch (platform) {
      case 'mailchimp': {
        const service = new MailchimpIntegrationService({
          apiKey: integration.apiKey!,
          serverPrefix: config.serverPrefix
        });
        const listId = config.defaultListId || config.listIds?.[0];
        const result = await service.getSegments(listId);
        platformSegments = result.segments;
        break;
      }

      case 'sendgrid': {
        const service = new SendGridIntegrationService({
          apiKey: integration.apiKey!
        });
        const result = await service.getSegments();
        platformSegments = result.segments;
        break;
      }

      case 'convertkit': {
        const service = new ConvertKitIntegrationService({
          apiKey: integration.apiKey!
        });
        const result = await service.getSegments();
        platformSegments = result.segments;
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Platform ${platform} segment pull not yet implemented`
        });
    }

    // Save segments to SharpSend database
    const savedSegments = [];
    for (const platformSegment of platformSegments) {
      // Skip SharpSend-created segments to avoid duplicates
      if (platformSegment.name?.startsWith('SharpSend_')) {
        continue;
      }

      const [savedSegment] = await db
        .insert(emailSegments)
        .values({
          publisherId,
          name: `${platform}_${platformSegment.name}`,
          description: `Imported from ${platform} on ${new Date().toISOString()}`,
          subscriberCount: platformSegment.member_count || platformSegment.subscriber_count || 0,
          isDetected: true, // Mark as auto-detected from ESP
          criteria: {
            espListId: platformSegment.id,
            tags: platformSegment.tags || []
          }
        })
        .onConflictDoUpdate({
          target: [emailSegments.publisherId, emailSegments.name],
          set: {
            subscriberCount: platformSegment.member_count || platformSegment.subscriber_count || 0,
            lastCalculatedAt: new Date()
          }
        })
        .returning();

      savedSegments.push(savedSegment);
    }

    res.json({
      success: true,
      importedSegments: savedSegments.length,
      segments: savedSegments,
      message: `Imported ${savedSegments.length} segments from ${platform}`
    });

  } catch (error: any) {
    console.error('Error pulling segments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pull segments'
    });
  }
});

export default router;