import { Router } from "express";
import { ObjectStorageService } from "./objectStorage";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get presigned URL for direct upload from client
router.post("/api/email-images/upload-url", async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getEmailImageUploadURL();
    
    res.json({ 
      uploadURL,
      message: "Use this URL to upload your image directly" 
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// Upload image from form data
router.post("/api/email-images/upload", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const objectStorageService = new ObjectStorageService();
    const imageUrl = await objectStorageService.uploadEmailImageFromBuffer(
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ 
      imageUrl,
      message: "Image uploaded successfully",
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Convert base64 image to hosted URL
router.post("/api/email-images/base64-upload", async (req, res) => {
  try {
    const { base64Data, contentType = 'image/png' } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({ error: "No base64 data provided" });
    }

    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const objectStorageService = new ObjectStorageService();
    const imageUrl = await objectStorageService.uploadEmailImageFromBuffer(
      buffer,
      contentType
    );

    res.json({ 
      imageUrl,
      message: "Base64 image uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    res.status(500).json({ error: "Failed to upload base64 image" });
  }
});

// Serve public email images
router.get("/api/email-images/:imagePath(*)", async (req, res) => {
  try {
    const imagePath = req.params.imagePath;
    const objectStorageService = new ObjectStorageService();
    
    // Try to find the image in public storage
    const file = await objectStorageService.searchPublicObject(`email-images/${imagePath}`);
    
    if (!file) {
      return res.status(404).json({ error: "Image not found" });
    }
    
    // Stream the image with appropriate caching headers
    objectStorageService.downloadObject(file, res, 86400); // Cache for 24 hours
  } catch (error) {
    console.error("Error serving email image:", error);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

// Get image library for email editor
router.get("/api/email-images/library", async (req, res) => {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return a sample library
    const library = [
      {
        id: "header-1",
        name: "Newsletter Header",
        url: "/api/email-images/header-default.png",
        category: "headers",
        width: 600,
        height: 200
      },
      {
        id: "divider-1",
        name: "Section Divider",
        url: "/api/email-images/divider-default.png",
        category: "dividers",
        width: 600,
        height: 2
      },
      {
        id: "logo-1",
        name: "SharpSend Logo",
        url: "/api/email-images/logo-default.png",
        category: "logos",
        width: 200,
        height: 50
      }
    ];

    res.json({ 
      images: library,
      total: library.length 
    });
  } catch (error) {
    console.error("Error fetching image library:", error);
    res.status(500).json({ error: "Failed to fetch image library" });
  }
});

export const emailImageRoutes = router;