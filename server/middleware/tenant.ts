import { Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { publishers } from '../../shared/schema-multitenant';
import { eq } from 'drizzle-orm';

export interface TenantInfo {
  id: string;
  subdomain: string;
  name: string;
  settings: any;
}

// Extend Express Request type to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
    }
  }
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - demo.sharpsend.io -> demo
 * - publish.sharpsend.io -> publish
 * - localhost:5000 -> null
 * - sharpsend.io -> null
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // For local development, check for subdomain patterns
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'demo'; // Default to demo for local development
  }
  
  // For Replit dev environment
  if (host.includes('.replit.dev')) {
    // Extract subdomain from x-forwarded-host header if available
    return 'demo'; // Default to demo for Replit dev
  }
  
  // For production domains
  const parts = host.split('.');
  
  // Need at least 3 parts for a subdomain (subdomain.domain.tld)
  if (parts.length >= 3) {
    // Return the first part as subdomain
    return parts[0];
  }
  
  return null;
}

/**
 * Middleware to identify and load tenant based on subdomain
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get subdomain from hostname or x-forwarded-host header
    const hostname = req.get('x-forwarded-host') || req.hostname;
    const subdomain = extractSubdomain(hostname);
    
    if (!subdomain) {
      // No subdomain detected, use default tenant
      req.tenant = {
        id: '07db1cad-c3b5-4eb3-87ef-69fb38a212c3',
        subdomain: 'demo',
        name: 'Demo Publisher',
        settings: {}
      };
      return next();
    }
    
    // Look up publisher by subdomain
    const [publisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.subdomain, subdomain))
      .limit(1);
    
    if (!publisher) {
      // Subdomain not found, fallback to demo
      req.tenant = {
        id: '07db1cad-c3b5-4eb3-87ef-69fb38a212c3',
        subdomain: 'demo',
        name: 'Demo Publisher',
        settings: {}
      };
    } else {
      // Set tenant info from database
      req.tenant = {
        id: publisher.id,
        subdomain: publisher.subdomain,
        name: publisher.name,
        settings: publisher.settings || {}
      };
    }
    
    // Add tenant info to response locals for frontend access
    res.locals.tenant = req.tenant;
    
    next();
  } catch (error) {
    console.error('Error in tenant middleware:', error);
    // On error, use demo tenant
    req.tenant = {
      id: '07db1cad-c3b5-4eb3-87ef-69fb38a212c3',
      subdomain: 'demo',
      name: 'Demo Publisher',
      settings: {}
    };
    next();
  }
}

/**
 * Middleware to require a valid tenant
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      error: 'No tenant context available'
    });
  }
  next();
}

/**
 * Get tenant info for API responses
 */
export function getTenantInfo(req: Request) {
  return {
    id: req.tenant?.id,
    subdomain: req.tenant?.subdomain,
    name: req.tenant?.name
  };
}