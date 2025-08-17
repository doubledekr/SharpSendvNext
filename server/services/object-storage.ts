import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import type { ImageAsset } from "@shared/schema";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client for interacting with Replit's storage
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Image optimization settings for different use cases
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// The object storage service for SharpSend image management
export class ImageStorageService {
  constructor() {}

  // Get the public object search paths for CDN-accessible images
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Object storage is not configured properly."
      );
    }
    return paths;
  }

  // Get the private object directory for secure uploads
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Object storage is not configured properly."
      );
    }
    return dir;
  }

  // Upload an image to object storage and return the URLs
  async uploadImage(
    publisherId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    category: string = 'content'
  ): Promise<{
    originalUrl: string;
    cdnUrl: string;
    objectPath: string;
  }> {
    try {
      const objectId = `${publisherId}/${category}/${randomUUID()}-${fileName}`;
      const privateDir = this.getPrivateObjectDir();
      const fullPath = `${privateDir}/images/${objectId}`;

      const { bucketName, objectName } = this.parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Upload the file
      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000',
        },
      });

      // Generate URLs
      const signedUrl = await this.signObjectURL({
        bucketName,
        objectName,
        method: "GET",
        ttlSec: 86400 * 365, // 1 year
      });

      // For CDN URL, we'll use the public path
      const publicPaths = this.getPublicObjectSearchPaths();
      const cdnPath = `${publicPaths[0]}/images/${objectId}`;
      
      // Copy to public directory for CDN access
      const { bucketName: publicBucket, objectName: publicObject } = this.parseObjectPath(cdnPath);
      const publicFile = objectStorageClient.bucket(publicBucket).file(publicObject);
      await bucket.file(objectName).copy(publicFile);

      return {
        originalUrl: signedUrl,
        cdnUrl: `/public-objects/images/${objectId}`,
        objectPath: `/objects/images/${objectId}`,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image to storage');
    }
  }

  // Get a presigned upload URL for client-side uploads
  async getUploadUrl(publisherId: string, category: string = 'content'): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = `${publisherId}/${category}/${randomUUID()}`;
    const fullPath = `${privateObjectDir}/images/${objectId}`;

    const { bucketName, objectName } = this.parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return this.signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Search for a public image from the CDN paths
  async searchPublicImage(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/images/${filePath}`;

      const { bucketName, objectName } = this.parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Download an image to the response
  async downloadImage(file: File, res: Response, cacheTtlSec: number = 31536000) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "image/jpeg",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Get the image file from the object path
  async getImageFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/images/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 3) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(2).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}images/${entityId}`;
    const { bucketName, objectName } = this.parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  // Parse object path into bucket and object name
  private parseObjectPath(path: string): {
    bucketName: string;
    objectName: string;
  } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return {
      bucketName,
      objectName,
    };
  }

  // Sign an object URL for secure access
  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }

  // Normalize a raw path (from upload) to an object path
  normalizeObjectPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
  
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
  
    if (!rawObjectPath.includes(objectEntityDir)) {
      return rawObjectPath;
    }
  
    // Extract the entity ID from the path
    const entityId = rawObjectPath.split(objectEntityDir)[1];
    return `/objects/${entityId}`;
  }
}