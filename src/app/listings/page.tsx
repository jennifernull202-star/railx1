/**
 * THE RAIL EXCHANGE™ — Listings Directory
 * 
 * Browse and search all listings with advanced filtering.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import connectDB from '@/lib/db';
import Listing, { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/models/Listing';
import { US_STATES } from '@/lib/constants';
import { FeaturedListingPromoCard } from '@/components/cards';

export const metadata: Metadata = {
  title: 'Rail Equipment & Materials Marketplace | The Rail Exchange',
  description: 'Browse thousands of listings for rail equipment, locomotives, rolling stock, track materials, and more.',
};

interface SearchParams {
  category?: string;
  condition?: string;
  state?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  sortBy?: string;
}

interface ListingItem {
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
  quantity?: number;
  equipment?: {
    manufacturer?: string;
    model?: string;
    yearBuilt?: number;
  };
  sellerId?: {
    isVerifiedSeller?: boolean;
  };
  viewCount: number;
  premiumAddOns: {
    featured: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
    boosted: { active: boolean };
  };
  createdAt: string;
}

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

interface ListingsQuery {
  isActive: boolean;
  status: string;
  category?: string;
  condition?: { $in: string[] } | string;
  'location.state'?: string;
  'price.amount'?: { $gte?: number; $lte?: number };
  $text?: { $search: string };
}

async function getListings(searchParams: SearchParams) {
  // Try to connect to database
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
  } catch {
    console.log('Database not available, showing promo cards only');
  }

  const {
    category,
    condition,
    state,
    search,
    minPrice,
    maxPrice,
    page = '1',
    sortBy = 'newest',
  } = searchParams;

  const limit = 24;
  const skip = (parseInt(page) - 1) * limit;

  // If database not connected, return empty (will show promo cards)
  if (!dbConnected) {
    return {
      listings: [],
      total: 0,
      pages: 1,
      currentPage: parseInt(page),
      noDatabase: true,
    };
  }

  // Build query
  const query: ListingsQuery = {
    isActive: true,
    status: 'active',
  };

  if (category && LISTING_CATEGORIES.includes(category as typeof LISTING_CATEGORIES[number])) {
    query.category = category;
  }

  if (condition) {
    const conditions = condition.split(',').filter(c =>
      LISTING_CONDITIONS.includes(c as typeof LISTING_CONDITIONS[number])
    );
    if (conditions.length === 1) {
      query.condition = conditions[0];
    } else if (conditions.length > 1) {
      query.condition = { $in: conditions };
    }
  }

  if (state) {
    query['location.state'] = state;
  }

  if (minPrice || maxPrice) {
    query['price.amount'] = {};
    if (minPrice) query['price.amount'].$gte = parseInt(minPrice);
    if (maxPrice) query['price.amount'].$lte = parseInt(maxPrice);
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Build sort
  type SortObject = Record<string, 1 | -1>;
  let sort: SortObject = { 'premiumAddOns.featured.active': -1 };

  switch (sortBy) {
    case 'price-low':
      sort = { ...sort, 'price.amount': 1 };
      break;
    case 'price-high':
      sort = { ...sort, 'price.amount': -1 };
      break;
    case 'popular':
      sort = { ...sort, viewCount: -1 };
      break;
    case 'oldest':
      sort = { ...sort, createdAt: 1 };
      break;
    default: // newest
      sort = { ...sort, createdAt: -1 };
  }

  const [listings, total] = await Promise.all([
    Listing.find(query)
      .select('title slug category condition primaryImageUrl price location quantity equipment viewCount premiumAddOns createdAt sellerId')
      .populate('sellerId', 'isVerifiedSeller')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Listing.countDocuments(query),
  ]);

  return {
    listings: listings as unknown as ListingItem[],
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
  };
}

function formatPrice(price: ListingItem['price']): string {
  if (price.type === 'contact') return 'Contact';
  if (price.type === 'rfq') return 'RFQ';
  if (!price.amount) return 'Contact';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function ListingCard({ listing }: { listing: ListingItem }) {
  // Link to featured-example page for the featured example, otherwise normal listing page
  const href = listing._id === 'featured-example' 
    ? '/marketplace/featured-example'
    : `/listings/${listing.slug || listing._id}`;

  // Build equipment title: Manufacturer + Model or fallback to title
  const equipmentTitle = listing.equipment?.manufacturer && listing.equipment?.model
    ? `${listing.equipment.manufacturer} ${listing.equipment.model}`
    : listing.equipment?.manufacturer || listing.equipment?.model || listing.title;

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl shadow-card border border-surface-border hover:shadow-elevated transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-navy-100 relative">
        {listing.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.primaryImageUrl}
            alt={equipmentTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Tier Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {listing.premiumAddOns?.elite?.active && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm">
              ELITE
            </span>
          )}
          {listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm">
              PREMIUM
            </span>
          )}
          {listing.premiumAddOns?.featured?.active && !listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
            <span className="bg-rail-orange text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm">
              FEATURED
            </span>
          )}
        </div>

        {/* Verified Seller Badge - Top Right */}
        {listing.sellerId?.isVerifiedSeller && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            VERIFIED
          </div>
        )}
      </div>

      {/* Content - Fast Decision Support */}
      <div className="p-4">
        {/* Manufacturer + Model (Primary identifier) */}
        <h3 className="text-body-md font-semibold text-navy-900 group-hover:text-rail-orange transition-colors line-clamp-2 mb-1">
          {equipmentTitle}
        </h3>

        {/* Year Built + Quantity Row */}
        <div className="flex items-center gap-3 mb-2 text-caption text-text-secondary">
          {listing.equipment?.yearBuilt && (
            <span>Built {listing.equipment.yearBuilt}</span>
          )}
          {listing.quantity && listing.quantity > 1 && (
            <span className="font-medium text-navy-900">
              Qty: {listing.quantity}
            </span>
          )}
        </div>

        {/* Price */}
        <p className="text-heading-sm font-bold text-rail-orange mb-2">
          {formatPrice(listing.price)}
        </p>

        {/* Location */}
        <div className="flex items-center text-caption text-text-secondary">
          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {listing.location.city}, {listing.location.state}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="heading-md mb-2">No listings found</h3>
      <p className="text-body-md text-text-secondary max-w-md">
        {hasFilters
          ? 'Try adjusting your filters or search terms to find more listings.'
          : 'Be the first to list your equipment on The Rail Exchange.'}
      </p>
      {!hasFilters && (
        <Link href="/listings/create" className="btn-primary mt-6">
          Create Listing
        </Link>
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  pages,
  searchParams,
}: {
  currentPage: number;
  pages: number;
  searchParams: SearchParams;
}) {
  if (pages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.condition) params.set('condition', searchParams.condition);
    if (searchParams.state) params.set('state', searchParams.state);
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
    params.set('page', page.toString());
    return `/listings?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
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
          href={buildUrl(currentPage + 1)}
          className="px-4 py-2 bg-white border border-surface-border rounded-lg text-body-sm font-medium text-navy-900 hover:bg-surface-secondary transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}

async function ListingsGrid({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const result = await getListings(params);
  const { listings, total, pages, currentPage } = result;
  const noDatabase = 'noDatabase' in result && result.noDatabase;
  const hasFilters = !!(params.category || params.condition || params.state || params.search || params.minPrice || params.maxPrice);

  return (
    <>
      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-body-md text-text-secondary">
          {total > 0 ? (
            <>
              Showing <span className="font-semibold text-navy-900">{listings.length}</span> of{' '}
              <span className="font-semibold text-navy-900">{total}</span> listing{total !== 1 ? 's' : ''}
            </>
          ) : noDatabase ? (
            'Connect database to see listings'
          ) : (
            'No listings found'
          )}
        </p>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))
        ) : !noDatabase ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <EmptyState hasFilters={hasFilters} />
        )}
      </div>

      <Pagination currentPage={currentPage} pages={pages} searchParams={params} />
    </>
  );
}

export default async function ListingsPage({
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
              <Link href="/listings/create" className="btn-primary py-2 px-4">
                List Your Equipment
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary">
        {/* Hero */}
        <section className="bg-navy-900 text-white py-12">
          <div className="container-rail">
            <div className="max-w-3xl">
              <h1 className="text-display-sm font-bold mb-4">
                Rail Equipment Marketplace
              </h1>
              <p className="text-heading-sm text-white/80">
                Browse locomotives, rolling stock, track materials, and more from trusted sellers.
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b border-surface-border py-6">
          <div className="container-rail">
            <form className="space-y-4">
              {/* Search */}
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
                  placeholder="Search listings..."
                  defaultValue={params.search || ''}
                  className="form-input pl-12 w-full"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-4">
                {/* Category */}
                <select
                  name="category"
                  defaultValue={params.category || ''}
                  className="form-input min-w-[180px]"
                >
                  <option value="">All Categories</option>
                  {LISTING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>

                {/* Condition */}
                <select
                  name="condition"
                  defaultValue={params.condition || ''}
                  className="form-input min-w-[180px]"
                >
                  <option value="">All Conditions</option>
                  {LISTING_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {CONDITION_LABELS[cond] || cond}
                    </option>
                  ))}
                </select>

                {/* State */}
                <select
                  name="state"
                  defaultValue={params.state || ''}
                  className="form-input min-w-[180px]"
                >
                  <option value="">All States</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                {/* Price Range */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Min $"
                    defaultValue={params.minPrice || ''}
                    className="form-input w-28"
                    min="0"
                  />
                  <span className="text-text-tertiary">—</span>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max $"
                    defaultValue={params.maxPrice || ''}
                    className="form-input w-28"
                    min="0"
                  />
                </div>

                {/* Sort */}
                <select
                  name="sortBy"
                  defaultValue={params.sortBy || 'newest'}
                  className="form-input min-w-[160px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>

                <button type="submit" className="btn-primary py-3 px-6">
                  Search
                </button>

                {(params.search || params.category || params.condition || params.state || params.minPrice || params.maxPrice) && (
                  <Link
                    href="/listings"
                    className="btn-outline py-3 px-6"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Category Pills */}
        <section className="bg-white border-b border-surface-border py-4">
          <div className="container-rail">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Link
                href="/listings"
                className={`flex-shrink-0 px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
                  !params.category
                    ? 'bg-rail-orange text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-navy-100'
                }`}
              >
                All
              </Link>
              {LISTING_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/listings?category=${cat}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
                    params.category === cat
                      ? 'bg-rail-orange text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-navy-100'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="py-8">
          <div className="container-rail">
            <Suspense
              fallback={
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-navy-100" />
                      <div className="p-4">
                        <div className="h-4 bg-navy-100 rounded w-1/3 mb-2" />
                        <div className="h-5 bg-navy-100 rounded w-full mb-2" />
                        <div className="h-6 bg-navy-100 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-navy-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <ListingsGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white border-t border-surface-border py-16">
          <div className="container-rail text-center">
            <h2 className="heading-xl mb-4">Have equipment to sell?</h2>
            <p className="text-body-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              List your rail equipment on The Rail Exchange and reach thousands of qualified buyers.
            </p>
            <Link href="/listings/create" className="btn-primary btn-lg">
              Create a Listing
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
        </div>
      </footer>
    </>
  );
}
