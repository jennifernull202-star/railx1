/**
 * THE RAIL EXCHANGE™ — Map Visibility Rules
 * ==========================================
 * STATUS: LOCKED — DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
 * 
 * 📍 MAP VISIBILITY & DISCOVERY RULES
 * 
 * ALWAYS shown on map (no add-on required):
 * ✅ Verified Companies (Professional Plan)
 * ✅ Verified Contractors (Professional Plan)
 * → Included in Professional Marketplace Access ($2,500/year)
 * 
 * CONDITIONALLY shown on map:
 * ⚠️ Sellers — ONLY if Elite Placement is active
 * 
 * NEVER shown on map:
 * ❌ Buyers (even if verified)
 * 
 * RATIONALE:
 * - Map = professional discovery surface, not general browsing
 * - Companies & Contractors pay for default visibility
 * - Sellers must opt-in via Elite Placement
 * - Buyers do not promote services or inventory → no map presence
 */

// Entity types for map visibility
export type MapEntityType = 'contractor' | 'company' | 'seller' | 'buyer';

// Map visibility result
export interface MapVisibilityResult {
  /** Whether the entity is visible on the map */
  visible: boolean;
  /** Reason for visibility/invisibility */
  reason: string;
  /** Tier for marker styling (if visible) */
  tier?: 'professional' | 'elite';
}

// Contractor/Company visibility check
interface ContractorMapEntity {
  entityType: 'contractor' | 'company';
  verificationStatus: string;
  contractorTier?: string;
  visibilityTier?: string;
  isActive?: boolean;
  isPublished?: boolean;
}

// Seller visibility check
interface SellerMapEntity {
  entityType: 'seller';
  isVerifiedSeller?: boolean;
  premiumAddOns?: {
    elite?: { active: boolean };
  };
}

// Buyer (never visible)
interface BuyerMapEntity {
  entityType: 'buyer';
}

export type MapEntity = ContractorMapEntity | SellerMapEntity | BuyerMapEntity;

/**
 * Check if an entity is eligible for map visibility.
 * 
 * LOCKED RULES:
 * - Contractors/Companies: Must be verified + active
 * - Sellers: ONLY with Elite Placement active
 * - Buyers: NEVER
 */
export function checkMapVisibility(entity: MapEntity): MapVisibilityResult {
  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 1: Buyers are NEVER shown on map
  // ═══════════════════════════════════════════════════════════════════════════
  if (entity.entityType === 'buyer') {
    return {
      visible: false,
      reason: 'Buyers are not shown on the map. Map is for professional discovery only.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 2: Sellers ONLY with Elite Placement
  // ═══════════════════════════════════════════════════════════════════════════
  if (entity.entityType === 'seller') {
    const hasElite = entity.premiumAddOns?.elite?.active === true;
    
    if (!hasElite) {
      return {
        visible: false,
        reason: 'Map visibility is available with Elite Placement. Sellers without Elite are not shown.',
      };
    }

    // Elite sellers ARE visible
    return {
      visible: true,
      reason: 'Elite Placement active — seller is visible on map.',
      tier: 'elite',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 3: Contractors/Companies — Professional Plan visibility
  // ═══════════════════════════════════════════════════════════════════════════
  if (entity.entityType === 'contractor' || entity.entityType === 'company') {
    // Must be verified
    if (entity.verificationStatus !== 'verified') {
      return {
        visible: false,
        reason: 'Contractor/Company must be verified to appear on map.',
      };
    }

    // Must be active and published
    if (entity.isActive === false || entity.isPublished === false) {
      return {
        visible: false,
        reason: 'Contractor/Company profile is not active or published.',
      };
    }

    // Must have a paid visibility tier (part of Professional Plan)
    const validTiers = ['verified', 'featured', 'priority', 'professional'];
    const hasPaidTier = entity.visibilityTier && validTiers.includes(entity.visibilityTier);
    
    if (!hasPaidTier) {
      return {
        visible: false,
        reason: 'Map visibility requires Professional Marketplace Access ($2,500/year).',
      };
    }

    // Professional contractors/companies ARE visible
    return {
      visible: true,
      reason: 'Professional Plan active — contractor/company is visible on map.',
      tier: 'professional',
    };
  }

  // Default: not visible
  return {
    visible: false,
    reason: 'Unknown entity type.',
  };
}

/**
 * Filter an array of contractors for map visibility.
 * Only returns contractors/companies eligible for map display.
 */
export function filterContractorsForMap<T extends {
  verificationStatus: string;
  visibilityTier?: string;
  isActive?: boolean;
  isPublished?: boolean;
}>(contractors: T[]): T[] {
  return contractors.filter(contractor => {
    const result = checkMapVisibility({
      entityType: 'contractor',
      verificationStatus: contractor.verificationStatus,
      visibilityTier: contractor.visibilityTier,
      isActive: contractor.isActive,
      isPublished: contractor.isPublished,
    });
    return result.visible;
  });
}

/**
 * Filter an array of listings for map visibility.
 * Only returns listings with Elite Placement active.
 */
export function filterListingsForMap<T extends {
  premiumAddOns?: {
    elite?: { active: boolean };
  };
  sellerId?: {
    // Sellers only — buyers never sell
  };
}>(listings: T[]): T[] {
  return listings.filter(listing => {
    const result = checkMapVisibility({
      entityType: 'seller',
      premiumAddOns: listing.premiumAddOns,
    });
    return result.visible;
  });
}

/**
 * Disclosure text for sellers about map visibility.
 */
export const SELLER_MAP_DISCLOSURE = 'Map visibility is available with Elite Placement.';

/**
 * Full disclosure text for UI tooltips.
 */
export const MAP_VISIBILITY_DISCLOSURE = {
  seller: 'Your listing will appear on the map with Elite Placement ($99/30 days).',
  professional: 'Your business appears on the map as part of your Professional Plan.',
  buyer: 'Buyers do not appear on the map. The map is for professional service discovery.',
};
