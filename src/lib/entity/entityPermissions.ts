/**
 * THE RAIL EXCHANGE™ — Entity Permissions
 * 
 * Derives entity entitlements from verification status and visibility tier.
 * NO auth logic. NO enforcement. Pure data derivation.
 */

import {
  Entity,
  EntityEntitlements,
  EntityType,
  VerificationStatus,
  VisibilityTier,
  ENTITY_TYPES,
  VERIFICATION_STATUS,
  VISIBILITY_TIER,
  DEFAULT_ENTITLEMENTS,
} from '@/types/entity';

/**
 * Derive entitlements for an entity based on type, verification, and visibility
 * 
 * RULE: This function NEVER enforces. It only derives what SHOULD be allowed.
 * Actual enforcement happens elsewhere (API layer, middleware).
 */
export function deriveEntityEntitlements(
  type: EntityType,
  verificationStatus: VerificationStatus,
  visibilityTier: VisibilityTier
): EntityEntitlements {
  // Start with defaults (all false)
  const entitlements: EntityEntitlements = { ...DEFAULT_ENTITLEMENTS };
  
  // Verification is required for most entitlements
  const isVerified = verificationStatus === VERIFICATION_STATUS.VERIFIED;
  
  // Visibility must not be hidden
  const isVisible = visibilityTier !== VISIBILITY_TIER.HIDDEN;
  
  // Verified badge
  entitlements.hasVerifiedBadge = isVerified;
  
  // Visibility boost (featured or priority)
  entitlements.hasVisibilityBoost = 
    visibilityTier === VISIBILITY_TIER.FEATURED || 
    visibilityTier === VISIBILITY_TIER.PRIORITY;
  
  // Type-specific entitlements
  switch (type) {
    case ENTITY_TYPES.SELLER:
      entitlements.canListItems = isVerified;
      entitlements.canReceiveInquiries = isVerified && isVisible;
      entitlements.canDisplayContact = isVerified;
      entitlements.canDisplayListings = isVisible;
      break;
      
    case ENTITY_TYPES.CONTRACTOR:
      entitlements.canReceiveInquiries = isVerified && isVisible;
      entitlements.canDisplayContact = isVerified;
      entitlements.canDisplayServices = isVisible;
      break;
      
    case ENTITY_TYPES.COMPANY:
      entitlements.canDisplayContact = isVisible;
      entitlements.canDisplayCompanyInfo = isVisible;
      break;
  }
  
  return entitlements;
}

/**
 * Check if an entity can receive public inquiries
 */
export function canReceiveInquiries(entity: Entity | null): boolean {
  if (!entity) return false;
  return entity.entitlements?.canReceiveInquiries ?? false;
}

/**
 * Check if an entity's contact info can be displayed
 */
export function canDisplayContact(entity: Entity | null): boolean {
  if (!entity) return false;
  return entity.entitlements?.canDisplayContact ?? false;
}

/**
 * Check if an entity has a verified badge
 */
export function hasVerifiedBadge(entity: Entity | null): boolean {
  if (!entity) return false;
  return entity.entitlements?.hasVerifiedBadge ?? false;
}

/**
 * Check if an entity has visibility boost
 */
export function hasVisibilityBoost(entity: Entity | null): boolean {
  if (!entity) return false;
  return entity.entitlements?.hasVisibilityBoost ?? false;
}

/**
 * Get entitlements for an entity, with safe fallback
 */
export function getEntityEntitlements(entity: Entity | null): EntityEntitlements {
  if (!entity) return DEFAULT_ENTITLEMENTS;
  return entity.entitlements ?? DEFAULT_ENTITLEMENTS;
}

/**
 * Determine if profile should show upgrade prompts
 * (for entity owner viewing their own profile)
 */
export function shouldShowUpgradePrompt(
  entity: Entity | null,
  isOwner: boolean
): boolean {
  if (!entity || !isOwner) return false;
  
  // Show upgrade if not at highest tier
  return entity.visibilityTier !== VISIBILITY_TIER.PRIORITY;
}
