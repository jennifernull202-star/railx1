/**
 * THE RAIL EXCHANGE™ — Entity Profile Component Types
 * 
 * Shared types for entity profile components.
 */

import { Entity, EntityType, EntityEntitlements } from '@/types/entity';

/**
 * Props for the main profile shell
 */
export interface EntityProfileShellProps {
  entity: Entity | null;
  isLoading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}

/**
 * Props for the entity header
 */
export interface EntityHeaderProps {
  entity: Entity | null;
  showBadges?: boolean;
}

/**
 * Props for verification badge
 */
export interface EntityVerificationBadgeProps {
  entity: Entity | null;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for visibility badge
 */
export interface EntityVisibilityBadgeProps {
  entity: Entity | null;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for listings block (sellers)
 */
export interface ListingsBlockProps {
  entity: Entity | null;
  maxItems?: number;
  showEmptyState?: boolean;
}

/**
 * Props for services block (contractors)
 */
export interface ServicesBlockProps {
  entity: Entity | null;
  maxItems?: number;
}

/**
 * Props for company overview block
 */
export interface CompanyOverviewBlockProps {
  entity: Entity | null;
}

/**
 * Props for contact block
 */
export interface ContactBlockProps {
  entity: Entity | null;
  showInquiryButton?: boolean;
}

/**
 * Props for CTA upgrade block (owner-only view)
 */
export interface CTAUpgradeBlockProps {
  entity: Entity | null;
  isOwner?: boolean;
}

/**
 * Props for buyer requests block
 */
export interface BuyerRequestsBlockProps {
  entity: Entity | null;
  maxItems?: number;
}

/**
 * Props for capabilities block
 */
export interface CapabilitiesBlockProps {
  entity: Entity | null;
}

/**
 * Props for regions served block
 */
export interface RegionsServedBlockProps {
  entity: Entity | null;
}

/**
 * Props for certifications block
 */
export interface CertificationsBlockProps {
  entity: Entity | null;
}

/**
 * Props for media gallery block
 */
export interface MediaGalleryBlockProps {
  entity: Entity | null;
  maxItems?: number;
}

/**
 * Props for similar entities block
 */
export interface SimilarEntitiesBlockProps {
  entity: Entity | null;
}

/**
 * Block visibility configuration
 */
export interface BlockVisibilityConfig {
  showListings: boolean;
  showServices: boolean;
  showCompanyInfo: boolean;
  showContact: boolean;
  showUpgradeCTA: boolean;
  showBuyerRequests: boolean;
  showCapabilities: boolean;
  showRegionsServed: boolean;
  showCertifications: boolean;
  showMediaGallery: boolean;
  showSimilarEntities: boolean;
}

/**
 * Derive which blocks should be visible for an entity
 */
export function getBlockVisibility(
  entity: Entity | null,
  isOwner: boolean = false
): BlockVisibilityConfig {
  if (!entity) {
    return {
      showListings: false,
      showServices: false,
      showCompanyInfo: false,
      showContact: false,
      showUpgradeCTA: false,
      showBuyerRequests: false,
      showCapabilities: false,
      showRegionsServed: false,
      showCertifications: false,
      showMediaGallery: false,
      showSimilarEntities: false,
    };
  }

  const entitlements = entity.entitlements;
  const type = entity.type;

  return {
    showListings: type === 'seller' && entitlements.canDisplayListings,
    showServices: type === 'contractor' && entitlements.canDisplayServices,
    showCompanyInfo: type === 'company' && entitlements.canDisplayCompanyInfo,
    showContact: entitlements.canDisplayContact,
    showUpgradeCTA: isOwner && !entitlements.hasVisibilityBoost,
    // Additional blocks
    showBuyerRequests: true, // Always show (has empty state)
    showCapabilities: type === 'contractor', // Only for contractors, hides if empty
    showRegionsServed: true, // For all types, hides if no data
    showCertifications: type === 'contractor' || type === 'company', // For contractors and companies
    showMediaGallery: true, // For all types
    showSimilarEntities: true, // For all types (always placeholder)
  };
}
