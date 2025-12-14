/**
 * THE RAIL EXCHANGE™ — Profile API Types
 * 
 * Shared types for profile-related API routes.
 */

import type { EntityType, VisibilityTier } from '@/types/entity';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface ProfileRequest {
  slug: string;
}

export interface VerificationRequest {
  entityId: string;
}

export interface RatingsRequest {
  entityId: string;
}

export interface VisibilityRequest {
  entityId: string;
}

export interface SEORequest {
  slug: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface APISuccessResponse<T> {
  success: true;
  data: T;
}

export interface APIErrorResponse {
  success: false;
  data: null;
  error: string;
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

// ============================================================================
// PROFILE DATA SHAPES
// ============================================================================

export interface ProfileData {
  id: string;
  slug: string;
  type: EntityType;
  name: string;
  displayName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isActive: boolean;
  memberSince?: string;
  // Extended data loaded from related endpoints
}

export interface VerificationResponseData {
  status: 'not_verified' | 'in_progress' | 'verified' | 'expired';
  verifiedAt?: string;
  expiresAt?: string;
  renewalDate?: string;
  certificationBadges?: Array<{
    id: string;
    name: string;
    label: string;
    issuedAt?: string;
    expiresAt?: string;
  }>;
}

export interface RatingsResponseData {
  averageRating: number | null;
  totalReviews: number;
  breakdown?: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

export interface VisibilityResponseData {
  tier: VisibilityTier;
  isFeatured: boolean;
  isPriority: boolean;
  boostExpiresAt?: string;
  addOns: Array<{
    id: string;
    type: string;
    appliedTo?: string;
    expiresAt?: string;
  }>;
}

export interface SEOResponseData {
  isIndexable: boolean;
  canonicalUrl: string;
  title: string;
  description: string;
  entityType: EntityType;
  primaryCategories: string[];
  locationData?: {
    city?: string;
    state?: string;
    country?: string;
  };
  keywords?: string[];
}
