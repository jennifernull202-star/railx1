/**
 * THE RAIL EXCHANGE™ — UI Utilities
 * 
 * Shared UI helper functions for GLOBAL UI ENFORCEMENT
 * - Single badge rule (Elite ONLY for paid visibility)
 * - CTA blocked states
 * - Error feedback (403/429/verification_required)
 * 
 * S-2: Trust signal clarity via badge tooltips
 * 
 * FINAL EXECUTION COMMAND:
 * - Elite is the ONLY paid visibility tier
 * - Premium/Featured are legacy, map to Sponsored
 * - Verified = Identity Verified (sellers) or Business Verified (contractors)
 */

import {
  ELITE_BADGE_TOOLTIP,
  VERIFIED_SELLER_TOOLTIP,
} from './trust-signals';

// ============================================
// SINGLE BADGE RULE: Elite > Verified (Elite ONLY for paid)
// Legacy: Premium/Featured still accepted but map to Elite/Sponsored
// ============================================
export type BadgeTier = 'ELITE' | 'PREMIUM' | 'FEATURED' | 'VERIFIED';

export function getHighestBadge(badges: {
  elite?: boolean
  premium?: boolean
  featured?: boolean
  verified?: boolean
}): BadgeTier | null {
  // Elite is the ONLY paid tier - Premium/Featured map to Elite
  if (badges.elite || badges.premium || badges.featured) return 'ELITE'
  if (badges.verified) return 'VERIFIED'
  return null
}

// S-5.1: Badge styles - Elite ONLY for paid visibility, all show "Sponsored"
export const BADGE_STYLES: Record<BadgeTier, { bg: string; text: string; label: string; title: string; isPaid: boolean }> = {
  ELITE: { 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-600', 
    text: 'text-white', 
    label: 'Sponsored', 
    title: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  // Legacy - maps to Sponsored
  PREMIUM: { 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-600', 
    text: 'text-white', 
    label: 'Sponsored', 
    title: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  // Legacy - maps to Sponsored
  FEATURED: { 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-600', 
    text: 'text-white', 
    label: 'Sponsored', 
    title: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  VERIFIED: { 
    bg: 'bg-blue-600', 
    text: 'text-white', 
    label: 'ID Verified', 
    title: VERIFIED_SELLER_TOOLTIP,
    isPaid: false,
  },
};

// ============================================
// CTA BLOCKED STATES
// ============================================
export type BlockedReason = 
  | 'rate_limited' 
  | 'expired' 
  | 'unverified' 
  | 'subscription_required'
  | 'verification_required'
  | 'pending_approval';

export const BLOCKED_HELPERS: Record<BlockedReason, string> = {
  rate_limited: 'This action is temporarily unavailable due to account or security requirements.',
  expired: 'This item is no longer available',
  unverified: 'This action is temporarily unavailable due to account or security requirements.',
  subscription_required: 'Upgrade your plan to access this feature',
  verification_required: 'This action is temporarily unavailable due to account or security requirements.',
  pending_approval: 'Awaiting approval',
};

// ============================================
// ERROR FEEDBACK (UI-FRIENDLY)
// Enterprise requirement: No technical jargon, no silent failures
// ============================================
export type ApiErrorCode = 'forbidden' | 'rate_limited' | 'verification_required' | 'unauthorized' | 'not_found' | 'server_error' | 'generic' | 'email_unverified';

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  forbidden: 'This action is temporarily unavailable due to account or security requirements.',
  rate_limited: 'Action temporarily unavailable. Please try again later.',
  verification_required: 'This action is temporarily unavailable due to account or security requirements.',
  email_unverified: 'This action is temporarily unavailable due to account or security requirements.',
  unauthorized: 'Please sign in to continue',
  not_found: 'This item could not be found',
  server_error: 'Something went wrong. Please try again',
  generic: 'Something went wrong. Please try again',
};

/**
 * Get user-friendly error message from error code or HTTP status
 */
export function getErrorMessage(codeOrStatus: ApiErrorCode | number): string {
  // Handle string error codes
  if (typeof codeOrStatus === 'string') {
    return ERROR_MESSAGES[codeOrStatus] || ERROR_MESSAGES.generic;
  }
  
  // Handle HTTP status codes
  switch (codeOrStatus) {
    case 403:
      return ERROR_MESSAGES.forbidden;
    case 429:
      return ERROR_MESSAGES.rate_limited;
    case 401:
      return ERROR_MESSAGES.unauthorized;
    case 404:
      return ERROR_MESSAGES.not_found;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.server_error;
    default:
      return ERROR_MESSAGES.generic;
  }
}

// Check if response indicates a blocked state
export function isBlockedResponse(status: number): boolean {
  return status === 403 || status === 429;
}

// ============================================
// LOADING STATES (Skeletons only, no spinners)
// ============================================
// SKELETON LOADERS (NO SPINNERS)
// ============================================
export const SKELETON_CLASSES = {
  pulse: 'animate-pulse', // Base pulse animation class
  text: 'h-4 bg-surface-secondary rounded animate-pulse',
  title: 'h-6 bg-surface-secondary rounded animate-pulse',
  heading: 'h-8 bg-surface-secondary rounded animate-pulse',
  button: 'h-10 bg-surface-secondary rounded-lg animate-pulse',
  card: 'bg-surface-secondary rounded-xl animate-pulse',
  avatar: 'rounded-full bg-surface-secondary animate-pulse',
  image: 'aspect-[4/3] bg-surface-secondary rounded-xl animate-pulse',
};
