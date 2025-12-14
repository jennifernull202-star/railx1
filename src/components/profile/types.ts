/**
 * THE RAIL EXCHANGE™ — Unified Profile Types
 * 
 * Core types for the unified profile system.
 * Supports: Sellers, Contractors, Companies
 * 
 * ONE profile page per entity. NO role-based routing.
 */

import type { 
  Entity, 
  EntityType, 
  VerificationStatus, 
  VisibilityTier,
  EntityListing,
  EntityService,
  EntityContact,
  EntityLocation,
  EntityCompanyInfo
} from '@/types/entity';

// ============================================================================
// AI VERIFICATION STATES
// ============================================================================

export const AI_VERIFICATION_STATUS = {
  NOT_VERIFIED: 'not_verified',
  IN_PROGRESS: 'in_progress',    // AI Review in progress
  VERIFIED: 'verified',
  EXPIRED: 'expired',
} as const;

export type AIVerificationStatus = typeof AI_VERIFICATION_STATUS[keyof typeof AI_VERIFICATION_STATUS];

// ============================================================================
// VERIFICATION DATA
// ============================================================================

export interface VerificationData {
  status: AIVerificationStatus;
  verifiedAt?: string;
  expiresAt?: string;                    // Renewal date
  renewalDate?: string;                  // "Valid through MM/YYYY"
  certificationBadges?: CertificationBadge[];
  aiReviewStartedAt?: string;
  aiReviewCompletedAt?: string;
}

export interface CertificationBadge {
  id: string;
  name: string;                          // e.g., "FRA", "AAR", "OSHA"
  label: string;                         // e.g., "FRA Compliant"
  issuedAt?: string;
  expiresAt?: string;
}

// ============================================================================
// RATINGS DATA
// ============================================================================

export interface RatingsData {
  averageRating: number | null;          // null = no ratings yet (NOT zero)
  totalReviews: number;
  breakdown?: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

// ============================================================================
// VISIBILITY DATA
// ============================================================================

export interface VisibilityData {
  tier: VisibilityTier;
  isFeatured: boolean;
  isPriority: boolean;
  boostExpiresAt?: string;
  addOns: VisibilityAddOn[];
}

export interface VisibilityAddOn {
  id: string;
  type: 'featured_listing' | 'priority_placement' | 'homepage_spotlight';
  appliedTo?: string;                    // listing ID if applicable
  expiresAt?: string;
}

// ============================================================================
// SEO DATA
// ============================================================================

export interface SEOData {
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

// ============================================================================
// BUYER REQUEST (ISO)
// ============================================================================

export interface BuyerRequest {
  id: string;
  title: string;
  category?: string;
  urgency?: 'standard' | 'urgent' | 'critical';
  createdAt?: string;
  status: 'active' | 'fulfilled' | 'expired';
}

// ============================================================================
// UNIFIED PROFILE
// ============================================================================

export interface UnifiedProfile extends Entity {
  // Extended verification (AI-driven)
  verification: VerificationData;
  
  // Ratings
  ratings: RatingsData;
  
  // Visibility & Add-ons
  visibility: VisibilityData;
  
  // SEO
  seo: SEOData;
  
  // Buyer requests (ISO)
  buyerRequests?: BuyerRequest[];
  
  // Capabilities (for contractors)
  capabilities?: string[];
  
  // Regions served
  regionsServed?: string[];
  
  // Media gallery
  mediaGallery?: MediaItem[];
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document';
  alt?: string;
  caption?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProfileAPIResponse {
  success: boolean;
  data: UnifiedProfile | null;
  error?: string;
}

export interface VerificationAPIResponse {
  success: boolean;
  data: VerificationData | null;
  error?: string;
}

export interface RatingsAPIResponse {
  success: boolean;
  data: RatingsData | null;
  error?: string;
}

export interface VisibilityAPIResponse {
  success: boolean;
  data: VisibilityData | null;
  error?: string;
}

export interface SEOAPIResponse {
  success: boolean;
  data: SEOData | null;
  error?: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface UnifiedProfileShellProps {
  profile: UnifiedProfile | null;
  isLoading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}

export interface ProfileHeaderProps {
  profile: UnifiedProfile | null;
}

export interface ProfileVisibilityStripProps {
  visibility: VisibilityData | null;
  entityName?: string;
}

export interface ProfileRatingsProps {
  ratings: RatingsData | null;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export interface ProfileVerificationBlockProps {
  verification: VerificationData | null;
  entityName?: string;
}

export interface ProfileBadgesProps {
  verification: VerificationData | null;
  visibility: VisibilityData | null;
}

// ============================================================================
// SECTION PROPS
// ============================================================================

export interface AboutSectionProps {
  description?: string;
  tagline?: string;
  memberSince?: string;
}

export interface ListingsSectionProps {
  listings?: EntityListing[];
  maxItems?: number;
}

export interface ServicesSectionProps {
  services?: EntityService[];
  maxItems?: number;
}

export interface BuyerRequestsSectionProps {
  requests?: BuyerRequest[];
  maxItems?: number;
}

export interface CapabilitiesSectionProps {
  capabilities?: string[];
}

export interface RegionsServedSectionProps {
  regions?: string[];
  location?: EntityLocation;
}

export interface CertificationsSectionProps {
  certifications?: CertificationBadge[];
}

export interface MediaGallerySectionProps {
  media?: MediaItem[];
  maxItems?: number;
}

export interface ContactSectionProps {
  contact?: EntityContact;
  canDisplayContact?: boolean;
}

export interface SimilarEntitiesSectionProps {
  entityType: EntityType;
  entityId: string;
}

// ============================================================================
// EMPTY DEFAULTS (Safe fallbacks - NO mock data)
// ============================================================================

export const EMPTY_VERIFICATION: VerificationData = {
  status: AI_VERIFICATION_STATUS.NOT_VERIFIED,
  certificationBadges: [],
};

export const EMPTY_RATINGS: RatingsData = {
  averageRating: null,    // null = no ratings (NOT zero)
  totalReviews: 0,
};

export const EMPTY_VISIBILITY: VisibilityData = {
  tier: 'basic',
  isFeatured: false,
  isPriority: false,
  addOns: [],
};

export const EMPTY_SEO: SEOData = {
  isIndexable: true,
  canonicalUrl: '',
  title: '',
  description: '',
  entityType: 'seller',
  primaryCategories: [],
};
