import { Router } from "express";
import { db } from "./db";
import { assignmentAssets } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Upload and process image
router.post("/api/assignments/:assignmentId/assets", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { assignmentId } = req.params;
    const { credit, license, altText } = req.body;
    const publisherId = "demo-publisher"; // In production, get from session

    // Generate unique filename
    const fileId = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(req.file.originalname) || ".jpg";
    const fileName = `${fileId}${ext}`;

    // For now, skip sharp processing to avoid import issues
    // In production, you'd use sharp for image processing
    const metadata = { width: 800, height: 600, format: "jpeg" };

    // Generate different sizes
    const sizes = [
      { name: "full", width: 600 },
      { name: "half", width: 288 },
      { name: "thumb", width: 150 },
    ];

    // Save the original file for now (without sharp processing)
    const outputFileName = `${fileId}${ext}`;
    const outputPath = path.join(uploadDir, outputFileName);
    await fs.writeFile(outputPath, req.file.buffer);
    
    const stats = await fs.stat(outputPath);
    const processedImages = sizes.map(size => ({
      size: size.name,
      url: `/uploads/${outputFileName}`, // Use same file for all sizes temporarily
      fileSizeKb: Math.round(stats.size / 1024),
    }));

    // Use the full size as the main URL
    const mainImage = processedImages.find(img => img.size === "full") || processedImages[0];
    const thumbnail = processedImages.find(img => img.size === "thumb");

    // Save to database
    const [asset] = await db
      .insert(assignmentAssets)
      .values({
        publisherId,
        assignmentId,
        url: mainImage.url,
        thumbnailUrl: thumbnail?.url,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        width: metadata.width,
        height: metadata.height,
        fileSizeKb: mainImage.fileSizeKb,
        altText,
        credit,
        license,
      })
      .returning();

    res.json({
      ...asset,
      sizes: processedImages,
    });
  } catch (error) {
    console.error("Error uploading asset:", error);
    res.status(500).json({ error: "Failed to upload asset" });
  }
});

// Get assets for an assignment
router.get("/api/assignments/:assignmentId/assets", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const publisherId = "demo-publisher";

    const assets = await db
      .select()
      .from(assignmentAssets)
      .where(and(
        eq(assignmentAssets.assignmentId, assignmentId),
        eq(assignmentAssets.publisherId, publisherId)
      ))
      .orderBy(assignmentAssets.createdAt);

    res.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// Delete an asset
router.delete("/api/assets/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    const publisherId = "demo-publisher";

    const [deleted] = await db
      .delete(assignmentAssets)
      .where(and(
        eq(assignmentAssets.id, assetId),
        eq(assignmentAssets.publisherId, publisherId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Try to delete the actual files (don't fail if they don't exist)
    try {
      if (deleted.url) {
        const filePath = path.join(process.cwd(), "public", deleted.url);
        await fs.unlink(filePath).catch(() => {});
      }
      if (deleted.thumbnailUrl) {
        const thumbPath = path.join(process.cwd(), "public", deleted.thumbnailUrl);
        await fs.unlink(thumbPath).catch(() => {});
      }
    } catch (error) {
      // Files might not exist, that's okay
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
});

export default router;