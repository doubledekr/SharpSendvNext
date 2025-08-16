import nodemailer from "nodemailer";
import { tenantStorage } from "../storage-multitenant";
import { openaiService } from "./openai";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
  personalizations?: Record<string, string>;
}

export interface EmailSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
}

export interface CampaignSendResult {
  campaignId: string;
  totalSent: number;
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
  messageIds: string[];
}

class EmailService {
  private transporters: Map<string, nodemailer.Transporter> = new Map();

  /**
   * Get or create SMTP transporter for publisher
   */
  private async getTransporter(publisherId: string): Promise<nodemailer.Transporter> {
    const cached = this.transporters.get(publisherId);
    if (cached) {
      return cached;
    }

    // Get email integration config
    const integrations = await tenantStorage.getEmailIntegrations(publisherId);
    const emailIntegration = integrations.find(i => i.isConnected && i.status === "active");
    
    if (!emailIntegration) {
      throw new Error("No active email integration found");
    }

    let config: EmailConfig;

    // Configure based on platform
    switch (emailIntegration.platform) {
      case "sendgrid":
        config = {
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: emailIntegration.apiKey || "",
          },
          fromEmail: emailIntegration.config?.fromEmail || "newsletter@sharpsend.com",
          fromName: emailIntegration.config?.fromName || "SharpSend Newsletter",
          replyTo: emailIntegration.config?.replyTo,
        };
        break;

      case "mailgun":
        config = {
          host: "smtp.mailgun.org",
          port: 587,
          secure: false,
          auth: {
            user: emailIntegration.config?.username || "",
            pass: emailIntegration.apiKey || "",
          },
          fromEmail: emailIntegration.config?.fromEmail || "newsletter@sharpsend.com",
          fromName: emailIntegration.config?.fromName || "SharpSend Newsletter",
          replyTo: emailIntegration.config?.replyTo,
        };
        break;

      case "ses":
        config = {
          host: "email-smtp.us-east-1.amazonaws.com",
          port: 587,
          secure: false,
          auth: {
            user: emailIntegration.config?.accessKeyId || "",
            pass: emailIntegration.config?.secretAccessKey || "",
          },
          fromEmail: emailIntegration.config?.fromEmail || "newsletter@sharpsend.com",
          fromName: emailIntegration.config?.fromName || "SharpSend Newsletter",
          replyTo: emailIntegration.config?.replyTo,
        };
        break;

      case "smtp":
      default:
        config = {
          host: emailIntegration.config?.host || "localhost",
          port: emailIntegration.config?.port || 587,
          secure: emailIntegration.config?.secure || false,
          auth: {
            user: emailIntegration.config?.username || "",
            pass: emailIntegration.apiKey || "",
          },
          fromEmail: emailIntegration.config?.fromEmail || "newsletter@sharpsend.com",
          fromName: emailIntegration.config?.fromName || "SharpSend Newsletter",
          replyTo: emailIntegration.config?.replyTo,
        };
        break;
    }

    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    // Verify connection
    try {
      await transporter.verify();
      this.transporters.set(publisherId, transporter);
      return transporter;
    } catch (error) {
      console.error("SMTP verification failed:", error);
      throw new Error("Failed to connect to email service");
    }
  }

  /**
   * Send individual email
   */
  async sendEmail(
    publisherId: string,
    to: string,
    template: EmailTemplate,
    subscriberData?: any
  ): Promise<EmailSendResult> {
    try {
      const transporter = await this.getTransporter(publisherId);
      
      // Get email config
      const integrations = await tenantStorage.getEmailIntegrations(publisherId);
      const emailIntegration = integrations.find(i => i.isConnected && i.status === "active");
      
      if (!emailIntegration?.config) {
        throw new Error("Email configuration not found");
      }

      // Personalize content if subscriber data is provided
      let personalizedSubject = template.subject;
      let personalizedHtml = template.htmlBody;
      let personalizedText = template.textBody;

      if (subscriberData) {
        // Replace placeholders with subscriber data
        const replacements = {
          "{{subscriber.name}}": subscriberData.name || "Valued Subscriber",
          "{{subscriber.email}}": subscriberData.email || to,
          "{{subscriber.segment}}": subscriberData.segment || "general",
          "{{subscriber.firstName}}": subscriberData.name?.split(" ")[0] || "Friend",
          ...template.personalizations,
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, "g"), value);
          personalizedHtml = personalizedHtml.replace(new RegExp(placeholder, "g"), value);
          if (personalizedText) {
            personalizedText = personalizedText.replace(new RegExp(placeholder, "g"), value);
          }
        }

        // Use AI for advanced personalization if enabled
        const publisher = await tenantStorage.getPublisherById(publisherId);
        if (publisher?.settings?.features?.aiPersonalization) {
          try {
            personalizedHtml = await openaiService.personalizeContent(
              publisherId,
              subscriberData,
              personalizedHtml
            );
          } catch (error) {
            console.warn("AI personalization failed, using template:", error);
          }
        }
      }

      // Generate text version if not provided
      if (!personalizedText) {
        personalizedText = this.htmlToText(personalizedHtml);
      }

      const mailOptions = {
        from: `${emailIntegration.config.fromName} <${emailIntegration.config.fromEmail}>`,
        to,
        replyTo: emailIntegration.config.replyTo || emailIntegration.config.fromEmail,
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText,
        headers: {
          "X-Mailer": "SharpSend",
          "X-Publisher-ID": publisherId,
        },
      };

      const result = await transporter.sendMail(mailOptions);
      
      return {
        messageId: result.messageId,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        pending: result.pending || [],
        response: result.response || "",
      };
    } catch (error) {
      console.error("Email send error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * Send campaign to all subscribers
   */
  async sendCampaign(publisherId: string, campaignId: string): Promise<CampaignSendResult> {
    try {
      const campaign = await tenantStorage.getCampaign(campaignId, publisherId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status === "sent") {
        throw new Error("Campaign has already been sent");
      }

      const subscribers = await tenantStorage.getSubscribers(publisherId);
      const activeSubscribers = subscribers.filter(s => s.isActive);

      if (activeSubscribers.length === 0) {
        throw new Error("No active subscribers found");
      }

      const template: EmailTemplate = {
        subject: campaign.subjectLine,
        htmlBody: campaign.content,
      };

      let successful = 0;
      let failed = 0;
      const errors: Array<{ email: string; error: string }> = [];
      const messageIds: string[] = [];

      // Send emails with rate limiting
      const batchSize = 10; // Send 10 emails at a time
      const delay = 1000; // 1 second delay between batches

      for (let i = 0; i < activeSubscribers.length; i += batchSize) {
        const batch = activeSubscribers.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (subscriber) => {
          try {
            const result = await this.sendEmail(publisherId, subscriber.email, template, subscriber);
            messageIds.push(result.messageId);
            successful++;
          } catch (error) {
            errors.push({
              email: subscriber.email,
              error: error instanceof Error ? error.message : String(error),
            });
            failed++;
          }
        });

        await Promise.allSettled(batchPromises);

        // Delay between batches to avoid rate limiting
        if (i + batchSize < activeSubscribers.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Update campaign status
      await tenantStorage.updateCampaign(campaignId, publisherId, {
        status: "sent",
        sentAt: new Date(),
        subscriberCount: successful,
      });

      // Update email integration stats
      const integrations = await tenantStorage.getEmailIntegrations(publisherId);
      const emailIntegration = integrations.find(i => i.isConnected && i.status === "active");
      
      if (emailIntegration) {
        await tenantStorage.updateEmailIntegration(emailIntegration.id, publisherId, {
          campaignsSent: (emailIntegration.campaignsSent || 0) + 1,
          lastSync: new Date(),
        });
      }

      return {
        campaignId,
        totalSent: activeSubscribers.length,
        successful,
        failed,
        errors,
        messageIds,
      };
    } catch (error) {
      console.error("Campaign send error:", error);
      throw new Error(`Failed to send campaign: ${error}`);
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(
    publisherId: string,
    testEmail: string,
    template: EmailTemplate
  ): Promise<EmailSendResult> {
    try {
      // Create a test subscriber object
      const testSubscriber = {
        name: "Test User",
        email: testEmail,
        segment: "test",
        engagementScore: "100",
        revenue: "0",
      };

      return await this.sendEmail(publisherId, testEmail, template, testSubscriber);
    } catch (error) {
      console.error("Test email send error:", error);
      throw new Error(`Failed to send test email: ${error}`);
    }
  }

  /**
   * Validate email configuration
   */
  async validateEmailConfig(publisherId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const transporter = await this.getTransporter(publisherId);
      await transporter.verify();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get email sending statistics
   */
  async getEmailStats(publisherId: string): Promise<{
    totalSent: number;
    totalCampaigns: number;
    averageOpenRate: number;
    averageClickRate: number;
    lastSent: Date | null;
  }> {
    try {
      const campaigns = await tenantStorage.getCampaigns(publisherId);
      const sentCampaigns = campaigns.filter(c => c.status === "sent");

      const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.subscriberCount || 0), 0);
      const totalCampaigns = sentCampaigns.length;
      
      const avgOpenRate = totalCampaigns > 0
        ? sentCampaigns.reduce((sum, c) => sum + parseFloat(c.openRate || "0"), 0) / totalCampaigns
        : 0;
      
      const avgClickRate = totalCampaigns > 0
        ? sentCampaigns.reduce((sum, c) => sum + parseFloat(c.clickRate || "0"), 0) / totalCampaigns
        : 0;

      const lastSent = sentCampaigns.length > 0
        ? sentCampaigns.reduce((latest, c) => 
            !latest || (c.sentAt && c.sentAt > latest) ? c.sentAt : latest, null as Date | null)
        : null;

      return {
        totalSent,
        totalCampaigns,
        averageOpenRate: avgOpenRate,
        averageClickRate: avgClickRate,
        lastSent,
      };
    } catch (error) {
      console.error("Email stats error:", error);
      throw new Error("Failed to get email statistics");
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate unsubscribe link
   */
  generateUnsubscribeLink(publisherId: string, subscriberEmail: string): string {
    const token = Buffer.from(`${publisherId}:${subscriberEmail}`).toString("base64");
    return `https://sharpsend.com/unsubscribe?token=${token}`;
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [publisherId, email] = decoded.split(":");

      if (!publisherId || !email) {
        return { success: false, message: "Invalid unsubscribe token" };
      }

      const subscriber = await tenantStorage.getSubscriberByEmail(email, publisherId);
      if (!subscriber) {
        return { success: false, message: "Subscriber not found" };
      }

      await tenantStorage.updateSubscriber(subscriber.id, publisherId, { isActive: false });
      
      return { success: true, message: "Successfully unsubscribed" };
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return { success: false, message: "Failed to process unsubscribe request" };
    }
  }
}

export const emailService = new EmailService();

