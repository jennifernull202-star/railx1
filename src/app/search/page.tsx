/**
 * THE RAIL EXCHANGE™ — Search Page
 * 
 * Unified search experience for listings and contractors.
 */

'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/listing-constants';
import { SERVICE_CATEGORIES, US_STATES } from '@/lib/constants';
import { ListingsMap } from '@/components/maps';

const CATEGORY_LABELS: Record<string, string> = {
  'locomotives': 'Locomotives',
  'freight-cars': 'Freight Cars',
  'passenger-cars': 'Passenger Cars',
  'maintenance-of-way': 'Maintenance of Way',
  'track-materials': 'Track Materials',
  'signals-communications': 'Signals & Communications',
  'parts-components': 'Parts & Components',
  'tools-equipment': 'Tools & Equipment',
  'real-estate': 'Real Estate',
  'services': 'Services',
};

const CONDITION_LABELS: Record<string, string> = {
  'new': 'New',
  'rebuilt': 'Rebuilt',
  'refurbished': 'Refurbished',
  'used-excellent': 'Used - Excellent',
  'used-good': 'Used - Good',
  'used-fair': 'Used - Fair',
  'for-parts': 'For Parts',
  'as-is': 'As-Is',
};

interface Listing {
  _id: string;
  title: string;
  slug: string;
  category: string;
  condition: string;
  primaryImageUrl?: string;
  price: {
    type: string;
    amount?: number;
    currency: string;
  };
  location: {
    city: string;
    state: string;
  };
  viewCount: number;
  premiumAddOns: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
  };
  // Add ranking tier from search API
  _rankTier?: 'elite' | 'premium' | 'featured' | 'standard';
}

interface Contractor {
  _id: string;
  businessName: string;
  businessDescription: string;
  logo?: string;
  services: string[];
  regionsServed: string[];
  yearsInBusiness: number;
  verificationStatus: string;
  address: {
    city: string;
    state: string;
  };
}

interface SearchResults {
  listings?: Listing[];
  contractors?: Contractor[];
  listingsTotal?: number;
  contractorsTotal?: number;
  suggestions?: string[];
}

function formatPrice(price: Listing['price']): string {
  if (price.type === 'contact') return 'Contact';
  if (price.type === 'rfq') return 'RFQ';
  if (!price.amount) return 'Contact';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.slug || listing._id}`}
      className="group flex gap-4 p-4 bg-white rounded-xl border border-surface-border hover:shadow-card transition-all"
    >
      {/* Thumbnail */}
      <div className="w-24 h-24 flex-shrink-0 bg-navy-100 rounded-lg overflow-hidden">
        {listing.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.primaryImageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-caption font-medium text-rail-orange">
            {CATEGORY_LABELS[listing.category] || listing.category}
          </span>
          {/* Show tier badge based on ranking */}
          {(listing._rankTier === 'elite' || listing.premiumAddOns?.elite?.active) && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs px-2 py-0.5 rounded font-semibold">Elite</span>
          )}
          {(listing._rankTier === 'premium' || listing.premiumAddOns?.premium?.active) && !listing.premiumAddOns?.elite?.active && listing._rankTier !== 'elite' && (
            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded font-semibold">Premium</span>
          )}
          {(listing._rankTier === 'featured' || listing.premiumAddOns?.featured?.active) && !listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && listing._rankTier !== 'premium' && listing._rankTier !== 'elite' && (
            <span className="badge-featured text-xs py-0.5">Featured</span>
          )}
        </div>
        <h3 className="text-body-md font-semibold text-navy-900 group-hover:text-rail-orange transition-colors line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-body-sm font-bold text-navy-900 mt-1">
          {formatPrice(listing.price)}
        </p>
        <p className="text-caption text-text-secondary">
          {listing.location.city}, {listing.location.state} • {CONDITION_LABELS[listing.condition]}
        </p>
      </div>
    </Link>
  );
}

function ContractorCard({ contractor }: { contractor: Contractor }) {
  const serviceLabels = contractor.services.slice(0, 2).map((id) => {
    const service = SERVICE_CATEGORIES.find((s) => s.id === id);
    return service?.label || id;
  });

  return (
    <Link
      href={`/contractors/${contractor._id}`}
      className="group flex gap-4 p-4 bg-white rounded-xl border border-surface-border hover:shadow-card transition-all"
    >
      {/* Logo */}
      <div className="w-16 h-16 flex-shrink-0 bg-surface-secondary rounded-lg flex items-center justify-center overflow-hidden">
        {contractor.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contractor.logo}
            alt={contractor.businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-text-tertiary">
            {contractor.businessName.charAt(0)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-body-md font-semibold text-navy-900 group-hover:text-rail-orange transition-colors line-clamp-1">
            {contractor.businessName}
          </h3>
          {contractor.verificationStatus === 'verified' && (
            <span className="badge-verified text-xs py-0.5">Verified</span>
          )}
        </div>
        <p className="text-caption text-text-secondary mb-1">
          {contractor.address?.city}, {contractor.address?.state} • {contractor.yearsInBusiness} years
        </p>
        <div className="flex flex-wrap gap-1">
          {serviceLabels.map((label) => (
            <span key={label} className="text-caption bg-surface-secondary px-2 py-0.5 rounded">
              {label}
            </span>
          ))}
          {contractor.services.length > 2 && (
            <span className="text-caption text-text-tertiary">+{contractor.services.length - 2}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Perform search
  const performSearch = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (searchType !== 'all') params.set('type', searchType);
      if (category) params.set('category', category);
      if (condition) params.set('condition', condition);
      if (state) params.set('state', state);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType, category, condition, state]);

  // Search on mount and when URL changes
  useEffect(() => {
    if (query || category || condition || state) {
      performSearch();
    }
  }, [query, category, condition, state, searchType, performSearch]);

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update URL
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (searchType !== 'all') params.set('type', searchType);
    if (category) params.set('category', category);
    if (condition) params.set('condition', condition);
    if (state) params.set('state', state);

    router.push(`/search?${params.toString()}`);
    performSearch();
  };

  // Clear filters
  const clearFilters = () => {
    setCategory('');
    setCondition('');
    setState('');
  };

  const hasFilters = !!(category || condition || state);
  const totalResults = (results?.listingsTotal || 0) + (results?.contractorsTotal || 0);

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
              <Link href="/listings" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
                Listings
              </Link>
              <Link href="/contractors" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
                Contractors
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary min-h-screen">
        {/* Search Header */}
        <section className="bg-white border-b border-surface-border py-8">
          <div className="container-rail">
            <form onSubmit={handleSubmit}>
              {/* Search Input */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
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
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search listings, contractors, equipment..."
                    className="form-input pl-12 py-4 text-lg w-full"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary px-8">
                  Search
                </button>
              </div>

              {/* Type Tabs */}
              <div className="flex gap-2 mb-4">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'listings', label: 'Listings' },
                  { value: 'contractors', label: 'Contractors' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSearchType(tab.value)}
                    className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                      searchType === tab.value
                        ? 'bg-rail-orange text-white'
                        : 'bg-surface-secondary text-text-secondary hover:bg-navy-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                    showFilters || hasFilters
                      ? 'bg-navy-900 text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-navy-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {hasFilters && <span className="w-2 h-2 bg-rail-orange rounded-full" />}
                </button>

                {/* Map View Toggle */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-rail-orange text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-navy-100'
                  }`}
                >
                  {viewMode === 'map' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      List View
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Map View
                    </>
                  )}
                </button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="bg-surface-secondary rounded-xl p-6 space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-input"
                      >
                        <option value="">All Categories</option>
                        {LISTING_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat] || cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Condition</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="form-input"
                      >
                        <option value="">All Conditions</option>
                        {LISTING_CONDITIONS.map((cond) => (
                          <option key={cond} value={cond}>
                            {CONDITION_LABELS[cond] || cond}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">State</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="form-input"
                      >
                        <option value="">All States</option>
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="container-rail">
            {/* Results Count */}
            {results && (
              <div className="mb-6">
                <p className="text-body-md text-text-secondary">
                  {isLoading ? (
                    'Searching...'
                  ) : totalResults > 0 ? (
                    <>
                      Found <span className="font-semibold text-navy-900">{totalResults}</span> results
                      {query && (
                        <>
                          {' '}for &quot;<span className="font-semibold text-navy-900">{query}</span>&quot;
                        </>
                      )}
                    </>
                  ) : (
                    'No results found'
                  )}
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rail-orange" />
              </div>
            )}

            {/* Map View */}
            {!isLoading && results && viewMode === 'map' && results.listings && results.listings.length > 0 && (
              <div className="mb-8">
                <ListingsMap
                  listings={results.listings.map(listing => ({
                    id: listing._id,
                    title: listing.title,
                    slug: listing.slug,
                    category: listing.category,
                    condition: listing.condition,
                    price: listing.price,
                    location: {
                      city: listing.location.city,
                      state: listing.location.state,
                      // Use stored coordinates if available (from location autocomplete during listing creation)
                      lat: listing.location.coordinates?.coordinates?.[1],
                      lng: listing.location.coordinates?.coordinates?.[0],
                    },
                    primaryImageUrl: listing.primaryImageUrl,
                    premiumAddOns: listing.premiumAddOns,
                  }))}
                  height="500px"
                />
                <p className="text-sm text-text-tertiary mt-4 text-center">
                  Note: Map shows listings with location coordinates. Add Google Maps API key for full functionality.
                </p>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && results && viewMode === 'list' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Listings */}
                {(searchType === 'all' || searchType === 'listings') &&
                  results.listings &&
                  results.listings.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="heading-md">
                          Listings
                          <span className="text-text-secondary font-normal ml-2">
                            ({results.listingsTotal})
                          </span>
                        </h2>
                        {searchType === 'all' && (results.listingsTotal || 0) > 10 && (
                          <button
                            onClick={() => setSearchType('listings')}
                            className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                          >
                            View all →
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {results.listings.map((listing) => (
                          <ListingCard key={listing._id} listing={listing} />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Contractors */}
                {(searchType === 'all' || searchType === 'contractors') &&
                  results.contractors &&
                  results.contractors.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="heading-md">
                          Contractors
                          <span className="text-text-secondary font-normal ml-2">
                            ({results.contractorsTotal})
                          </span>
                        </h2>
                        {searchType === 'all' && (results.contractorsTotal || 0) > 10 && (
                          <button
                            onClick={() => setSearchType('contractors')}
                            className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                          >
                            View all →
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {results.contractors.map((contractor) => (
                          <ContractorCard key={contractor._id} contractor={contractor} />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && results && totalResults === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="heading-md mb-2">No results found</h3>
                <p className="text-body-md text-text-secondary max-w-md mx-auto mb-6">
                  Try adjusting your search terms or filters to find what you&apos;re looking for.
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} className="btn-outline">
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Suggestions */}
            {results?.suggestions && results.suggestions.length > 0 && (
              <div className="mt-8 p-6 bg-white rounded-xl border border-surface-border">
                <h3 className="heading-sm mb-3">Related searches</h3>
                <div className="flex flex-wrap gap-2">
                  {results.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        searchInputRef.current?.focus();
                      }}
                      className="px-4 py-2 bg-surface-secondary rounded-lg text-body-sm font-medium text-text-secondary hover:bg-navy-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Initial State */}
            {!query && !hasFilters && !results && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-rail-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="heading-lg mb-4">Search The Rail Exchange</h2>
                <p className="text-body-lg text-text-secondary max-w-lg mx-auto mb-8">
                  Find rail equipment, materials, contractors, and more. Use filters to narrow down your results.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['locomotives', 'freight-cars', 'track-materials', 'maintenance-of-way'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        performSearch();
                      }}
                      className="px-4 py-2 bg-white border border-surface-border rounded-lg text-body-sm font-medium text-navy-900 hover:bg-surface-secondary transition-colors"
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-8">
        <div className="container-rail text-center">
          <p className="text-body-sm text-white/60">
            © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A1A]"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
