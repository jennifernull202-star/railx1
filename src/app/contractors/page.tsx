/**
 * THE RAIL EXCHANGE™ — Contractor Directory
 * 
 * Browse and filter all rail industry contractors.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { SERVICE_CATEGORIES, US_STATES } from '@/lib/constants';
import { CONTRACTOR_TYPES, CONTRACTOR_TYPE_CONFIG, type ContractorType } from '@/config/contractor-types';
import { FeaturedContractorPromoCard } from '@/components/cards';
import ContractorsViewToggle from '@/components/contractor/ContractorsViewToggle';

export const metadata: Metadata = {
  title: 'Rail Contractors Directory | The Rail Exchange',
  description: 'Find verified rail industry contractors. Browse track work, signaling, electrical, bridge construction, and more.',
};

interface SearchParams {
  service?: string;
  region?: string;
  contractorType?: string;
  search?: string;
  page?: string;
}

interface Contractor {
  _id: string;
  businessName: string;
  businessDescription: string;
  logo?: string;
  services: string[];
  contractorTypes?: string[];
  subServices?: Record<string, string[]>;
  regionsServed: string[];
  yearsInBusiness: number;
  verificationStatus: string;
  visibilityTier: 'verified' | 'featured' | 'priority';
  address: {
    city: string;
    state: string;
  };
}

async function getContractors(searchParams: SearchParams) {
  await connectDB();

  const { service, region, contractorType, search, page = '1' } = searchParams;
  const limit = 12;
  const skip = (parseInt(page) - 1) * limit;
  const now = new Date();

  // ================================================================
  // HARD VISIBILITY GATE — NO FREE CONTRACTORS
  // ================================================================
  // Contractors MUST be:
  // 1. Verified (verificationStatus === 'verified')
  // 2. Have an active paid visibility tier (visibilityTier !== 'none')
  // 3. Subscription must be active (visibilitySubscriptionStatus === 'active')
  // 4. Visibility and verification must NOT be expired
  // ================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    isActive: true,
    isPublished: true,
    // HARD GATE: Must be verified
    verificationStatus: 'verified',
    // HARD GATE: Must have a paid visibility tier
    visibilityTier: { $in: ['verified', 'featured', 'priority'] },
    // HARD GATE: Subscription must be active
    visibilitySubscriptionStatus: 'active',
    // HARD GATE: Visibility not expired
    $or: [
      { visibilityExpiresAt: { $gt: now } },
      { visibilityExpiresAt: { $exists: false } },
      { visibilityExpiresAt: null },
    ],
    // HARD GATE: Verification not expired
    $and: [
      {
        $or: [
          { verifiedBadgeExpiresAt: { $gt: now } },
          { verifiedBadgeExpiresAt: { $exists: false } },
          { verifiedBadgeExpiresAt: null },
        ],
      },
    ],
  };

  if (service) {
    query.services = service;
  }

  if (region) {
    query.regionsServed = region;
  }

  // Filter by contractor type (new structured types)
  if (contractorType) {
    query.contractorTypes = contractorType;
  }

  if (search) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const [contractors, total] = await Promise.all([
    ContractorProfile.find(query)
      .select('businessName businessDescription logo services contractorTypes subServices regionsServed yearsInBusiness verificationStatus visibilityTier address.city address.state')
      .sort({ 
        // Priority tier first, then Featured, then Verified
        visibilityTier: -1, 
        yearsInBusiness: -1 
      })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContractorProfile.countDocuments(query),
  ]);

  return {
    contractors: contractors as unknown as Contractor[],
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
  };
}

function ContractorCard({ contractor }: { contractor: Contractor }) {
  // Use new contractor types if available, fallback to legacy services
  const hasContractorTypes = contractor.contractorTypes && contractor.contractorTypes.length > 0;
  
  const typeLabels = hasContractorTypes
    ? contractor.contractorTypes!.slice(0, 3).map((typeId) => {
        const config = CONTRACTOR_TYPE_CONFIG[typeId as ContractorType];
        return config?.label || typeId;
      })
    : contractor.services.slice(0, 3).map((serviceId) => {
        const service = SERVICE_CATEGORIES.find((s) => s.id === serviceId);
        return service?.label || serviceId;
      });

  const totalCount = hasContractorTypes 
    ? contractor.contractorTypes!.length 
    : contractor.services.length;

  // S-5.1: Visibility tier badge styling - 'Sponsored' for paid, 'ID Verified' for verification
  const getTierBadge = () => {
    switch (contractor.visibilityTier) {
      case 'priority':
        return (
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-semibold rounded-full shadow-md"
            title="This placement reflects paid visibility options, not contractor quality or endorsement."
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Sponsored
          </span>
        );
      case 'featured':
        return (
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-rail-orange to-orange-500 text-white text-xs font-semibold rounded-full"
            title="This placement reflects paid visibility options, not contractor quality or endorsement."
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 6l-2.293-2.293A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            Sponsored
          </span>
        );
      default:
        return (
          <span 
            className="badge-verified text-xs"
            title="Verified indicates business documents were submitted and reviewed. It does not guarantee work quality, licensing, or project outcomes."
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            ID Verified
          </span>
        );
    }
  };

  return (
    <Link
      href={`/contractors/${contractor._id}`}
      className="group bg-white rounded-2xl shadow-card border border-surface-border hover:shadow-elevated transition-all duration-300 overflow-hidden"
    >
      {/* Header */}
      <div className="h-32 bg-gradient-to-br from-navy-900 to-navy-800 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-4 right-4">
          {getTierBadge()}
        </div>
      </div>

      {/* Logo & Content */}
      <div className="p-6 pt-0 -mt-10 relative">
        <div className="w-20 h-20 bg-white rounded-xl border border-surface-border shadow-card flex items-center justify-center overflow-hidden mb-4">
          {contractor.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contractor.logo}
              alt={contractor.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-text-tertiary">
              {contractor.businessName.charAt(0)}
            </span>
          )}
        </div>

        <h3 className="heading-md group-hover:text-rail-orange transition-colors line-clamp-1">
          {contractor.businessName}
        </h3>
        <p className="text-body-sm text-text-secondary mt-1">
          {contractor.address.city}, {contractor.address.state} • {contractor.yearsInBusiness} yrs <span className="text-text-tertiary">(Self-reported)</span>
        </p>

        <p className="text-body-sm text-text-secondary mt-3 line-clamp-2">
          {contractor.businessDescription}
        </p>

        {/* Services / Contractor Types */}
        <div className="flex flex-wrap gap-2 mt-4">
          {typeLabels.map((label) => (
            <span
              key={label}
              className="px-2 py-1 bg-surface-secondary rounded text-caption font-medium text-navy-900"
            >
              {label}
            </span>
          ))}
          {totalCount > 3 && (
            <span className="px-2 py-1 bg-surface-secondary rounded text-caption text-text-tertiary">
              +{totalCount - 3}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-surface-border">
          <span className="text-body-sm font-semibold text-rail-orange group-hover:text-rail-orange-dark flex items-center gap-1">
            View Profile
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    // Show empty state when filters applied but no results
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="heading-md mb-2">No contractors found</h3>
        <p className="text-body-md text-text-secondary max-w-md">
          Try adjusting your filters or search terms to find more contractors.
        </p>
      </div>
    );
  }

  // Show promo card when no contractors exist at all
  return (
    <>
      {/* Promo Card - First Position */}
      <FeaturedContractorPromoCard />
      
      {/* Message Card */}
      <div className="col-span-full md:col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl shadow-card border border-surface-border text-center">
        <div className="w-16 h-16 bg-rail-orange/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="heading-md mb-2">Be the First Contractor</h3>
        <p className="text-body-md text-text-secondary max-w-md mb-6">
          No contractors have listed yet. Be the first to showcase your rail industry services on The Rail Exchange.
        </p>
        <Link href="/contractors/onboard" className="btn-primary">
          List Your Business
        </Link>
      </div>
    </>
  );
}

function Pagination({ currentPage, pages }: { currentPage: number; pages: number }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link
          href={`/contractors?page=${currentPage - 1}`}
          className="px-4 py-2 bg-white border border-surface-border rounded-lg text-body-sm font-medium text-navy-900 hover:bg-surface-secondary transition-colors"
        >
          Previous
        </Link>
      )}
      <span className="px-4 py-2 text-body-sm text-text-secondary">
        Page {currentPage} of {pages}
      </span>
      {currentPage < pages && (
        <Link
          href={`/contractors?page=${currentPage + 1}`}
          className="px-4 py-2 bg-white border border-surface-border rounded-lg text-body-sm font-medium text-navy-900 hover:bg-surface-secondary transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}

async function ContractorsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { contractors, total, pages, currentPage } = await getContractors(params);
  const hasFilters = !!(params.service || params.contractorType || params.region || params.search);

  return (
    <ContractorsViewToggle contractors={contractors}>
      <div className="flex items-center justify-between mb-8">
        <p className="text-body-md text-text-secondary">
          {total > 0 ? (
            <>
              Showing <span className="font-semibold text-navy-900">{contractors.length}</span> of{' '}
              <span className="font-semibold text-navy-900">{total}</span> contractors
            </>
          ) : (
            'No contractors found'
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contractors.length > 0 ? (
          contractors.map((contractor) => (
            <ContractorCard key={contractor._id} contractor={contractor} />
          ))
        ) : (
          <EmptyState hasFilters={hasFilters} />
        )}
      </div>

      <Pagination currentPage={currentPage} pages={pages} />
    </ContractorsViewToggle>
  );
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

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
            <div className="flex items-center gap-4">
              <Link href="/contractors/onboard" className="btn-primary py-2 px-4">
                List Your Business
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary">
        {/* Hero */}
        <section className="bg-navy-900 text-white py-16">
          <div className="container-rail">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-display-md font-bold mb-4">
                Rail Industry Contractors
              </h1>
              <p className="text-heading-sm text-white/80">
                Find document-reviewed contractors for track work, signaling, electrical, bridge construction, and more.
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b border-surface-border py-6">
          <div className="container-rail">
            <form className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search contractors..."
                    defaultValue={params.search || ''}
                    className="form-input pl-12"
                  />
                </div>
              </div>

              {/* Service Filter (Legacy) */}
              <select
                name="service"
                defaultValue={params.service || ''}
                className="form-input min-w-[200px]"
              >
                <option value="">All Services</option>
                {SERVICE_CATEGORIES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                  </option>
                ))}
              </select>

              {/* Contractor Type Filter (New) */}
              <select
                name="contractorType"
                defaultValue={params.contractorType || ''}
                className="form-input min-w-[200px]"
              >
                <option value="">All Contractor Types</option>
                {Object.values(CONTRACTOR_TYPES).filter(t => t !== CONTRACTOR_TYPES.OTHER).map((typeId) => (
                  <option key={typeId} value={typeId}>
                    {CONTRACTOR_TYPE_CONFIG[typeId as ContractorType]?.label || typeId}
                  </option>
                ))}
              </select>

              {/* Region Filter */}
              <select
                name="region"
                defaultValue={params.region || ''}
                className="form-input min-w-[200px]"
              >
                <option value="">All Regions</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              <button type="submit" className="btn-primary py-3 px-6">
                Search
              </button>

              {(params.search || params.service || params.contractorType || params.region) && (
                <Link
                  href="/contractors"
                  className="text-body-sm font-medium text-text-secondary hover:text-navy-900"
                >
                  Clear filters
                </Link>
              )}
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="py-12">
          <div className="container-rail">
            <Suspense
              fallback={
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-card border border-surface-border h-96 animate-pulse"
                    >
                      <div className="h-32 bg-navy-100" />
                      <div className="p-6">
                        <div className="w-20 h-20 bg-navy-100 rounded-xl -mt-16 mb-4" />
                        <div className="h-6 bg-navy-100 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-navy-100 rounded w-1/2 mb-4" />
                        <div className="h-16 bg-navy-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <ContractorsList searchParams={searchParams} />
            </Suspense>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white border-t border-surface-border py-16">
          <div className="container-rail text-center">
            <h2 className="heading-xl mb-4">Are you a rail contractor?</h2>
            <p className="text-body-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              Join The Rail Exchange and connect with buyers looking for your services.
              Get verified to stand out from the competition.
            </p>
            <Link href="/contractors/onboard" className="btn-primary btn-lg">
              List Your Business
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-8">
        <div className="container-rail text-center">
          <p className="text-body-sm text-white/60">
            © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
          </p>
          {/* S-8.7: Global platform disclosure */}
          <p className="mt-2 text-[11px] text-white/40">
            The Rail Exchange is a listing and introduction platform. Transactions occur directly between parties.
          </p>
          {/* S-11.8: Platform Role Reinforcement */}
          <p className="mt-1 text-[11px] text-white/40">
            The Rail Exchange facilitates introductions. All negotiations, responses, and transactions occur directly between parties.
          </p>
        </div>
      </footer>
    </>
  );
}
