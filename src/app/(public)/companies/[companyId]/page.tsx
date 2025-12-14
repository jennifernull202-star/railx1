/**
 * THE RAIL EXCHANGE™ — Public Company Profile Page
 * 
 * OPUS EXECUTION: Profile Pages (Company Facts)
 * 
 * Purpose: Product/supplier visibility (Companies sell products, not services).
 * 
 * REQUIRED SECTIONS:
 * 1. Hero / Identity Block with badges
 * 2. Fast-Scan Fact Blocks (chips, not paragraphs)
 * 3. Capabilities / Description
 * 4. Product Categories
 * 5. Markets Served
 * 6. Distribution Regions
 * 
 * COMPLIANCE:
 * - All facts marked "Self-reported" where applicable
 * - Verification badge scoped correctly
 * - Sponsored labels present if Elite
 * - Mandatory AI disclosure
 * - No endorsement language
 * 
 * NO auth. NO enforcement. Safe fail.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, Mail } from 'lucide-react';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { PageViewTracker } from '@/lib/hooks/useAnalyticsEvent';
import {
  CompanyTypeChips,
  ProductCategories,
  MarketsServed,
  DistributionRegions,
  CompanyDetails,
  CompanyVerificationBlock,
  ContactLinks,
  SelfReportedDisclaimer,
} from '@/components/company/CompanyFactBlocks';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

// Company type (from User model with isContractor flag for company distinction)
interface CompanyUser {
  _id: string;
  name: string;
  displayName?: string;
  tagline?: string;
  bio?: string;
  image?: string;
  bannerImage?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  publicEmail?: string;
  publicPhone?: string;
  website?: string;
  linkedIn?: string;
  isActive: boolean;
  isVerifiedSeller?: boolean;
  sellerVerificationStatus?: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked';
  contractorVerificationStatus?: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked';
  contractorTier?: string;
  createdAt?: Date;
  // OPUS: Company-specific fields
  companyInfo?: {
    companyType?: string; // manufacturer, supplier, distributor, oem
    productCategories?: string[];
    brandsRepresented?: string[];
    marketsServed?: string[]; // freight-rail, short-line, industrial, transit
    distributionRegions?: string[];
    yearFounded?: number;
    employeeCount?: string;
    description?: string;
  };
  // Sponsored placement (Elite)
  sponsoredPlacementActive?: boolean;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { companyId } = await params;
  
  try {
    await connectDB();
    const user = await User.findById(companyId)
      .select('name displayName bio')
      .lean() as CompanyUser | null;
    
    if (user && user.name) {
      const displayName = user.displayName || user.name;
      return {
        title: `${displayName} | Company Profile | The Rail Exchange`,
        description: user.bio || `View ${displayName}'s company profile on The Rail Exchange.`,
      };
    }
  } catch {
    // Fail silently
  }
  
  return {
    title: 'Company Profile | The Rail Exchange',
    description: 'View company profile on The Rail Exchange.',
  };
}

// Format date for display
function formatMemberSince(date?: Date): string {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(date));
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { companyId } = await params;

  // Validate ID format (MongoDB ObjectId)
  if (!companyId || !/^[0-9a-fA-F]{24}$/.test(companyId)) {
    return (
      <main className="min-h-screen bg-surface-secondary">
        <div className="container-rail py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Invalid Profile</h2>
            <p className="text-gray-500">This company profile link is not valid.</p>
          </div>
        </div>
      </main>
    );
  }

  let company: CompanyUser | null = null;
  let error: string | null = null;

  try {
    await connectDB();
    
    // Fetch company data (companies are users with specific profile type)
    company = await User.findById(companyId)
      .select('name displayName tagline bio image bannerImage location publicEmail publicPhone website linkedIn isActive isVerifiedSeller sellerVerificationStatus contractorVerificationStatus contractorTier createdAt companyInfo sponsoredPlacementActive')
      .lean() as CompanyUser | null;

    if (!company || !company.isActive) {
      return (
        <main className="min-h-screen bg-surface-secondary">
          <div className="container-rail py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
              <p className="text-gray-500">This company profile may have been removed or is not publicly available.</p>
            </div>
          </div>
        </main>
      );
    }
  } catch (err) {
    console.error('Error loading company profile:', err);
    error = 'Unable to load company profile';
  }

  if (error) {
    return (
      <main className="min-h-screen bg-surface-secondary">
        <div className="container-rail py-12">
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  // Determine verification status
  const isVerified = company?.contractorVerificationStatus === 'active' || company?.sellerVerificationStatus === 'active';
  const isSponsored = company?.sponsoredPlacementActive === true;
  const displayName = company?.displayName || company?.name || 'Unknown Company';
  const locationString = company?.location?.city && company?.location?.state 
    ? `${company.location.city}, ${company.location.state}`
    : company?.location?.state || null;

  // Company info
  const companyType = company?.companyInfo?.companyType;
  const productCategories = company?.companyInfo?.productCategories || [];
  const brandsRepresented = company?.companyInfo?.brandsRepresented || [];
  const marketsServed = company?.companyInfo?.marketsServed || [];
  const distributionRegions = company?.companyInfo?.distributionRegions || [];

  return (
    <>
      {/* Analytics: Track page views for company profiles */}
      <PageViewTracker targetType="company" targetId={companyId} />
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
              <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
              <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
            </Link>
            <Link href="/marketplace" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
              ← Marketplace
            </Link>
          </div>
        </nav>
      </header>

      <main className="min-h-screen bg-surface-secondary pb-12">
        <div className="container-rail py-8">
          <div className="max-w-4xl mx-auto">
            {/* ================================================================
                HERO / IDENTITY BLOCK - OPUS COMPLIANT
                ================================================================ */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className="w-24 h-24 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {company?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={company.image}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-text-tertiary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h1 className="text-xl md:text-2xl font-bold text-navy-900">{displayName}</h1>
                      
                      {/* Entity Type Label */}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        Company
                      </span>
                      
                      {/* ID Verified Badge */}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                          ID Verified
                        </span>
                      )}
                      
                      {/* Professional Verified Badge */}
                      {company?.contractorVerificationStatus === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                          Professional Verified
                        </span>
                      )}
                      
                      {/* Sponsored Label (Elite placement) */}
                      {isSponsored && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-200">
                          Sponsored
                        </span>
                      )}
                    </div>

                    {/* Tagline */}
                    {company?.tagline && (
                      <p className="text-sm text-text-secondary mb-2">{company.tagline}</p>
                    )}

                    {/* Location */}
                    {locationString && (
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-text-tertiary" />
                        {locationString}
                        <span className="text-xs text-text-tertiary ml-1">(Headquarters)</span>
                      </p>
                    )}

                    {/* Year Founded & Size */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                      {company?.companyInfo?.yearFounded && (
                        <span>Est. {company.companyInfo.yearFounded} <span className="text-text-tertiary">(Self-reported)</span></span>
                      )}
                      {company?.companyInfo?.employeeCount && (
                        <span>{company.companyInfo.employeeCount} employees</span>
                      )}
                      <span>Member since {formatMemberSince(company?.createdAt)}</span>
                    </div>
                    
                    {/* Primary CTAs with Outbound Tracking */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <Link
                        href={`/contact?companyId=${companyId}&subject=${encodeURIComponent(`Inquiry about ${displayName}`)}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange text-white font-medium rounded-lg hover:bg-rail-orange/90 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                      </Link>
                      
                      <ContactLinks
                        companyId={companyId}
                        website={company?.website}
                        linkedIn={company?.linkedIn}
                        email={company?.publicEmail}
                        phone={company?.publicPhone}
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

            {/* ================================================================
                CAPABILITIES / DESCRIPTION SECTION
                ================================================================ */}
            {(company?.bio || company?.companyInfo?.description) && (
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
                <h2 className="font-semibold text-navy-900 mb-3">About</h2>
                <p className="text-text-primary whitespace-pre-wrap text-sm">
                  {company?.companyInfo?.description || company?.bio}
                </p>
                <p className="text-xs text-text-tertiary mt-4 italic">
                  Business descriptions are provided by the entity and are not endorsements by The Rail Exchange.
                </p>
              </div>
            )}

            {/* ================================================================
                FAST-SCAN FACT BLOCKS (Two Column Layout)
                ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Company Type */}
                {companyType && (
                  <CompanyTypeChips companyType={companyType} />
                )}
                
                {/* Product Categories (Clickable → Marketplace Search) */}
                <ProductCategories categories={productCategories} />

                {/* Markets Served */}
                {marketsServed.length > 0 && (
                  <MarketsServed markets={marketsServed} />
                )}

                {/* Brands / Manufacturers Represented */}
                {brandsRepresented.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-text-tertiary" />
                      <h2 className="font-semibold text-navy-900">Brands & Manufacturers</h2>
                      <span className="text-xs text-text-tertiary">(Self-reported)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {brandsRepresented.map((brand) => (
                        <span
                          key={brand}
                          className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Verification Status Block */}
                <CompanyVerificationBlock isVerified={isVerified} isSponsored={isSponsored} />

                {/* Company Details (HQ, Years, etc.) */}
                <CompanyDetails
                  headquarters={company?.location}
                  yearFounded={company?.companyInfo?.yearFounded}
                  employeeCount={company?.companyInfo?.employeeCount}
                />

                {/* Distribution Regions */}
                <DistributionRegions regions={distributionRegions} />
              </div>
            </div>

            {/* Self-Reported Disclaimer */}
            <SelfReportedDisclaimer className="mt-6" />

            {/* Platform Disclaimer */}
            <p className="text-xs text-text-tertiary text-center mt-6">
              Company information is provided by the company. The Rail Exchange connects buyers and suppliers.
              We do not participate in or guarantee transactions. Buyers should conduct their own due diligence.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
