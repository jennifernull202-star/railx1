/**
 * THE RAIL EXCHANGE™ — Contractor Profile Page
 * ============================================
 * BATCH 11 REQUIREMENTS:
 * - Cover height ~160px max ✓
 * - Above-the-fold: Logo, Company name, Credibility line, Top 3 services, ONE Contact CTA ✓
 * - Single contact location (sticky footer only)
 * - Merged regions + company details in expandable card
 * - Photos and equipment below primary info ✓
 * - OMIT: Profile completeness %, duplicate CTAs, separate regions card
 * 
 * Displays a contractor's full profile with services, contact info, and photos.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { CONTRACTOR_TYPE_CONFIG, type ContractorType } from '@/config/contractor-types';
import ContractorTypeDisplay from '@/components/contractor/ContractorTypeDisplay';
import PhoneDisplay from '@/components/contractor/PhoneDisplay';
import { CONTRACTOR_DISPLAY_LIMITS, BADGE_TOOLTIP } from '@/lib/abuse-prevention';

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
        {/* COMPACT HEADER - MAX 160px */}
        <div className="bg-white border-b border-surface-border">
          <div className="container-rail py-4">
            <div className="flex items-center gap-4" style={{ maxHeight: '160px' }}>
              {/* Logo */}
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden">
                {contractor.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getImageUrl(contractor.logo)}
                    alt={contractor.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-text-tertiary">
                    {contractor.businessName.charAt(0)}
                  </span>
                )}
              </div>

              {/* Name + Meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-navy-900 truncate">
                  {contractor.businessName}
                </h1>
                
                {/* X Years • Verified • Region */}
                <p className="text-sm text-text-secondary mt-1">
                  <span className="group relative inline">
                    {contractor.yearsInBusiness} years
                    {/* BATCH E-3: Years in Business Tooltip */}
                    <span className="invisible group-hover:visible absolute bottom-full left-0 mb-1 px-2 py-1 bg-navy-900 text-white text-xs rounded whitespace-nowrap z-10">
                      Self-reported by contractor
                    </span>
                  </span>
                  {contractor.verificationStatus === 'verified' && (
                    <span className="text-green-600"> • Verified</span>
                  )}
                  {primaryRegion && <span> • {primaryRegion}</span>}
                </p>
                {/* BATCH E-4: Self-reported Disclosure (visible without scrolling) */}
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  Certain business details are self-reported by contractors and have not been independently verified.
                </p>

                {/* Top 3 Services (text only) - BATCH E-3: Overclaim visibility control */}
                <p className="text-sm text-text-tertiary mt-1 truncate">
                  {top3Services.join(' • ')}
                  {displayLabels.length > 3 && (
                    <span className="text-text-tertiary"> +{displayLabels.length - 3} more</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container-rail py-6">
          {/* About */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
            <h2 className="font-semibold text-navy-900 mb-3">About</h2>
            <p className="text-text-primary whitespace-pre-wrap">{contractor.businessDescription}</p>
            {contractor.serviceDescription && (
              <div className="mt-4 pt-4 border-t border-surface-border">
                <h3 className="font-medium text-navy-900 mb-2">Service Details</h3>
                <p className="text-text-secondary">{contractor.serviceDescription}</p>
              </div>
            )}
          </div>

          {/* Company Details (expandable - merges contact + regions) */}
          <details className="bg-white rounded-2xl shadow-card border border-surface-border mb-6 group">
            <summary className="p-6 flex items-center justify-between cursor-pointer list-none">
              <h2 className="font-semibold text-navy-900">Company Details</h2>
              <svg className="w-5 h-5 text-text-tertiary transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6 -mt-2">
              {/* Contact Info */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {/* S-3.2: Phone visibility with auth check */}
                <PhoneDisplay phone={contractor.businessPhone} />
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-navy-900">{contractor.address.city}, {contractor.address.state}</span>
                </div>
                {contractor.website && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="text-rail-orange break-all">
                      {contractor.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Regions Served */}
              {contractor.regionsServed && contractor.regionsServed.length > 0 && (
                <div className="pt-4 border-t border-surface-border">
                  <h3 className="font-medium text-navy-900 mb-2 text-sm">Regions Served</h3>
                  <div className="flex flex-wrap gap-2">
                    {contractor.regionsServed.slice(0, CONTRACTOR_DISPLAY_LIMITS.MAX_REGIONS_DISPLAYED).map((region: string) => (
                      <span key={region} className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900">
                        {region}
                      </span>
                    ))}
                    {contractor.regionsServed.length > CONTRACTOR_DISPLAY_LIMITS.MAX_REGIONS_DISPLAYED && (
                      <span className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-text-tertiary">
                        +{contractor.regionsServed.length - CONTRACTOR_DISPLAY_LIMITS.MAX_REGIONS_DISPLAYED} more regions
                      </span>
                    )}
                  </div>
                  {/* S-1.5: Self-reported claims disclaimer */}
                  <p className="text-xs text-text-tertiary mt-2 italic">
                    Service areas and capabilities are self-reported by the contractor.
                  </p>
                </div>
              )}
            </div>
          </details>

          {/* Services/Specializations */}
          {hasContractorTypes && (
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
              <h2 className="font-semibold text-navy-900 mb-4">Specializations</h2>
              <ContractorTypeDisplay
                contractorTypes={contractor.contractorTypes}
                subServices={contractor.subServices}
                otherTypeInfo={contractor.otherTypeInfo}
                variant="full"
              />
            </div>
          )}

          {!hasContractorTypes && contractor.services && contractor.services.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
              <h2 className="font-semibold text-navy-900 mb-4">Services</h2>
              <div className="flex flex-wrap gap-2">
                {contractor.services.map((serviceId: string) => {
                  const service = SERVICE_CATEGORIES.find((s) => s.id === serviceId);
                  return (
                    <span key={serviceId} className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900">
                      {service?.label || serviceId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Equipment */}
          {contractor.equipmentOwned && contractor.equipmentOwned.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
              <h2 className="font-semibold text-navy-900 mb-4">Equipment</h2>
              <div className="flex flex-wrap gap-2">
                {contractor.equipmentOwned.map((item: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos (MOVED BELOW PRIMARY INFO) */}
          {contractor.photos && contractor.photos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
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
      </main>

      {/* STICKY CONTACT CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border p-4 z-40">
        <div className="container-rail">
          <a
            href={`mailto:${contractor.businessEmail}`}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact {contractor.businessName}
          </a>
        </div>
      </div>
    </>
  );
}
