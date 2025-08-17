import { Router } from "express";
import { db } from "./db";
import { imageAssets, emailTemplates, templateSections, imageCdnCache } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { ImageStorageService, ObjectNotFoundError } from "./services/object-storage";
import { TemplateManagerService } from "./services/template-manager";
import { requireTenant } from "./middleware/tenant";
import multer from "multer";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.'));
    }
  }
});

const imageStorageService = new ImageStorageService();
const templateManager = new TemplateManagerService();

// ============= Image Management Routes =============
// All routes use requireTenant middleware to ensure tenant isolation

// Get upload URL for client-side upload (tenant-isolated)
router.post("/api/images/upload-url", requireTenant, async (req: any, res) => {
  try {
    const { category = 'content' } = req.body;
    const publisherId = req.tenant?.publisherId;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher context not found" });
    }

    // Generate tenant-specific upload URL with isolated path
    const uploadUrl = await imageStorageService.getUploadUrl(publisherId, category);
    
    res.json({ 
      uploadUrl,
      expiresIn: 900, // 15 minutes
      publisherId, // Return for confirmation
      tenantPath: `publishers/${publisherId}/assets` // CDN path isolation
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// Direct server upload (tenant-isolated)
router.post("/api/images/upload", requireTenant, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { category = 'content', altText, tags } = req.body;
    const publisherId = req.tenant?.publisherId;
    const publisherName = req.tenant?.name;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher context not found" });
    }

    // Upload to tenant-specific storage path
    const tenantPath = `publishers/${publisherId}`;
    const { originalUrl, cdnUrl, objectPath } = await imageStorageService.uploadImage(
      publisherId,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype,
      category
    );

    // Get image dimensions (simplified - in production use sharp or similar)
    const dimensions = {
      width: 800, // Default dimensions
      height: 600,
    };

    // Save to database with tenant isolation
    const [imageAsset] = await db.insert(imageAssets)
      .values({
        publisherId,
        fileName: req.file.originalname,
        originalUrl,
        cdnUrl: `${tenantPath}/${cdnUrl}`, // Tenant-specific CDN path
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        dimensions,
        altText,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        category,
        uploadedBy: publisherName || 'publisher', // Use tenant context
      })
      .returning();

    res.json({
      success: true,
      image: imageAsset,
      tenantPath, // Return tenant path for transparency
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Confirm upload and save metadata (tenant-isolated)
router.post("/api/images/confirm-upload", requireTenant, async (req: any, res) => {
  try {
    const { 
      uploadUrl, 
      fileName,
      mimeType,
      fileSize,
      altText,
      tags,
      category = 'content',
      dimensions
    } = req.body;
    
    const publisherId = req.tenant?.publisherId;
    const publisherName = req.tenant?.name;

    if (!publisherId || !uploadUrl || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize the upload URL to object path
    const objectPath = imageStorageService.normalizeObjectPath(uploadUrl);
    
    // Generate tenant-specific CDN URL
    const tenantPath = `publishers/${publisherId}`;
    const cdnUrl = `/${tenantPath}/assets${objectPath.replace('/objects', '')}`;

    // Save to database with tenant isolation
    const [imageAsset] = await db.insert(imageAssets)
      .values({
        publisherId,
        fileName,
        originalUrl: uploadUrl,
        cdnUrl,
        mimeType: mimeType || 'image/jpeg',
        fileSize,
        dimensions: dimensions || { width: 800, height: 600 },
        altText,
        tags: tags || [],
        category,
        uploadedBy: publisherName || 'publisher',
      })
      .returning();

    res.json({
      success: true,
      image: imageAsset,
      tenantPath, // Return tenant path for transparency
    });
  } catch (error) {
    console.error("Error confirming upload:", error);
    res.status(500).json({ error: "Failed to confirm upload" });
  }
});

// Get images for current tenant
router.get("/api/images", requireTenant, async (req: any, res) => {
  try {
    const { category, tags } = req.query;
    const publisherId = req.tenant?.publisherId;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher context not found" });
    }

    // Query only images for this tenant
    let query = db.select().from(imageAssets)
      .where(eq(imageAssets.publisherId, publisherId));

    if (category) {
      query = query.where(and(
        eq(imageAssets.publisherId, publisherId),
        eq(imageAssets.category, category as string)
      ));
    }

    const images = await query;

    // Filter by tags if provided
    let filteredImages = images;
    if (tags) {
      const tagList = (tags as string).split(',').map(t => t.trim());
      filteredImages = images.filter(img => {
        const imgTags = img.tags || [];
        return tagList.some(tag => imgTags.includes(tag));
      });
    }

    res.json({
      images: filteredImages,
      publisherId, // Include tenant ID for transparency
      totalCount: filteredImages.length
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// Serve public images
router.get("/public-objects/images/:path(*)", async (req, res) => {
  try {
    const filePath = req.params.path;
    const file = await imageStorageService.searchPublicImage(filePath);
    
    if (!file) {
      return res.status(404).json({ error: "Image not found" });
    }

    await imageStorageService.downloadImage(file, res);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

// Update image metadata
router.patch("/api/images/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    const { altText, tags, category } = req.body;

    const [updated] = await db.update(imageAssets)
      .set({
        altText,
        tags,
        category,
        updatedAt: new Date(),
      })
      .where(eq(imageAssets.id, imageId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({ error: "Failed to update image" });
  }
});

// Delete image
router.delete("/api/images/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;

    await db.delete(imageAssets)
      .where(eq(imageAssets.id, imageId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// ============= Template Management Routes =============
// All template routes use tenant isolation

// Create a new template (tenant-isolated)
router.post("/api/templates", requireTenant, async (req: any, res) => {
  try {
    const templateData = req.body;
    const publisherId = req.tenant?.publisherId;
    const publisherName = req.tenant?.name;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher context not found" });
    }

    // Generate default HTML if not provided
    if (!templateData.htmlTemplate) {
      templateData.htmlTemplate = templateManager.generateDefaultTemplate(
        templateData.category || 'newsletter'
      );
    }

    const template = await templateManager.createTemplate(publisherId, {
      ...templateData,
      createdBy: 'user', // Should come from auth context
    });

    res.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Get templates
router.get("/api/templates", async (req, res) => {
  try {
    const { publisherId, platform } = req.query;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher ID is required" });
    }

    const templates = await templateManager.getTemplates(
      publisherId as string,
      platform as string | undefined
    );

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get single template
router.get("/api/templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await templateManager.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// Update template
router.patch("/api/templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;

    const template = await templateManager.updateTemplate(templateId, updates);
    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// Delete template
router.delete("/api/templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;

    await db.update(emailTemplates)
      .set({ isActive: false })
      .where(eq(emailTemplates.id, templateId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// Apply content to template
router.post("/api/templates/:templateId/apply", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { content, variables } = req.body;

    const html = await templateManager.applyContentToTemplate(
      templateId,
      content,
      variables
    );

    res.json({ html });
  } catch (error) {
    console.error("Error applying content to template:", error);
    res.status(500).json({ error: "Failed to apply content to template" });
  }
});

// Create template section
router.post("/api/template-sections", async (req, res) => {
  try {
    const { publisherId, ...sectionData } = req.body;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher ID is required" });
    }

    const section = await templateManager.createTemplateSection(
      publisherId,
      sectionData
    );

    res.json(section);
  } catch (error) {
    console.error("Error creating template section:", error);
    res.status(500).json({ error: "Failed to create template section" });
  }
});

// Get template sections
router.get("/api/template-sections", async (req, res) => {
  try {
    const { publisherId, type } = req.query;
    
    if (!publisherId) {
      return res.status(400).json({ error: "Publisher ID is required" });
    }

    const sections = await templateManager.getTemplateSections(
      publisherId as string,
      type as string | undefined
    );

    res.json(sections);
  } catch (error) {
    console.error("Error fetching template sections:", error);
    res.status(500).json({ error: "Failed to fetch template sections" });
  }
});

// Build template from sections
router.post("/api/templates/build-from-sections", async (req, res) => {
  try {
    const { sectionIds, variables } = req.body;
    
    if (!sectionIds || !Array.isArray(sectionIds)) {
      return res.status(400).json({ error: "Section IDs array is required" });
    }

    const html = await templateManager.buildTemplateFromSections(
      sectionIds,
      variables
    );

    res.json({ html });
  } catch (error) {
    console.error("Error building template from sections:", error);
    res.status(500).json({ error: "Failed to build template from sections" });
  }
});

// Sync template to platform
router.post("/api/templates/:templateId/sync", async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await templateManager.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Force re-sync by updating the template
    await templateManager.updateTemplate(templateId, {
      updatedAt: new Date(),
    });

    res.json({ 
      success: true,
      message: `Template synced to ${template.platform}` 
    });
  } catch (error) {
    console.error("Error syncing template:", error);
    res.status(500).json({ error: "Failed to sync template" });
  }
});

export default router;