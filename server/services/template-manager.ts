import { db } from "../db";
import { emailTemplates, templateSections, imageAssets, type EmailTemplate, type TemplateSection, type InsertEmailTemplate, type InsertTemplateSection } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { BrevoService } from "./brevo";
import { exactTargetService } from "./exacttarget";

export interface TemplateVariable {
  name: string;
  type: 'text' | 'image' | 'link' | 'date' | 'number';
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface TemplateStructure {
  header: {
    type: 'static' | 'dynamic';
    content: string;
    logoUrl?: string;
  };
  contentSections: Array<{
    id: string;
    type: 'text' | 'image' | 'button' | 'divider' | 'social' | 'sharpsend_content';
    editable: boolean;
    defaultContent?: string;
  }>;
  footer: {
    type: 'static' | 'dynamic';
    content: string;
    includeUnsubscribe: boolean;
    includeSocial: boolean;
  };
}

export class TemplateManagerService {
  constructor() {}

  /**
   * Create a new email template
   */
  async createTemplate(
    publisherId: string,
    templateData: InsertEmailTemplate
  ): Promise<EmailTemplate> {
    try {
      const [template] = await db.insert(emailTemplates)
        .values({
          ...templateData,
          publisherId,
        })
        .returning();

      // Sync template to email platforms if specified
      if (templateData.platform && templateData.platform !== 'universal') {
        await this.syncTemplateToPlatform(template);
      }

      return template;
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  /**
   * Get all templates for a publisher
   */
  async getTemplates(publisherId: string, platform?: string): Promise<EmailTemplate[]> {
    try {
      if (platform) {
        return await db.select().from(emailTemplates)
          .where(and(
            eq(emailTemplates.publisherId, publisherId),
            eq(emailTemplates.platform, platform)
          ));
      }

      return await db.select().from(emailTemplates)
        .where(eq(emailTemplates.publisherId, publisherId));
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch templates');
    }
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const [template] = await db.select().from(emailTemplates)
        .where(eq(emailTemplates.id, templateId));
      
      return template || null;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw new Error('Failed to fetch template');
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<InsertEmailTemplate>
  ): Promise<EmailTemplate> {
    try {
      const [updated] = await db.update(emailTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, templateId))
        .returning();

      // Re-sync to platform if needed
      if (updated.platform && updated.platform !== 'universal') {
        await this.syncTemplateToPlatform(updated);
      }

      return updated;
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }
  }

  /**
   * Apply SharpSend content to a template
   */
  async applyContentToTemplate(
    templateId: string,
    content: string,
    variables?: Record<string, any>
  ): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      let html = template.htmlTemplate;

      // Replace SharpSend content placeholder
      html = html.replace(/\{\{sharpsend_content\}\}/g, content);
      html = html.replace(/\*\|SHARPSEND_CONTENT\|\*/g, content);
      html = html.replace(/%%\s*@SharpSendContent\s*%%/g, content);

      // Replace other variables
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          html = html.replace(regex, String(value));
        }
      }

      // Apply brand assets
      if (template.brandAssets) {
        const assets = template.brandAssets as any;
        if (assets.logoId) {
          const logo = await this.getImageAsset(assets.logoId);
          if (logo) {
            html = html.replace(/\{\{logo_url\}\}/g, logo.cdnUrl || '');
          }
        }
      }

      // Apply legal content
      if (template.legalContent) {
        const legal = template.legalContent as any;
        if (legal.disclaimer) {
          html = html.replace(/\{\{disclaimer\}\}/g, legal.disclaimer);
        }
        if (legal.privacyPolicy) {
          html = html.replace(/\{\{privacy_policy\}\}/g, legal.privacyPolicy);
        }
      }

      return html;
    } catch (error) {
      console.error('Error applying content to template:', error);
      throw new Error('Failed to apply content to template');
    }
  }

  /**
   * Sync template to email platform
   */
  private async syncTemplateToPlatform(template: EmailTemplate): Promise<void> {
    try {
      switch (template.platform) {
        case 'brevo':
          await this.syncToBrevo(template);
          break;
        case 'sendgrid':
          await this.syncToSendGrid(template);
          break;
        case 'mailchimp':
          await this.syncToMailchimp(template);
          break;
        case 'exacttarget':
          await this.syncToExactTarget(template);
          break;
      }
    } catch (error) {
      console.error(`Error syncing template to ${template.platform}:`, error);
      // Don't throw - log but continue
    }
  }

  /**
   * Sync template to Brevo
   */
  private async syncToBrevo(template: EmailTemplate): Promise<void> {
    const brevoService = new BrevoService();
    
    const brevoTemplate = {
      name: template.name,
      subject: '{{subject}}',
      htmlContent: template.htmlTemplate,
      textContent: template.textTemplate || '',
      sender: {
        name: '{{sender_name}}',
        email: '{{sender_email}}',
      },
      isActive: template.isActive ?? true,
    };

    const result = await brevoService.createEmailTemplate(brevoTemplate);
    
    if (result.success && result.templateId) {
      // Update template with platform ID
      await db.update(emailTemplates)
        .set({ platformTemplateId: String(result.templateId) })
        .where(eq(emailTemplates.id, template.id));
    }
  }

  /**
   * Sync template to SendGrid
   */
  private async syncToSendGrid(template: EmailTemplate): Promise<void> {
    // SendGrid template sync would be implemented here
    // Using their dynamic templates API
    console.log('SendGrid template sync not yet implemented');
  }

  /**
   * Sync template to Mailchimp
   */
  private async syncToMailchimp(template: EmailTemplate): Promise<void> {
    // Mailchimp template sync would be implemented here
    console.log('Mailchimp template sync not yet implemented');
  }

  /**
   * Sync template to ExactTarget
   */
  private async syncToExactTarget(template: EmailTemplate): Promise<void> {
    
    const etEmail = {
      Name: template.name,
      HTMLBody: template.htmlTemplate,
      TextBody: template.textTemplate || '',
      Subject: '%%subject%%',
      FromEmail: '%%sender_email%%',
      FromName: '%%sender_name%%',
    };

    const templateId = await exactTargetService.createEmailTemplate(
      template.publisherId,
      etEmail
    );

    if (templateId) {
      await db.update(emailTemplates)
        .set({ platformTemplateId: String(templateId) })
        .where(eq(emailTemplates.id, template.id));
    }
  }

  /**
   * Create a template section
   */
  async createTemplateSection(
    publisherId: string,
    sectionData: InsertTemplateSection
  ): Promise<TemplateSection> {
    try {
      const [section] = await db.insert(templateSections)
        .values({
          ...sectionData,
          publisherId,
        })
        .returning();

      return section;
    } catch (error) {
      console.error('Error creating template section:', error);
      throw new Error('Failed to create template section');
    }
  }

  /**
   * Get template sections
   */
  async getTemplateSections(
    publisherId: string,
    type?: string
  ): Promise<TemplateSection[]> {
    try {
      if (type) {
        return await db.select().from(templateSections)
          .where(and(
            eq(templateSections.publisherId, publisherId),
            eq(templateSections.type, type)
          ));
      }

      return await db.select().from(templateSections)
        .where(eq(templateSections.publisherId, publisherId));
    } catch (error) {
      console.error('Error fetching template sections:', error);
      throw new Error('Failed to fetch template sections');
    }
  }

  /**
   * Build template from sections
   */
  async buildTemplateFromSections(
    sectionIds: string[],
    variables?: Record<string, any>
  ): Promise<string> {
    try {
      const sections = await Promise.all(
        sectionIds.map(id => 
          db.select().from(templateSections)
            .where(eq(templateSections.id, id))
            .then(([s]) => s)
        )
      );

      let html = '';
      for (const section of sections) {
        if (!section) continue;
        
        let sectionHtml = section.html;
        
        // Replace variables
        if (variables && section.variables) {
          const sectionVars = section.variables as string[];
          for (const varName of sectionVars) {
            if (variables[varName]) {
              const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
              sectionHtml = sectionHtml.replace(regex, String(variables[varName]));
            }
          }
        }
        
        html += sectionHtml;
      }

      return html;
    } catch (error) {
      console.error('Error building template from sections:', error);
      throw new Error('Failed to build template from sections');
    }
  }

  /**
   * Get image asset helper
   */
  private async getImageAsset(assetId: string) {
    try {
      const [asset] = await db.select().from(imageAssets)
        .where(eq(imageAssets.id, assetId));
      return asset;
    } catch (error) {
      console.error('Error fetching image asset:', error);
      return null;
    }
  }

  /**
   * Generate default template structure
   */
  generateDefaultTemplate(category: string): string {
    const templates: Record<string, string> = {
      newsletter: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e5e7eb; }
    .logo { max-width: 200px; height: auto; }
    .content { padding: 30px 0; }
    .footer { padding: 20px 0; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
    .unsubscribe { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if logo_url}}
        <img src="{{logo_url}}" alt="Logo" class="logo">
      {{/if}}
    </div>
    
    <div class="content">
      {{sharpsend_content}}
    </div>
    
    <div class="footer">
      {{#if disclaimer}}
        <p>{{disclaimer}}</p>
      {{/if}}
      <p>
        © {{current_year}} {{company_name}}. All rights reserved.<br>
        <a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a> | 
        <a href="{{privacy_url}}" class="unsubscribe">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      
      announcement: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .cta-button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{announcement_title}}</h1>
    </div>
    
    <div class="content">
      {{sharpsend_content}}
      
      {{#if cta_url}}
        <div style="text-align: center;">
          <a href="{{cta_url}}" class="cta-button">{{cta_text}}</a>
        </div>
      {{/if}}
    </div>
    
    <div class="footer">
      <p>© {{current_year}} {{company_name}}</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
      
      alert: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert-header { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px; }
    .alert-title { color: #991b1b; font-size: 18px; font-weight: bold; margin: 0; }
    .content { padding: 20px 0; }
    .footer { padding: 20px 0; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-header">
      <h2 class="alert-title">⚠️ {{alert_type}}</h2>
    </div>
    
    <div class="content">
      {{sharpsend_content}}
    </div>
    
    <div class="footer">
      <p>This is an automated alert from {{company_name}}</p>
      <p><a href="{{preferences_url}}">Manage Alerts</a> | <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    };

    return templates[category] || templates.newsletter;
  }
}