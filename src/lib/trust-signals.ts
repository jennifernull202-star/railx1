/**
 * THE RAIL EXCHANGE™ — Trust Signal Copy Constants
 * 
 * S-2: TRUST SIGNAL CLARITY
 * 
 * Centralized copy for all trust signals, badges, and disclaimers.
 * Ensures consistent messaging across the platform.
 * 
 * ⛔ DO NOT modify badge names (Elite/Premium/Featured/Verified)
 * ✅ DO update clarifying copy as needed
 */

// ============================================
// S-2.1: VERIFIED BADGE DISCLAIMERS
// ============================================

export const VERIFIED_SELLER_TOOLTIP = 
  'Verified means business documents were submitted and reviewed. It does not guarantee ownership, condition, or transaction outcome.';

export const VERIFIED_CONTRACTOR_TOOLTIP = 
  'Verified means business documents were submitted and reviewed. It does not guarantee work quality, licensing, or project outcome.';

// Short version for compact UI
export const VERIFIED_BADGE_SHORT = 
  'Documents reviewed. Not a transaction guarantee.';

// ============================================
// S-2.2: PAID VISIBILITY BADGE TOOLTIPS
// ============================================

export const ELITE_BADGE_TOOLTIP = 
  'This is a paid visibility placement. It does not indicate seller quality or reliability.';

export const PREMIUM_BADGE_TOOLTIP = 
  'This is a paid visibility placement. It does not indicate seller quality or reliability.';

export const FEATURED_BADGE_TOOLTIP = 
  'This is a paid visibility placement. It does not indicate seller quality or reliability.';

// Generic for any paid placement
export const PAID_PLACEMENT_TOOLTIP = 
  'This is a paid visibility placement. It does not indicate seller quality or reliability.';

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
  'AI-assisted document review';

export const AI_ENHANCED_LABEL = 
  'AI-assisted listing enhancement';

export const AI_ANALYSIS_DISCLAIMER = 
  'AI assistance is used for document processing and does not verify authenticity.';

// ============================================
// S-2.6: TRUST SECTION COPY
// ============================================

export const PLATFORM_TRUST_STATEMENT = 
  'Built for rail professionals. Transactions occur directly between parties.';

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

export const TRUST_BADGE_CONFIG = {
  elite: {
    label: 'Elite',
    tooltip: ELITE_BADGE_TOOLTIP,
    isPaid: true,
  },
  premium: {
    label: 'Premium',
    tooltip: PREMIUM_BADGE_TOOLTIP,
    isPaid: true,
  },
  featured: {
    label: 'Featured',
    tooltip: FEATURED_BADGE_TOOLTIP,
    isPaid: true,
  },
  verified: {
    label: 'Verified',
    tooltip: VERIFIED_SELLER_TOOLTIP,
    isPaid: false,
  },
  verifiedContractor: {
    label: 'Verified',
    tooltip: VERIFIED_CONTRACTOR_TOOLTIP,
    isPaid: false,
  },
} as const;
