/**
 * THE RAIL EXCHANGE™ — Unified Profile Shell
 * 
 * The main container for unified entity profiles.
 * ALL entity types render through this single component.
 * Sections render based on data presence only.
 * 
 * NO auth. NO enforcement. NO redirects. Safe fail.
 */

'use client';

import { ProfileHeader } from './ProfileHeader';
import { ProfileVisibilityStrip } from './ProfileVisibilityStrip';
import { ProfileVerificationBlock } from './ProfileVerificationBlock';
import {
  AboutSection,
  ListingsSection,
  ServicesSection,
  BuyerRequestsSection,
  CapabilitiesSection,
  RegionsServedSection,
  CertificationsSection,
  MediaGallerySection,
  ContactSection,
  SimilarEntitiesSection,
} from './sections';
import type { UnifiedProfileShellProps } from './types';

export function UnifiedProfileShell({
  profile,
  isLoading = false,
  error = null,
  children,
}: UnifiedProfileShellProps) {
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

  // No profile state (safe fail)
  if (!profile) {
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

  // Determine entity type for conditional rendering
  const isSeller = profile.type === 'seller';
  const isContractor = profile.type === 'contractor';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Visibility Strip (shows if featured/priority) */}
      <div className="mb-4">
        <ProfileVisibilityStrip
          visibility={profile.visibility}
          entityName={profile.displayName || profile.name}
        />
      </div>

      {/* Profile Header - Always shown */}
      <ProfileHeader profile={profile} />

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* About Section */}
          <AboutSection
            description={profile.description}
            tagline={profile.tagline}
            memberSince={profile.memberSince}
          />

          {/* Listings Section (Sellers) */}
          {isSeller && (
            <ListingsSection listings={profile.listings} />
          )}

          {/* Services Section (Contractors) */}
          {isContractor && (
            <ServicesSection services={profile.services} />
          )}

          {/* Buyer Requests Section (MANDATORY - all types) */}
          <BuyerRequestsSection requests={profile.buyerRequests} />

          {/* Media Gallery Section */}
          <MediaGallerySection media={profile.mediaGallery} />

          {/* Custom children content */}
          {children}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Verification Block (with renewal date + post-verification CTA) */}
          <ProfileVerificationBlock
            verification={profile.verification}
            entityName={profile.displayName || profile.name}
          />

          {/* Contact Section */}
          <ContactSection
            contact={profile.contact}
            canDisplayContact={profile.entitlements?.canDisplayContact}
          />

          {/* Regions Served */}
          <RegionsServedSection
            regions={profile.regionsServed || profile.location?.serviceArea}
            location={profile.location}
          />

          {/* Capabilities (Contractors) */}
          {isContractor && (
            <CapabilitiesSection capabilities={profile.capabilities} />
          )}

          {/* Certifications */}
          <CertificationsSection
            certifications={profile.verification?.certificationBadges}
          />

          {/* Similar Entities */}
          <SimilarEntitiesSection
            entityType={profile.type}
            entityId={profile.id}
          />
        </div>
      </div>
    </div>
  );
}

export default UnifiedProfileShell;
