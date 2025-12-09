/**
 * THE RAIL EXCHANGE™ — Marketplace Category Client
 * 
 * Client component for the category page with filtering and listings grid.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListingCard, FeaturedListingPromoCard } from '@/components/cards';
import { FilterBar } from '@/components/search';

interface Category {
  title: string;
  description: string;
  subcategories: string[];
}

interface Listing {
  _id: string;
  title: string;
  price: number | { amount?: number; currency?: string; negotiable?: boolean };
  condition: string;
  location: string | { city?: string; state?: string; country?: string };
  images: Array<string | { url: string; alt?: string; isPrimary?: boolean }>;
  category: string;
  subcategory?: string;
  createdAt: string;
  seller: {
    _id: string;
    name: string;
    verified?: boolean;
  };
}

interface MarketplaceCategoryClientProps {
  slug: string;
  category: Category;
}

export default function MarketplaceCategoryClient({
  slug,
  category,
}: MarketplaceCategoryClientProps) {
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('newest');
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string | null>(null);
  const [priceRange, setPriceRange] = React.useState<{ min?: number; max?: number }>({});
  const [condition, setCondition] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  React.useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          category: slug,
          sort: sortBy,
          page: page.toString(),
          limit: '12',
        });

        if (selectedSubcategory) {
          params.set('subcategory', selectedSubcategory);
        }
        if (priceRange.min) {
          params.set('minPrice', priceRange.min.toString());
        }
        if (priceRange.max) {
          params.set('maxPrice', priceRange.max.toString());
        }
        if (condition) {
          params.set('condition', condition);
        }

        const response = await fetch(`/api/listings?${params}`);
        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || []);
          setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [slug, sortBy, selectedSubcategory, priceRange, condition, page]);

  const handleFilterChange = (filters: {
    priceRange?: { min?: number; max?: number };
    condition?: string;
  }) => {
    if (filters.priceRange) {
      setPriceRange(filters.priceRange);
    }
    if (filters.condition !== undefined) {
      setCondition(filters.condition || null);
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedSubcategory(null);
    setPriceRange({});
    setCondition(null);
    setPage(1);
  };

  const activeFilterCount = [
    selectedSubcategory,
    priceRange.min || priceRange.max,
    condition,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/listings" className="hover:text-white">Marketplace</Link>
            <span>/</span>
            <span className="text-white">{category.title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{category.title}</h1>
          <p className="text-lg text-white/80 max-w-2xl">{category.description}</p>
        </div>
      </div>

      {/* Subcategory Navigation */}
      <div className="bg-white border-b border-border-default sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto">
            <button
              onClick={() => {
                setSelectedSubcategory(null);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedSubcategory
                  ? 'bg-rail-orange text-white'
                  : 'bg-surface-secondary text-navy-900 hover:bg-surface-tertiary'
              }`}
            >
              All {category.title}
            </button>
            {category.subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubcategory(sub);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSubcategory === sub
                    ? 'bg-rail-orange text-white'
                    : 'bg-surface-secondary text-navy-900 hover:bg-surface-tertiary'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-border-default p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-rail-orange hover:text-rail-orange-dark"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FilterBar
                variant="vertical"
                onFilterChange={handleFilterChange}
                initialFilters={{
                  priceRange,
                  condition: condition || undefined,
                }}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <p className="text-text-secondary">
                  {loading ? 'Loading...' : `${listings.length} listings found`}
                </p>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setPage(1); }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-border-default overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-surface-secondary" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-surface-secondary rounded w-3/4" />
                      <div className="h-6 bg-surface-secondary rounded w-1/2" />
                      <div className="h-3 bg-surface-secondary rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <FeaturedListingPromoCard />
                <FeaturedListingPromoCard />
                <FeaturedListingPromoCard />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Featured Promo Card always first */}
                  <FeaturedListingPromoCard />
                  {listings.map((listing) => {
                    // Handle different image formats
                    const firstImage = listing.images?.[0];
                    const imageUrl = typeof firstImage === 'string' 
                      ? firstImage 
                      : firstImage?.url;
                    
                    // Handle different price formats
                    const priceValue = typeof listing.price === 'number'
                      ? listing.price
                      : listing.price?.amount || 0;

                    return (
                      <ListingCard
                        key={listing._id}
                        id={listing._id}
                        title={listing.title}
                        price={priceValue}
                        condition={listing.condition}
                        location={listing.location}
                        image={imageUrl}
                        category={listing.category}
                        seller={listing.seller?.name}
                        verified={listing.seller?.verified}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={page === pageNum ? 'bg-rail-orange hover:bg-rail-orange-dark' : ''}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-text-tertiary">...</span>
                        <Button
                          variant={page === totalPages ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(totalPages)}
                          className={page === totalPages ? 'bg-rail-orange hover:bg-rail-orange-dark' : ''}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
