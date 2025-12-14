/**
 * THE RAIL EXCHANGE™ — Contractor Profile Page
 * ============================================
 * PUBLIC PROFILE PAGES REQUIREMENTS:
 * 
 * REQUIRED FACT SECTIONS:
 * 1. Contractor Type (Multi-Select) - Clickable chips → filtered search
 * 2. Services Offered - Structured list, clickable, search-filterable
 * 3. Service Locations - States/regions, capped with "+X more"
 * 4. Availability - Optional (24/7, Emergency, Scheduled Only)
 * 5. Credentials & Certifications - Self-reported, mandatory disclaimer
 * 
 * COMPLIANCE:
 * - All regulatory claims labeled "Self-reported"
 * - Neutral styling (NO green checks)
 * - Mandatory disclaimers for certifications
 * - AI verification disclosure
 * 
 * NO: Analytics, SEO tools, contractor taxonomy, regulatory claims without disclaimers
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { CONTRACTOR_TYPE_CONFIG, type ContractorType } from '@/config/contractor-types';
import PhoneDisplay from '@/components/contractor/PhoneDisplay';
import ContractorContactCTA from '@/components/contractor/ContractorContactCTA';
import {
  ContractorTypeChips,
  ServicesOffered,
  ServiceLocations,
  Credentials,
  VerificationBlock,
} from '@/components/contractor/ContractorFactBlocks';
import ContractorOutboundLinks from '@/components/contractor/ContractorOutboundLinks';
import { CONTRACTOR_DISPLAY_LIMITS } from '@/lib/abuse-prevention';
import { PageViewTracker } from '@/lib/hooks/useAnalyticsEvent';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    await connectDB();
    const { id } = await params;
    const contractor = await ContractorProfile.findById(id);

    if (!contractor) {
      return { title: 'Contractor Not Found | The Rail Exchange' };
    }

    return {
      title: `${contractor.businessName} | Rail Contractor | The Rail Exchange`,
      description: contractor.businessDescription.substring(0, 160),
    };
  } catch {
    return { title: 'Contractor | The Rail Exchange' };
  }
}

export default async function ContractorProfilePage({ params }: PageProps) {
  try {
    await connectDB();

    const { id } = await params;
    const contractor = await ContractorProfile.findById(id).populate('userId', 'name image');

    if (!contractor || !contractor.isActive) {
      notFound();
    }

    // Check if contractor has new contractor types
    const hasContractorTypes = contractor.contractorTypes && contractor.contractorTypes.length > 0;
  
  // Get type labels for display (use new types if available, fallback to legacy)
  const typeLabels = hasContractorTypes
    ? contractor.contractorTypes.map((typeId: string) => {
        const config = CONTRACTOR_TYPE_CONFIG[typeId as ContractorType];
        return config?.label || typeId;
      })
    : [];

  // Get service labels (legacy support)
  const serviceLabels = contractor.services.map((serviceId: string) => {
    const service = SERVICE_CATEGORIES.find((s) => s.id === serviceId);
    return service?.label || serviceId;
  });

  // Display labels - prefer new types, fallback to legacy services (TOP 3 ONLY)
  const displayLabels = hasContractorTypes ? typeLabels : serviceLabels;
  const top3Services = displayLabels.slice(0, 3);
  
  // Primary region
  const primaryRegion = contractor.regionsServed?.[0] || contractor.address?.state || '';

  return (
    <>
      {/* Analytics: Track page views for contractor profiles */}
      <PageViewTracker targetType="contractor" targetId={contractor._id.toString()} />
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
              <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
              <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
            </Link>
            <Link href="/contractors" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
              ← All Contractors
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary pb-32">
        {/* HERO / IDENTITY BLOCK - OPUS COMPLIANT */}
        <div className="bg-white border-b border-surface-border">
          <div className="container-rail py-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden">
                {contractor.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getImageUrl(contractor.logo)}
                    alt={contractor.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-text-tertiary">
                    {contractor.businessName.charAt(0)}
                  </span>
                )}
              </div>

              {/* Name + Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl md:text-2xl font-bold text-navy-900">
                    {contractor.businessName}
                  </h1>
                  
                  {/* Entity Type Label */}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                    Contractor
                  </span>
                  
                  {/* Verification Badge */}
                  {contractor.verificationStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                      ID Verified
                    </span>
                  )}
                  
                  {/* Professional Verified Badge (if applicable) */}
                  {contractor.verifiedBadgePurchased && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                      Professional Verified
                    </span>
                  )}
                </div>
                
                {/* Years + Region */}
                <p className="text-sm text-text-secondary mt-1">
                  <span className="group relative inline">
                    {contractor.yearsInBusiness} years
                    <span className="text-text-tertiary"> (Self-reported)</span>
                  </span>
                  {primaryRegion && <span> • {primaryRegion}</span>}
                </p>

                {/* Top 3 Services (text only) */}
                <p className="text-sm text-text-tertiary mt-1 truncate">
                  {top3Services.join(' • ')}
                  {displayLabels.length > 3 && (
                    <span className="text-text-tertiary"> +{displayLabels.length - 3} more</span>
                  )}
                </p>
                
                {/* Primary CTA Buttons + Outbound Links */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <ContractorOutboundLinks
                    contractorId={contractor._id.toString()}
                    website={contractor.website}
                    linkedIn={contractor.socialLinks?.linkedin}
                    email={contractor.businessEmail}
                  />
                </div>
              </div>
            </div>
            
            {/* MANDATORY DISCLOSURE - Always visible */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600">
                Verification reflects document submission and review only. It does not guarantee 
                performance, authority, compliance, or transaction outcomes.
              </p>
            </div>
          </div>
        </div>

        <div className="container-rail py-6">
          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <h2 className="font-semibold text-navy-900 mb-3">About</h2>
                <p className="text-text-primary whitespace-pre-wrap">{contractor.businessDescription}</p>
                {contractor.serviceDescription && (
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <h3 className="font-medium text-navy-900 mb-2">Service Details</h3>
                    <p className="text-text-secondary">{contractor.serviceDescription}</p>
                  </div>
                )}
              </div>

              {/* FACT BLOCK: Contractor Type (Clickable chips) */}
              {hasContractorTypes && (
                <ContractorTypeChips contractorTypes={contractor.contractorTypes} />
              )}

              {/* FACT BLOCK: Services Offered (Clickable list) */}
              {hasContractorTypes && contractor.subServices && (
                <ServicesOffered
                  contractorTypes={contractor.contractorTypes}
                  subServices={contractor.subServices}
                />
              )}

              {/* Legacy Services (if no new contractor types) */}
              {!hasContractorTypes && contractor.services && contractor.services.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                  <h2 className="font-semibold text-navy-900 mb-4">Services</h2>
                  <div className="flex flex-wrap gap-2">
                    {contractor.services.map((serviceId: string) => {
                      const service = SERVICE_CATEGORIES.find((s) => s.id === serviceId);
                      return (
                        <Link
                          key={serviceId}
                          href={`/contractors?service=${encodeURIComponent(serviceId)}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          {service?.label || serviceId}
                        </Link>
                      );
                    })}
                  </div>
                  <p className="text-xs text-text-tertiary mt-3">(Self-reported)</p>
                </div>
              )}

              {/* Equipment */}
              {contractor.equipmentOwned && contractor.equipmentOwned.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                  <h2 className="font-semibold text-navy-900 mb-4">Equipment</h2>
                  <div className="flex flex-wrap gap-2">
                    {contractor.equipmentOwned.map((item: string, index: number) => (
                      <span key={index} className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900">
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary mt-3">(Self-reported)</p>
                </div>
              )}

              {/* Photos */}
              {contractor.photos && contractor.photos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                  <h2 className="font-semibold text-navy-900 mb-4">Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {contractor.photos.map((photo: string, index: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={index}
                        src={photo}
                        alt={`${contractor.businessName} photo ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* FACT BLOCK: Verification Status */}
              <VerificationBlock
                verificationStatus={contractor.verificationStatus}
                verifiedBadgeExpiresAt={contractor.verifiedBadgeExpiresAt}
              />

              {/* Company Details */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <h2 className="font-semibold text-navy-900 mb-4">Company Details</h2>
                <div className="space-y-3">
                  <PhoneDisplay phone={contractor.businessPhone} />
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-navy-900">{contractor.address.city}, {contractor.address.state}</span>
                  </div>
                  {contractor.website && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="text-rail-orange break-all hover:underline">
                        {contractor.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-text-tertiary mt-2">
                    {contractor.yearsInBusiness} years in business (Self-reported)
                  </p>
                </div>
              </div>

              {/* FACT BLOCK: Service Locations */}
              <ServiceLocations
                regions={contractor.regionsServed || []}
                maxDisplay={CONTRACTOR_DISPLAY_LIMITS.MAX_REGIONS_DISPLAYED}
              />

              {/* Availability Status (if available) - uses model's status field */}
              {contractor.availability && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="font-semibold text-navy-900">Availability</h2>
                    <span className="text-xs text-text-tertiary">(Self-reported)</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                    contractor.availability.status === 'available' 
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : contractor.availability.status === 'limited'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      contractor.availability.status === 'available' 
                        ? 'bg-green-500'
                        : contractor.availability.status === 'limited'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`} />
                    {contractor.availability.status === 'available' && 'Available'}
                    {contractor.availability.status === 'limited' && 'Limited Availability'}
                    {contractor.availability.status === 'booked' && 'Currently Booked'}
                  </div>
                  
                  {contractor.availability.notes && (
                    <p className="text-sm text-text-secondary mt-3">{contractor.availability.notes}</p>
                  )}
                </div>
              )}

              {/* FACT BLOCK: Credentials & Certifications */}
              <Credentials certifications={contractor.certifications} />
            </div>
          </div>

          {/* Report Contractor Link */}
          <div className="text-center mt-8 mb-6">
            <Link
              href={`/contact?category=contractor&subject=${encodeURIComponent(`Report: ${contractor.businessName}`)}`}
              className="text-sm text-text-tertiary hover:text-text-secondary underline"
            >
              Report this contractor
            </Link>
            <p className="text-xs text-text-tertiary mt-1">
              Reports are for fraud, misrepresentation, or policy violations — not disputes or pricing disagreements.
            </p>
          </div>

          {/* Platform Disclaimer */}
          <p className="text-xs text-text-tertiary text-center mb-6">
            Business details are provided by the contractor. Verification confirms submitted documents, not service quality or outcomes.
            The Rail Exchange connects buyers and contractors. We do not participate in or guarantee transactions.
          </p>
        </div>
      </main>

      {/* S-4.8: STICKY CONTACT CTA - S-12.4: Enhanced with guest clarity */}
      <ContractorContactCTA
        businessName={contractor.businessName}
        businessEmail={contractor.businessEmail}
        yearsInBusiness={contractor.yearsInBusiness}
        regionsCount={contractor.regionsServed?.length || 0}
        isVerified={contractor.verificationStatus === 'verified'}
      />
    </>
  );
  } catch (error) {
    console.error('Contractor profile page error:', error);
    notFound();
  }
}
