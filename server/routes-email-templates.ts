import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { emailTemplates, insertEmailTemplateSchema, type EmailTemplate, type InsertEmailTemplate } from "@shared/schema-multitenant";
import { getCurrentPublisherId } from "./tenant-middleware";

const router = Router();

// Validation schemas
const createTemplateSchema = insertEmailTemplateSchema.extend({
  name: z.string().min(1, "Template name is required").max(200, "Template name must be less than 200 characters"),
  type: z.enum(["newsletter", "campaign", "transactional"]),
  content: z.object({
    html: z.string().default(""),
    css: z.string().default(""),
    json: z.any().default({})
  })
});

const updateTemplateSchema = createTemplateSchema.partial().omit({ publisherId: true });

// GET /api/email-templates - List all templates for publisher
router.get("/", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    const templates = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.publisherId, publisherId),
        eq(emailTemplates.isActive, true)
      ))
      .orderBy(desc(emailTemplates.updatedAt));

    res.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
});

// GET /api/email-templates/:id - Get specific template
router.get("/:id", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    const template = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, req.params.id),
        eq(emailTemplates.publisherId, publisherId)
      ))
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template[0]);
  } catch (error) {
    console.error("Error fetching email template:", error);
    res.status(500).json({ error: "Failed to fetch email template" });
  }
});

// POST /api/email-templates - Create new template
router.post("/", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    // Validate request body
    const validationResult = createTemplateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      });
    }

    const templateData = {
      ...validationResult.data,
      publisherId,
      id: crypto.randomUUID(),
    };

    const newTemplate = await db
      .insert(emailTemplates)
      .values(templateData)
      .returning();

    res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error("Error creating email template:", error);
    res.status(500).json({ error: "Failed to create email template" });
  }
});

// PATCH /api/email-templates/:id - Update template
router.patch("/:id", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    // Validate request body
    const validationResult = updateTemplateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      });
    }

    // Check if template exists and belongs to publisher
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, req.params.id),
        eq(emailTemplates.publisherId, publisherId)
      ))
      .limit(1);

    if (existingTemplate.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const updatedTemplate = await db
      .update(emailTemplates)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, req.params.id))
      .returning();

    res.json(updatedTemplate[0]);
  } catch (error) {
    console.error("Error updating email template:", error);
    res.status(500).json({ error: "Failed to update email template" });
  }
});

// DELETE /api/email-templates/:id - Soft delete template
router.delete("/:id", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    // Check if template exists and belongs to publisher
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, req.params.id),
        eq(emailTemplates.publisherId, publisherId)
      ))
      .limit(1);

    if (existingTemplate.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Soft delete by setting isActive to false
    const deletedTemplate = await db
      .update(emailTemplates)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, req.params.id))
      .returning();

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ error: "Failed to delete email template" });
  }
});

// POST /api/email-templates/:id/export - Export template as HTML
router.post("/:id/export", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    const template = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, req.params.id),
        eq(emailTemplates.publisherId, publisherId)
      ))
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const { content } = template[0];
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${template[0].name}</title>
    <style>${content.css || ""}</style>
  </head>
  <body>
    ${content.html || ""}
  </body>
</html>`;

    res.json({ 
      html,
      css: content.css || "",
      json: content.json || {},
      name: template[0].name,
    });
  } catch (error) {
    console.error("Error exporting email template:", error);
    res.status(500).json({ error: "Failed to export email template" });
  }
});

// POST /api/email-templates/:id/duplicate - Duplicate template
router.post("/:id/duplicate", async (req, res) => {
  try {
    const publisherId = getCurrentPublisherId(req);
    if (!publisherId) {
      return res.status(401).json({ error: "Publisher not authenticated" });
    }

    const template = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, req.params.id),
        eq(emailTemplates.publisherId, publisherId)
      ))
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const originalTemplate = template[0];
    const duplicatedTemplate = await db
      .insert(emailTemplates)
      .values({
        id: crypto.randomUUID(),
        publisherId,
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        type: originalTemplate.type,
        content: originalTemplate.content,
        tags: originalTemplate.tags,
        isActive: true,
      })
      .returning();

    res.status(201).json(duplicatedTemplate[0]);
  } catch (error) {
    console.error("Error duplicating email template:", error);
    res.status(500).json({ error: "Failed to duplicate email template" });
  }
});

export default router;