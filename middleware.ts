/**
 * THE RAIL EXCHANGE™ — Global Edge Middleware
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ARCHITECTURAL LOCK — MINIMAL ENFORCEMENT ONLY                           │
 * │                                                                          │
 * │ This middleware provides EARLY auth gating before RSC render.           │
 * │ It does NOT replace existing per-route or API enforcement.              │
 * │                                                                          │
 * │ ALLOWED:                                                                 │
 * │ - Auth check (is user logged in?)                                       │
 * │ - Admin check (is user admin?)                                          │
 * │ - Redirect to login for protected routes                                │
 * │                                                                          │
 * │ FORBIDDEN:                                                               │
 * │ - Verification status checks                                            │
 * │ - Analytics entitlement checks                                          │
 * │ - Tier/subscription logic                                               │
 * │ - Rate limiting                                                         │
 * │ - Business rules of any kind                                            │
 * │                                                                          │
 * │ Existing guards in APIs and Server Components remain authoritative.     │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Routes that require authentication (any logged-in user)
 */
const AUTH_REQUIRED_PREFIXES = [
  '/dashboard',
  '/admin',
];

/**
 * Routes that require admin role specifically
 */
const ADMIN_REQUIRED_PREFIXES = [
  '/admin',
];

/**
 * Public routes explicitly allowed without auth
 * (Marketing, public profiles, public APIs)
 */
const PUBLIC_PREFIXES = [
  '/',
  '/about',
  '/auth',
  '/api/auth',
  '/api/verification',
  '/api/profiles',
  '/api/ratings',
  '/api/visibility',
  '/api/listings', // GET is public, POST enforced server-side
  '/api/contractors', // Public directory
  '/api/iso', // Public ISO requests
  '/contact',
  '/contractors',
  '/how-it-works',
  '/iso',
  '/listings',
  '/marketplace',
  '/pricing',
  '/privacy',
  '/profile',
  '/search',
  '/sellers',
  '/terms',
];

/**
 * Static assets and Next.js internals (always allowed)
 */
const STATIC_PREFIXES = [
  '/_next',
  '/favicon',
  '/icon',
  '/opengraph-image',
  '/twitter-image',
  '/placeholders',
  '/fonts',
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isStaticAsset(pathname: string): boolean {
  return STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function isPublicRoute(pathname: string): boolean {
  // Exact match for root
  if (pathname === '/') return true;
  
  // Prefix match for public routes
  return PUBLIC_PREFIXES.some(prefix => 
    prefix !== '/' && pathname.startsWith(prefix)
  );
}

function requiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function requiresAdmin(pathname: string): boolean {
  return ADMIN_REQUIRED_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─────────────────────────────────────────────────────────────────────────
  // PASS 1: Static assets — always allow
  // ─────────────────────────────────────────────────────────────────────────
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASS 2: Public routes — always allow
  // ─────────────────────────────────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASS 3: Protected routes — check auth
  // ─────────────────────────────────────────────────────────────────────────
  if (requiresAuth(pathname)) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // No token = not authenticated
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ─────────────────────────────────────────────────────────────────────
    // PASS 4: Admin routes — check admin role
    // ─────────────────────────────────────────────────────────────────────
    if (requiresAdmin(pathname)) {
      // Token exists but user is not admin
      if (!token.isAdmin) {
        // Redirect non-admins to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Authenticated (and admin if required) — allow
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASS 5: Unmatched routes — allow (catch-all)
  // These will be handled by Next.js 404 or specific route handlers
  // ─────────────────────────────────────────────────────────────────────────
  return NextResponse.next();
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCHER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
