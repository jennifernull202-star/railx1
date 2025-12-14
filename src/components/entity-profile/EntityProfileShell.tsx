/**
 * THE RAIL EXCHANGE™ — Entity Profile Shell
 * 
 * The main container component that renders entity profiles.
 * ALL entity types render through this single component.
 * Differences are driven by entity.type and entity.entitlements.
 * 
 * NO auth. NO enforcement. NO redirects. Safe fail.
 */

'use client';

// Entity types imported implicitly via block components
import { EntityHeader } from './EntityHeader';
import { ListingsBlock } from './blocks/ListingsBlock';
import { ServicesBlock } from './blocks/ServicesBlock';
import { CompanyOverviewBlock } from './blocks/CompanyOverviewBlock';
import { ContactBlock } from './blocks/ContactBlock';
import { CTAUpgradeBlock } from './blocks/CTAUpgradeBlock';
import { BuyerRequestsBlock } from './blocks/BuyerRequestsBlock';
import { CapabilitiesBlock } from './blocks/CapabilitiesBlock';
import { RegionsServedBlock } from './blocks/RegionsServedBlock';
import { CertificationsBlock } from './blocks/CertificationsBlock';
import { MediaGalleryBlock } from './blocks/MediaGalleryBlock';
import { SimilarEntitiesBlock } from './blocks/SimilarEntitiesBlock';
import { EntityProfileShellProps, getBlockVisibility } from './types';

export function EntityProfileShell({ 
  entity, 
  isLoading = false,
  error = null,
  children 
}: EntityProfileShellProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Banner skeleton */}
          <div className="bg-gray-200 rounded-2xl h-48 mb-8" />
          {/* Content skeleton */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-gray-200 rounded-xl h-32" />
              <div className="bg-gray-200 rounded-xl h-48" />
            </div>
            <div className="space-y-6">
              <div className="bg-gray-200 rounded-xl h-32" />
              <div className="bg-gray-200 rounded-xl h-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Unable to load profile
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // No entity state (safe fail - still render something)
  if (!entity) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-500">
            This profile may have been removed or is not publicly available.
          </p>
        </div>
      </div>
    );
  }

  // Derive block visibility based on entity type and entitlements
  // isOwner is false for public profiles (no auth check here)
  const blockVisibility = getBlockVisibility(entity, false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Entity Header - Always shown */}
      <EntityHeader entity={entity} showBadges={true} />

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {entity.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{entity.description}</p>
            </div>
          )}

          {/* Type-specific blocks - conditionally rendered */}
          {blockVisibility.showListings && (
            <ListingsBlock entity={entity} showEmptyState={true} />
          )}

          {blockVisibility.showServices && (
            <ServicesBlock entity={entity} />
          )}

          {blockVisibility.showCompanyInfo && (
            <CompanyOverviewBlock entity={entity} />
          )}

          {/* Buyer Requests Block - for all types */}
          {blockVisibility.showBuyerRequests && (
            <BuyerRequestsBlock entity={entity} />
          )}

          {/* Media Gallery Block - for all types */}
          {blockVisibility.showMediaGallery && (
            <MediaGalleryBlock entity={entity} />
          )}

          {/* Custom children content */}
          {children}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Contact Block */}
          {blockVisibility.showContact && (
            <ContactBlock entity={entity} showInquiryButton={true} />
          )}

          {/* Regions Served Block */}
          {blockVisibility.showRegionsServed && (
            <RegionsServedBlock entity={entity} />
          )}

          {/* Capabilities Block - contractors only */}
          {blockVisibility.showCapabilities && (
            <CapabilitiesBlock entity={entity} />
          )}

          {/* Certifications Block - contractors and companies */}
          {blockVisibility.showCertifications && (
            <CertificationsBlock entity={entity} />
          )}

          {/* Similar Entities Block */}
          {blockVisibility.showSimilarEntities && (
            <SimilarEntitiesBlock entity={entity} />
          )}

          {/* Upgrade CTA (only for owners viewing their own profile) */}
          {blockVisibility.showUpgradeCTA && (
            <CTAUpgradeBlock entity={entity} isOwner={true} />
          )}
        </div>
      </div>
    </div>
  );
}

export default EntityProfileShell;
