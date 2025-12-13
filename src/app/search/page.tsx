/**
 * THE RAIL EXCHANGE™ — Search Page
 * 
 * Unified search experience for listings and contractors.
 * 
 * BATCH 9 - SEARCH RESULTS PAGE:
 * - Auto-search on input (300ms debounce)
 * - Results count + query echo at top
 * - Active filter chips always visible
 * - Filters collapsed by default (sidebar dropdowns)
 * - Sort dropdown: Relevance | Price | Newest
 * - Default to ALL results (dropdown, no tabs)
 * - Progressive loading (10 results + Load more)
 * - Skeleton cards during load
 * 
 * BATCH 16 - CROSS-PAGE UX:
 * - Empty state with next step: "No results found" + Browse categories → ✓
 * - Skeleton loaders for initial load + Suspense fallback ✓
 */

'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/listing-constants';
import { SERVICE_CATEGORIES, US_STATES } from '@/lib/constants';
import { getHighestBadge } from '@/lib/ui';

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
    coordinates?: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  viewCount: number;
  premiumAddOns: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
  };
  sellerId?: {
    isVerifiedSeller?: boolean;
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

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-surface-border">
      <div className="w-24 h-24 bg-slate-200 rounded-lg animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
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
  const badge = getHighestBadge({
    elite: listing.premiumAddOns?.elite?.active || listing._rankTier === 'elite',
    premium: listing.premiumAddOns?.premium?.active || listing._rankTier === 'premium',
    featured: listing.premiumAddOns?.featured?.active || listing._rankTier === 'featured',
    verified: listing.sellerId?.isVerifiedSeller,
  });

  return (
    <Link
      href={`/listings/${listing.slug || listing._id}`}
      className="group flex gap-4 p-4 bg-white rounded-xl border border-surface-border hover:shadow-card transition-all"
    >
      {/* Thumbnail */}
      <div className="w-24 h-24 flex-shrink-0 bg-navy-100 rounded-lg overflow-hidden relative">
        {listing.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(listing.primaryImageUrl)}
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
        {/* Single highest badge */}
        {badge && (
          <span className={`absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold ${
            badge === 'ELITE' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
            badge === 'PREMIUM' ? 'bg-purple-600 text-white' :
            badge === 'FEATURED' ? 'bg-rail-orange text-white' :
            'bg-green-600 text-white'
          }`}>
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-caption font-medium text-rail-orange">
          {CATEGORY_LABELS[listing.category] || listing.category}
        </span>
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
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Perform search
  const performSearch = useCallback(async (resetPage = true) => {
    setIsLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (searchType !== 'all') params.set('type', searchType);
      if (category) params.set('category', category);
      if (condition) params.set('condition', condition);
      if (state) params.set('state', state);
      if (sortBy !== 'relevance') params.set('sort', sortBy);
      params.set('page', String(currentPage));
      params.set('limit', '10');

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (resetPage) {
          setResults(data.data);
        } else {
          // Append results for load more
          setResults(prev => ({
            ...data.data,
            listings: [...(prev?.listings || []), ...(data.data.listings || [])],
            contractors: [...(prev?.contractors || []), ...(data.data.contractors || [])],
          }));
        }
        // Check if there are more results
        const total = (data.data.listingsTotal || 0) + (data.data.contractorsTotal || 0);
        const loaded = ((resetPage ? 0 : results?.listings?.length || 0) + (data.data.listings?.length || 0)) +
                       ((resetPage ? 0 : results?.contractors?.length || 0) + (data.data.contractors?.length || 0));
        setHasMore(loaded < total);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType, category, condition, state, sortBy, page, results]);

  // Auto-search with debounce (300ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (query || category || condition || state) {
        performSearch(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, category, condition, state, searchType, sortBy]);

  // Update URL without triggering navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (searchType !== 'all') params.set('type', searchType);
    if (category) params.set('category', category);
    if (condition) params.set('condition', condition);
    if (state) params.set('state', state);
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    window.history.replaceState({}, '', newUrl);
  }, [query, searchType, category, condition, state]);

  // Clear single filter
  const clearFilter = (filter: 'category' | 'condition' | 'state') => {
    if (filter === 'category') setCategory('');
    if (filter === 'condition') setCondition('');
    if (filter === 'state') setState('');
  };

  // Load more results
  const loadMore = () => {
    setPage(p => p + 1);
    performSearch(false);
  };

  const hasFilters = !!(category || condition || state);
  const totalResults = (results?.listingsTotal || 0) + (results?.contractorsTotal || 0);

  return (
    <main className="flex-1 bg-surface-secondary min-h-screen">
      <section className="container-rail py-6">
        {/* Search Header */}
        <header className="space-y-4 mb-6">
          {/* Search Input - auto search, no button */}
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
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search listings, contractors, equipment..."
              className="form-input pl-12 py-3 w-full"
              autoFocus
            />
          </div>

          {/* Results count */}
          {results && (
            <p className="text-sm text-text-secondary">
              {totalResults} results{query && <> for &quot;{query}&quot;</>}
            </p>
          )}

          {/* Active Filter Chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2">
              {category && (
                <button
                  onClick={() => clearFilter('category')}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-rail-orange/10 text-rail-orange rounded-full text-sm"
                >
                  {CATEGORY_LABELS[category] || category}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {condition && (
                <button
                  onClick={() => clearFilter('condition')}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-rail-orange/10 text-rail-orange rounded-full text-sm"
                >
                  {CONDITION_LABELS[condition] || condition}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {state && (
                <button
                  onClick={() => clearFilter('state')}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-rail-orange/10 text-rail-orange rounded-full text-sm"
                >
                  {state}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Sort, Type & Mobile Filter Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input py-2 text-sm w-auto"
            >
              <option value="relevance">Relevance</option>
              <option value="price">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>

            {/* Type dropdown */}
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="form-input py-2 text-sm w-auto"
            >
              <option value="all">All Results</option>
              <option value="listings">Listings Only</option>
              <option value="contractors">Contractors Only</option>
            </select>

            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden flex items-center gap-2 px-3 py-2 border border-surface-border rounded-lg text-sm text-navy-900 hover:bg-surface-secondary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasFilters && <span className="w-2 h-2 bg-rail-orange rounded-full" />}
            </button>
          </div>

          {/* Mobile Filters Panel (collapsed by default) */}
          {showMobileFilters && (
            <div className="md:hidden grid grid-cols-2 gap-3 p-4 bg-white rounded-xl border border-surface-border">
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input mt-1 text-sm"
                >
                  <option value="">All</option>
                  {LISTING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="form-input mt-1 text-sm"
                >
                  <option value="">All</option>
                  {LISTING_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>{CONDITION_LABELS[cond] || cond}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="form-input mt-1 text-sm"
                >
                  <option value="">All States</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        {/* Main content with collapsed filters sidebar */}
        <div className="flex gap-6">
          {/* Collapsed Filters Sidebar */}
          <aside className="hidden md:block w-48 flex-shrink-0">
            <div className="space-y-4 sticky top-4">
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input mt-1 text-sm"
                >
                  <option value="">All</option>
                  {LISTING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="form-input mt-1 text-sm"
                >
                  <option value="">All</option>
                  {LISTING_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {CONDITION_LABELS[cond] || cond}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="form-input mt-1 text-sm"
                >
                  <option value="">All</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1">
            {/* Initial Loading Skeleton (no results yet) */}
            {isLoading && !results && (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Results with optional loading overlay for refetch */}
            {results && (
              <div className={`space-y-3 ${isLoading ? 'opacity-60' : ''}`}>
                {/* Listings */}
                {(searchType === 'all' || searchType === 'listings') &&
                  results?.listings?.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}

                {/* Contractors */}
                {(searchType === 'all' || searchType === 'contractors') &&
                  results?.contractors?.map((contractor) => (
                    <ContractorCard key={contractor._id} contractor={contractor} />
                  ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && results && totalResults === 0 && (
              <div className="text-center py-12">
                <p className="text-text-secondary mb-4">No results found.</p>
                <Link href="/marketplace" className="text-rail-orange font-medium hover:underline">
                  Browse categories →
                </Link>
              </div>
            )}

            {/* Load More */}
            {hasMore && !isLoading && (
              <button
                onClick={loadMore}
                className="w-full mt-6 py-3 border border-surface-border rounded-lg text-navy-900 font-medium hover:bg-surface-secondary transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 bg-surface-secondary min-h-screen">
        <section className="container-rail py-6">
          <div className="space-y-4 mb-6">
            <div className="h-12 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-surface-border">
                <div className="w-24 h-24 bg-slate-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
                  <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
