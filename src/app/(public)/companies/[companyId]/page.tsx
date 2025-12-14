/**
 * THE RAIL EXCHANGE™ — Public Company Profile Page
 * 
 * Purpose: Product/supplier visibility (Companies sell products, not services).
 * 
 * MUST include:
 * - Product categories
 * - Brands / manufacturers represented
 * - Distribution regions
 * - Website & LinkedIn outbound links
 * - Verification badge
 * 
 * MUST NOT include:
 * - Contractor service taxonomy
 * - Emergency availability
 * - Response claims
 * 
 * NO auth. NO enforcement. Safe fail.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Package, MapPin, Globe, Linkedin, Shield, ExternalLink, Mail } from 'lucide-react';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { PageViewTracker } from '@/lib/hooks/useAnalyticsEvent';

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
  // Company-specific fields
  companyInfo?: {
    productCategories?: string[];
    brandsRepresented?: string[];
    distributionRegions?: string[];
    yearFounded?: number;
    employeeCount?: string;
    description?: string;
  };
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
      .select('name displayName tagline bio image bannerImage location publicEmail publicPhone website linkedIn isActive isVerifiedSeller sellerVerificationStatus contractorVerificationStatus contractorTier createdAt companyInfo')
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
  const displayName = company?.displayName || company?.name || 'Unknown Company';
  const locationString = company?.location?.city && company?.location?.state 
    ? `${company.location.city}, ${company.location.state}`
    : company?.location?.state || null;

  // Company info
  const productCategories = company?.companyInfo?.productCategories || [];
  const brandsRepresented = company?.companyInfo?.brandsRepresented || [];
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
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className="w-20 h-20 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <h1 className="text-xl font-bold text-navy-900">{displayName}</h1>
                      
                      {/* Verified Company Badge */}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                          <Shield className="w-3 h-3" />
                          Verified Company
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
                      </p>
                    )}

                    {/* Year Founded & Size */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                      {company?.companyInfo?.yearFounded && (
                        <span>Est. {company.companyInfo.yearFounded}</span>
                      )}
                      {company?.companyInfo?.employeeCount && (
                        <span>{company.companyInfo.employeeCount} employees</span>
                      )}
                      <span>Member since {formatMemberSince(company?.createdAt)}</span>
                    </div>
                  </div>

                  {/* Contact CTA */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/contact?companyId=${companyId}&subject=${encodeURIComponent(`Inquiry about ${displayName}`)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange text-white font-medium rounded-lg hover:bg-rail-orange/90 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Contact
                    </Link>
                  </div>
                </div>

                {/* About / Description */}
                {(company?.bio || company?.companyInfo?.description) && (
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <p className="text-text-primary whitespace-pre-wrap text-sm">
                      {company?.companyInfo?.description || company?.bio}
                    </p>
                  </div>
                )}

                {/* Website & LinkedIn Links */}
                <div className="mt-4 pt-4 border-t border-surface-border flex flex-wrap gap-4">
                  {company?.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-rail-orange hover:underline text-sm"
                    >
                      <Globe className="w-4 h-4" />
                      {company.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {company?.linkedIn && (
                    <a
                      href={company.linkedIn.startsWith('http') ? company.linkedIn : `https://linkedin.com/company/${company.linkedIn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#0A66C2] hover:underline text-sm"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Categories */}
                {productCategories.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-text-tertiary" />
                      <h2 className="font-semibold text-navy-900">Product Categories</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {productCategories.map((category) => (
                        <Link
                          key={category}
                          href={`/marketplace?category=${encodeURIComponent(category)}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brands / Manufacturers Represented */}
                {brandsRepresented.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-text-tertiary" />
                      <h2 className="font-semibold text-navy-900">Brands & Manufacturers</h2>
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
                {/* Verification Status */}
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-text-tertiary" />
                    <h2 className="font-semibold text-navy-900">Verification</h2>
                  </div>
                  
                  {isVerified ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Verified Company</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Not Verified</span>
                    </div>
                  )}
                  
                  {/* AI Disclosure */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">
                      Verification reflects document review only and does not guarantee performance, quality, or outcomes.
                      Verification is assisted by automated (AI) analysis and human review.
                    </p>
                  </div>
                </div>

                {/* Distribution Regions */}
                {distributionRegions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-text-tertiary" />
                      <h2 className="font-semibold text-navy-900">Distribution Regions</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {distributionRegions.slice(0, 8).map((region) => (
                        <span
                          key={region}
                          className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900"
                        >
                          {region}
                        </span>
                      ))}
                      {distributionRegions.length > 8 && (
                        <span className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-text-tertiary">
                          +{distributionRegions.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Disclaimer */}
            <p className="text-xs text-text-tertiary text-center mt-8">
              Company information is provided by the company. The Rail Exchange connects buyers and suppliers.
              We do not participate in or guarantee transactions. Buyers should conduct their own due diligence.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
