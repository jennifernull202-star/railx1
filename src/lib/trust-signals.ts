/**
 * THE RAIL EXCHANGE™ — Trust Signal Copy Constants
 * 
 * S-2: TRUST SIGNAL CLARITY
 * 
 * Centralized copy for all trust signals, badges, and disclaimers.
 * Ensures consistent messaging across the platform.
 * 
 * FINAL EXECUTION COMMAND - LOCKED BADGES:
 * - Buyer: "Identity Confirmed" ($1 one-time)
 * - Verified Buyer Activity: FREE earned badge (gray/slate only)
 * - Seller: "Identity Verified" ($29/year)
 * - Contractor: "Business Verified" ($150/year)
 * - Company: Included in $2,500/year plan
 * - Elite Placement: "Sponsored" ($99/30 days) - ONLY visibility tier
 * 
 * ⛔ DO NOT modify badge names without legal review
 * ✅ DO update clarifying copy as needed
 */

// ============================================
// BUYER VERIFICATION BADGES
// ============================================

// $1 one-time - Identity Confirmed
export const BUYER_IDENTITY_BADGE = 'Identity Confirmed';

export const BUYER_IDENTITY_TOOLTIP = 
  'Identity confirmation verifies the account belongs to a real person. It does not imply purchasing authority or endorsement.';

// FREE earned badge - Verified Buyer Activity
export const VERIFIED_BUYER_ACTIVITY_BADGE = 'Verified Buyer (Activity)';

export const VERIFIED_BUYER_ACTIVITY_TOOLTIP = 
  'Verified Buyer (Activity) reflects completed marketplace transactions. It does not imply financial capability, purchasing authority, or endorsement.';

// ============================================
// S-2.1: VERIFIED BADGE DISCLAIMERS
// S-10.5: Verification Badge Scope Clarity
// S-13.1: Standardized Verified Badge Tooltip
// ============================================

// S-13.1: Standardized tooltip for all verified badge locations
export const VERIFIED_BADGE_TOOLTIP_TITLE = 'What verification means';

export const VERIFIED_SELLER_TOOLTIP = 
  'This indicates that business documents were submitted and reviewed. Verification does not guarantee ownership, item condition, service quality, or transaction outcomes.';

export const VERIFIED_CONTRACTOR_TOOLTIP = 
  'This indicates that business documents were submitted and reviewed. Verification does not guarantee ownership, item condition, service quality, or transaction outcomes.';

// Short version for compact UI
export const VERIFIED_BADGE_SHORT = 
  'Documents reviewed. Not a transaction guarantee.';

// S-13.5: Canonical verification disclaimer for all verification-related pages
export const VERIFICATION_DISCLAIMER_CANONICAL = 
  'Verification reflects document submission and review only. The Rail Exchange does not guarantee transactions, payments, item condition, or outcomes.';

// ============================================
// S-2.2: PAID VISIBILITY BADGE TOOLTIPS
// S-11.6: Badge Hover Performance Disclaimer
// S-13.3: Paid Placement Honest Framing
// ============================================

// S-13.3: Inline label for paid badges - ELITE ONLY
export const PAID_PLACEMENT_LABEL = 'Sponsored';

export const ELITE_BADGE_TOOLTIP = 
  'This listing is promoted for visibility. Paid placement does not indicate seller quality, endorsement, or transaction guarantee.';

// Legacy tooltips - map to Elite
export const PREMIUM_BADGE_TOOLTIP = ELITE_BADGE_TOOLTIP;
export const FEATURED_BADGE_TOOLTIP = ELITE_BADGE_TOOLTIP;

// Generic for any paid placement
export const PAID_PLACEMENT_TOOLTIP = 
  'This listing is promoted for visibility. Paid placement does not indicate seller quality, endorsement, or transaction guarantee.';

// ============================================
// S-2.3: CONTRACTOR CLAIMS DISCLAIMER
// ============================================

export const CONTRACTOR_CLAIMS_DISCLAIMER = 
  'Service areas and experience are self-reported and reviewed through submitted documentation.';

// For regions/services display
export const CONTRACTOR_REGIONS_DISCLAIMER = 
  'Service regions are self-reported by the contractor.';

// ============================================
// S-2.4: DOCUMENTATION & CONDITION DISCLAIMERS
// ============================================

export const CONDITION_DISCLAIMER = 
  'Condition is provided by the seller unless accompanied by inspection documentation.';

export const SELLER_DOCUMENTS_LABEL = 
  'Seller-provided documents';

export const CONDITION_WITH_DOCS_DISCLAIMER = 
  'Documentation is provided by the seller. Verify independently before purchase.';

// ============================================
// S-2.5: AI LANGUAGE (NEUTRAL PHRASING)
// ============================================

// Use these instead of "AI-Verified" or "AI Fraud Check"
export const AI_DOCUMENT_REVIEW_LABEL = 
  'Document review assisted by automated analysis and human review.';

export const AI_ENHANCED_LABEL = 
  'Listing enhanced with automated optimization';

export const AI_ANALYSIS_DISCLAIMER = 
  'Automated analysis assists with document processing. It does not verify authenticity or guarantee accuracy.';

// ============================================
// S-5.5: TRUST SECTION COPY - Neutral platform statement
// ============================================

export const PLATFORM_TRUST_STATEMENT = 
  'The Rail Exchange is a listing platform connecting buyers and sellers. Transactions occur directly between parties.';

export const PLATFORM_ROLE_STATEMENT = 
  'The Rail Exchange connects buyers and sellers. We do not participate in or guarantee transactions.';

// ============================================
// S-2.7: CONTACT FLOW DISCLAIMERS
// ============================================

export const CONTACT_FORM_DISCLAIMER = 
  'The Rail Exchange does not participate in transactions or payments. Contacting a seller initiates direct communication only.';

export const INQUIRY_DISCLAIMER = 
  'Inquiries are sent directly to the seller. The Rail Exchange does not process payments.';

export const TRANSACTION_DISCLAIMER = 
  'All transactions occur directly between buyer and seller. The Rail Exchange is not a party to any purchase.';

// ============================================
// BADGE STYLE CONFIGURATION (S-2.1, S-2.2)
// ============================================

// S-5.1: Badge labels updated - Elite ONLY for paid visibility
export const TRUST_BADGE_CONFIG = {
  // ELITE is the ONLY paid visibility tier
  elite: {
    label: 'Sponsored',
    tooltip: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  // Legacy mappings - all map to Sponsored
  premium: {
    label: 'Sponsored',
    tooltip: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  featured: {
    label: 'Sponsored',
    tooltip: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  // Identity verification badges
  verified: {
    label: 'Identity Verified',
    tooltip: VERIFIED_SELLER_TOOLTIP,
    isPaid: false,
  },
  verifiedContractor: {
    label: 'Business Verified',
    tooltip: VERIFIED_CONTRACTOR_TOOLTIP,
    isPaid: false,
  },
  // Buyer badges
  buyerIdentity: {
    label: 'Identity Confirmed',
    tooltip: BUYER_IDENTITY_TOOLTIP,
    isPaid: true, // $1 one-time
  },
  buyerActivity: {
    label: 'Verified Buyer (Activity)',
    tooltip: VERIFIED_BUYER_ACTIVITY_TOOLTIP,
    isPaid: false, // FREE earned badge
    styling: {
      colors: 'neutral', // gray/slate only
      noGreen: true,
      noShields: true,
      noCheckmarks: true,
    },
  },
} as const;
