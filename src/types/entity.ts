/**
 * THE RAIL EXCHANGE™ — Entity Type Definitions
 * 
 * Core types for the unified Entity Profile system.
 * Supports: Sellers, Contractors, and Companies.
 * 
 * ARCHITECTURE RULE: All entity types share ONE type system.
 * Differences are data-driven, not code-path-driven.
 */

// ============================================================================
// ENTITY TYPE ENUM (LOCKED)
// ============================================================================

export const ENTITY_TYPES = {
  SELLER: 'seller',
  CONTRACTOR: 'contractor',
  COMPANY: 'company',
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

// ============================================================================
// VERIFICATION STATUS
// ============================================================================

export const VERIFICATION_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

// ============================================================================
// VISIBILITY TIER
// ============================================================================

export const VISIBILITY_TIER = {
  HIDDEN: 'hidden',       // Not visible in public directory
  BASIC: 'basic',         // Visible, standard placement
  FEATURED: 'featured',   // Enhanced visibility
  PRIORITY: 'priority',   // Top placement
} as const;

export type VisibilityTier = typeof VISIBILITY_TIER[keyof typeof VISIBILITY_TIER];

// ============================================================================
// ENTITY ENTITLEMENTS
// ============================================================================

export interface EntityEntitlements {
  canListItems: boolean;
  canReceiveInquiries: boolean;
  canDisplayContact: boolean;
  canDisplayServices: boolean;
  canDisplayListings: boolean;
  canDisplayCompanyInfo: boolean;
  hasVerifiedBadge: boolean;
  hasVisibilityBoost: boolean;
}

// ============================================================================
// CONTACT INFORMATION
// ============================================================================

export interface EntityContact {
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

// ============================================================================
// LOCATION DATA
// ============================================================================

export interface EntityLocation {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  serviceArea?: string[];
}

// ============================================================================
// LISTING REFERENCE (for sellers)
// ============================================================================

export interface EntityListing {
  id: string;
  title: string;
  category: string;
  price?: {
    amount: number;
    currency: string;
  };
  condition?: string;
  primaryImageUrl?: string;
  status: string;
  createdAt: string;
}

// ============================================================================
// SERVICE REFERENCE (for contractors)
// ============================================================================

export interface EntityService {
  id: string;
  name: string;
  category: string;
  description?: string;
  serviceArea?: string[];
}

// ============================================================================
// COMPANY INFO (for companies)
// ============================================================================

export interface EntityCompanyInfo {
  industry?: string;
  founded?: string;
  size?: string;
  description?: string;
  specializations?: string[];
}

// ============================================================================
// CORE ENTITY INTERFACE
// ============================================================================

export interface Entity {
  // Identity
  id: string;
  type: EntityType;
  slug?: string;
  
  // Display
  name: string;
  displayName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  
  // Status
  verificationStatus: VerificationStatus;
  visibilityTier: VisibilityTier;
  isActive: boolean;
  
  // Entitlements (derived from verification + subscription)
  entitlements: EntityEntitlements;
  
  // Location
  location?: EntityLocation;
  
  // Contact (may be restricted based on entitlements)
  contact?: EntityContact;
  
  // Type-specific data (only one populated per entity)
  listings?: EntityListing[];
  services?: EntityService[];
  companyInfo?: EntityCompanyInfo;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  memberSince?: string;
}

// ============================================================================
// ENTITY PROFILE PROPS
// ============================================================================

export interface EntityProfileProps {
  entity: Entity | null;
  isLoading?: boolean;
  error?: string | null;
}

// ============================================================================
// DEFAULT ENTITLEMENTS (safe fallback)
// ============================================================================

export const DEFAULT_ENTITLEMENTS: EntityEntitlements = {
  canListItems: false,
  canReceiveInquiries: false,
  canDisplayContact: false,
  canDisplayServices: false,
  canDisplayListings: false,
  canDisplayCompanyInfo: false,
  hasVerifiedBadge: false,
  hasVisibilityBoost: false,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isEntityType(value: unknown): value is EntityType {
  return (
    value === ENTITY_TYPES.SELLER ||
    value === ENTITY_TYPES.CONTRACTOR ||
    value === ENTITY_TYPES.COMPANY
  );
}

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return Object.values(VERIFICATION_STATUS).includes(value as VerificationStatus);
}

export function isVisibilityTier(value: unknown): value is VisibilityTier {
  return Object.values(VISIBILITY_TIER).includes(value as VisibilityTier);
}
