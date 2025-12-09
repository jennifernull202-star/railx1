/**
 * THE RAIL EXCHANGE™ — Marketplace Landing Page
 * 
 * Main marketplace entry point with category tiles and featured listings.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { CategoryTile, FeaturedListingPromoCard } from '@/components/cards';

export const metadata: Metadata = {
  title: 'Railroad Equipment Marketplace | THE RAIL EXCHANGE™',
  description: 'Browse locomotives, railcars, track materials, MOW equipment, and more. The largest marketplace for railroad equipment and materials.',
};

const CATEGORIES = [
  {
    slug: 'locomotives',
    title: 'Locomotives',
    description: 'Diesel, electric, and steam locomotives',
    icon: '🚂',
    count: 0, // Will be populated dynamically
  },
  {
    slug: 'railcars',
    title: 'Railcars',
    description: 'Freight cars, tank cars, and specialty cars',
    icon: '🚃',
    count: 0,
  },
  {
    slug: 'track-materials',
    title: 'Track Materials',
    description: 'Rails, ties, switches, and components',
    icon: '🛤️',
    count: 0,
  },
  {
    slug: 'mow',
    title: 'MOW Equipment',
    description: 'Maintenance of Way machinery',
    icon: '🔧',
    count: 0,
  },
  {
    slug: 'signals',
    title: 'Signal Systems',
    description: 'Signals, detection, and PTC equipment',
    icon: '🚦',
    count: 0,
  },
  {
    slug: 'parts',
    title: 'Parts & Components',
    description: 'Trucks, couplers, brakes, and more',
    icon: '⚙️',
    count: 0,
  },
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero Section */}
      <div className="bg-navy-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Railroad Equipment Marketplace
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mb-8">
            The premier destination for buying and selling railroad equipment, materials, and parts.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/listings/create"
              className="inline-flex items-center px-6 py-3 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Sell Equipment
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Advanced Search
            </Link>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-navy-900">Browse by Category</h2>
          <Link
            href="/listings"
            className="text-rail-orange hover:text-rail-orange-dark font-medium flex items-center gap-1"
          >
            View All Listings
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((category) => (
            <CategoryTile
              key={category.slug}
              title={category.title}
              description={category.description}
              icon={category.icon}
              href={`/marketplace/category/${category.slug}`}
              listingCount={category.count}
            />
          ))}
        </div>
      </div>

      {/* Featured Section */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-navy-900">Featured Listings</h2>
            <Link
              href="/pricing"
              className="text-rail-orange hover:text-rail-orange-dark font-medium flex items-center gap-1"
            >
              Get Featured
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Featured Promo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeaturedListingPromoCard />
            <FeaturedListingPromoCard />
            <FeaturedListingPromoCard />
            <FeaturedListingPromoCard />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy-900 text-center mb-8">
          Why Choose THE RAIL EXCHANGE™?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rail-orange/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">Verified Sellers</h3>
            <p className="text-text-secondary">
              Every seller goes through verification to ensure safe, legitimate transactions.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rail-orange/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">Industry-Specific</h3>
            <p className="text-text-secondary">
              Built specifically for railroad professionals with equipment categories that make sense.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rail-orange/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">Connected Community</h3>
            <p className="text-text-secondary">
              Direct messaging with sellers and access to verified contractors nationwide.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-navy-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Sell Your Equipment?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            List your railroad equipment in minutes. Reach thousands of qualified buyers across the industry.
          </p>
          <Link
            href="/listings/create"
            className="inline-flex items-center px-8 py-4 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark transition-colors text-lg"
          >
            Create Free Listing
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
