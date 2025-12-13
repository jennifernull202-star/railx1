/**
 * THE RAIL EXCHANGE™ — Rate Limiting Utility
 * 
 * SECURITY: IP + User-based rate limiting with fail-closed behavior.
 * Stronger limits for unauthenticated/unverified accounts.
 * 
 * Returns 429 with generic, UI-safe error (no details exposed).
 * Enterprise requirement: Consistent fail-closed response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory store for rate limiting
// In production, use Redis for distributed rate limiting
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(rateLimitStore.keys());
  for (const key of keys) {
    const entry = rateLimitStore.get(key);
    if (entry && entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

// Rate limit configurations per endpoint
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  maxRequestsUnverified?: number; // Stricter limit for unverified users
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Auth endpoints - strict limits
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    maxRequestsUnverified: 3,
  },
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    maxRequestsUnverified: 3,
  },
  
  // Contact form - moderate limits
  '/api/contact': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    maxRequestsUnverified: 5,
  },
  
  // Inquiries - prevent spam
  '/api/inquiries': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    maxRequestsUnverified: 5,
  },
  
  // Search - moderate limits
  '/api/search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    maxRequestsUnverified: 30,
  },
  
  // Promo validation - strict to prevent brute force
  '/api/promo/validate': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    maxRequestsUnverified: 5,
  },
  
  // AI endpoints - expensive, strict limits
  '/api/ai/chat': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    maxRequestsUnverified: 3,
  },
  '/api/ai/enhance': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    maxRequestsUnverified: 5,
  },
  '/api/ai/image-analysis': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30,
    maxRequestsUnverified: 10,
  },
  '/api/ai/specsheet': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    maxRequestsUnverified: 3,
  },
  
  // Verification endpoints - moderate limits
  '/api/verification/seller/submit': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    maxRequestsUnverified: 3,
  },
  '/api/verification/seller/upload': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    maxRequestsUnverified: 10,
  },
  '/api/contractors/verification/submit': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    maxRequestsUnverified: 3,
  },
  '/api/contractors/verification/documents': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    maxRequestsUnverified: 10,
  },
  
  // Messages - prevent spam
  '/api/messages': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    maxRequestsUnverified: 10,
  },
  
  // Listings creation - moderate
  '/api/listings': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    maxRequestsUnverified: 5,
  },
};

// Default rate limit for unspecified endpoints
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  maxRequestsUnverified: 50,
};

/**
 * Extract IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (behind proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback - this should rarely happen
  return 'unknown';
}

/**
 * Get rate limit key combining IP and user ID
 */
function getRateLimitKey(ip: string, userId: string | null, endpoint: string): string {
  const userPart = userId || 'anon';
  return `${ip}:${userPart}:${endpoint}`;
}

/**
 * Find matching rate limit config for a path
 */
function findRateLimitConfig(path: string): RateLimitConfig {
  // Exact match first
  if (RATE_LIMIT_CONFIGS[path]) {
    return RATE_LIMIT_CONFIGS[path];
  }
  
  // Check for prefix matches (e.g., /api/ai/* matches /api/ai/chat)
  for (const [configPath, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (path.startsWith(configPath.replace('/*', ''))) {
      return config;
    }
  }
  
  return DEFAULT_RATE_LIMIT;
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or a 429 response if blocked
 */
export async function checkRateLimit(
  request: NextRequest,
  options?: {
    userId?: string | null;
    isVerified?: boolean;
  }
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;
  const config = findRateLimitConfig(path);
  
  // Determine user context
  const userId = options?.userId ?? null;
  const isVerified = options?.isVerified ?? false;
  
  // Use stricter limits for unverified users
  const maxRequests = !isVerified && config.maxRequestsUnverified
    ? config.maxRequestsUnverified
    : config.maxRequests;
  
  const key = getRateLimitKey(ip, userId, path);
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Create new window
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return null; // Allowed
  }
  
  // Increment count
  entry.count++;
  
  if (entry.count > maxRequests) {
    // Rate limited - return generic 429
    // SECURITY: Do not expose rate limit details
    // Enterprise requirement: Consistent UI-safe message
    return NextResponse.json(
      { error: 'Action temporarily unavailable. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      }
    );
  }
  
  return null; // Allowed
}

/**
 * Rate limiting middleware wrapper
 * Use this in API routes that need rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get session for user context
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    // Use available session properties for verification status
    const isVerified = session?.user?.isVerifiedContractor || session?.user?.isSeller || false;
    
    // Check rate limit
    const rateLimitResponse = await checkRateLimit(request, { userId, isVerified });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Execute handler
    return await handler();
  } catch (error) {
    // SECURITY: Fail closed - on any error, block the request
    console.error('Rate limit check failed:', error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}

/**
 * Middleware function for Next.js middleware.ts
 * Applies rate limiting to configured routes
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;
  
  // Only apply to API routes
  if (!path.startsWith('/api/')) {
    return null;
  }
  
  // Skip rate limiting for webhooks (they have their own auth)
  if (path.includes('/webhook')) {
    return null;
  }
  
  // Skip rate limiting for cron (has CRON_SECRET check)
  if (path.includes('/cron/')) {
    return null;
  }
  
  // Rate limiting is handled per-route for more control
  // This middleware just provides the infrastructure
  return null;
}

/**
 * Create a rate limiter for specific use cases
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (request: NextRequest, userId?: string | null, isVerified = false) => {
    const ip = getClientIP(request);
    const path = new URL(request.url).pathname;
    
    const maxRequests = !isVerified && config.maxRequestsUnverified
      ? config.maxRequestsUnverified
      : config.maxRequests;
    
    const key = getRateLimitKey(ip, userId ?? null, path);
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    entry.count++;
    
    if (entry.count > maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }
    
    return { allowed: true, remaining: maxRequests - entry.count };
  };
}

// Specific rate limiters for high-risk endpoints
export const inquiryRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  maxRequestsUnverified: 5,
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  maxRequestsUnverified: 3,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  maxRequestsUnverified: 3,
});
