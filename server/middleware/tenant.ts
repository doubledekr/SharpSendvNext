import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { tenantStorage } from "../storage-multitenant";

// Extend Express Request type to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        publisherId: string;
        publisher: any;
        user: any;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthenticatedRequest extends Request {
  tenant: {
    publisherId: string;
    publisher: any;
    user: any;
  };
}

/**
 * Middleware to authenticate user and set tenant context
 * This ensures all subsequent operations are scoped to the correct publisher
 */
export const authenticateAndSetTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No valid authorization token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; publisherId: string };
    
    // Get user and publisher information
    const user = await storage.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    const publisher = await storage.getPublisherById(decoded.publisherId);
    if (!publisher || !publisher.isActive) {
      return res.status(401).json({ error: "Publisher not found or inactive" });
    }

    // Verify user belongs to the publisher
    if (user.publisherId !== publisher.id) {
      return res.status(403).json({ error: "User does not belong to this publisher" });
    }

    // Set tenant context on request
    req.tenant = {
      publisherId: publisher.id,
      publisher,
      user,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware to extract tenant from subdomain for public routes
 * This allows publisher-specific public pages (e.g., signup forms)
 */
export const extractTenantFromSubdomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const host = req.get("host");
    if (!host) {
      return res.status(400).json({ error: "Host header required" });
    }

    // Extract subdomain (e.g., "acme" from "acme.sharpsend.com")
    const subdomain = host.split(".")[0];
    
    // Skip if it's the main domain or localhost
    if (subdomain === "www" || subdomain === "sharpsend" || host.includes("localhost")) {
      return next();
    }

    // Find publisher by subdomain
    const publisher = await storage.getPublisherBySubdomain(subdomain);
    if (!publisher || !publisher.isActive) {
      return res.status(404).json({ error: "Publisher not found" });
    }

    // Set minimal tenant context for public routes
    req.tenant = {
      publisherId: publisher.id,
      publisher,
      user: null, // No user for public routes
    };

    next();
  } catch (error) {
    console.error("Subdomain extraction error:", error);
    return res.status(500).json({ error: "Failed to extract tenant information" });
  }
};

/**
 * Middleware to ensure tenant context exists
 * Use this after authentication middleware to guarantee tenant context
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(401).json({ error: "Tenant context required" });
  }
  next();
};

/**
 * Middleware to check user permissions within tenant
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.tenant.user.role;
    const roleHierarchy = ["viewer", "editor", "admin"];
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    const userLevel = roleHierarchy.indexOf(userRole);

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

/**
 * Utility function to generate JWT token for user
 */
export const generateToken = (userId: string, publisherId: string): string => {
  return jwt.sign(
    { userId, publisherId },
    JWT_SECRET,
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

/**
 * Utility function to hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

/**
 * Utility function to verify password
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Middleware to log tenant-aware operations for debugging
 */
export const logTenantOperation = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.tenant) {
      console.log(`[${operation}] Publisher: ${req.tenant.publisher.name} (${req.tenant.publisherId})`);
    }
    next();
  };
};

