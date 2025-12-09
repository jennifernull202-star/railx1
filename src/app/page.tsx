/**
 * THE RAIL EXCHANGE™ — Premium Homepage
 * 
 * 10/10 Quality Benchmark - AutoTrader-grade design
 * with Premium Design System refinements.
 */

import Link from "next/link";
import Image from "next/image";
import HeroSearch from "@/components/HeroSearch";
import { FeaturedListingPromoCard } from "@/components/cards";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import ContractorProfile from "@/models/ContractorProfile";
import { EQUIPMENT_TYPES } from "@/lib/constants";

interface FeaturedListing {
  _id: string;
  title: string;
  slug: string;
  category: string;
  condition: string;
  price: {
    type: string;
    amount?: number;
    currency: string;
  };
  images: Array<{ url: string; alt: string }>;
  location: {
    city?: string;
    state?: string;
  };
  premiumAddOns?: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
  };
}

async function getHomeData() {
  try {
    await connectDB();
    
    // Priority: Elite > Premium > Featured > Recent
    // Get elite listings first (homepage highlight)
    const eliteListings = await Listing.find({
      status: 'active',
      'premiumAddOns.elite.active': true,
      $or: [
        { 'premiumAddOns.elite.expiresAt': { $gt: new Date() } },
        { 'premiumAddOns.elite.expiresAt': null },
      ],
    })
      .select('title slug category condition price images location premiumAddOns')
      .sort({ 'premiumAddOns.elite.purchasedAt': -1 })
      .limit(6)
      .lean();

    // Get premium listings if not enough elite
    let premiumListings: typeof eliteListings = [];
    if (eliteListings.length < 6) {
      premiumListings = await Listing.find({
        status: 'active',
        'premiumAddOns.premium.active': true,
        _id: { $nin: eliteListings.map(l => l._id) },
        $or: [
          { 'premiumAddOns.premium.expiresAt': { $gt: new Date() } },
          { 'premiumAddOns.premium.expiresAt': null },
        ],
      })
        .select('title slug category condition price images location premiumAddOns')
        .sort({ 'premiumAddOns.premium.purchasedAt': -1 })
        .limit(6 - eliteListings.length)
        .lean();
    }

    // Get featured listings if still not enough
    let featuredListings: typeof eliteListings = [];
    const existingIds = [...eliteListings, ...premiumListings].map(l => l._id);
    if (existingIds.length < 6) {
      featuredListings = await Listing.find({
        status: 'active',
        'premiumAddOns.featured.active': true,
        _id: { $nin: existingIds },
        $or: [
          { 'premiumAddOns.featured.expiresAt': { $gt: new Date() } },
          { 'premiumAddOns.featured.expiresAt': null },
        ],
      })
        .select('title slug category condition price images location premiumAddOns')
        .sort({ 'premiumAddOns.featured.purchasedAt': -1 })
        .limit(6 - existingIds.length)
        .lean();
    }

    // Combine and sort: elite first, then premium, then featured
    let listings = [...eliteListings, ...premiumListings, ...featuredListings];

    // If still no listings, get recent active listings
    if (listings.length === 0) {
      listings = await Listing.find({ status: 'active' })
        .select('title slug category condition price images location premiumAddOns')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
    }

    const [listingCount, contractorCount] = await Promise.all([
      Listing.countDocuments({ status: 'active' }),
      ContractorProfile.countDocuments({ verificationStatus: 'verified' }),
    ]);
    
    return { 
      listingCount, 
      contractorCount,
      featuredListings: listings as unknown as FeaturedListing[],
    };
  } catch {
    return { listingCount: 0, contractorCount: 0, featuredListings: [] };
  }
}

function getCategoryLabel(value: string): string {
  const category = EQUIPMENT_TYPES.find(t => t.value === value);
  return category?.label || value;
}

function formatPrice(price: FeaturedListing['price']): string {
  if (price.type === 'contact') return 'Contact for Price';
  if (price.type === 'auction') return 'Auction';
  if (!price.amount) return 'Contact for Price';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

export default async function HomePage() {
  const { listingCount, contractorCount, featuredListings } = await getHomeData();

  return (
    <>
      {/* Navigation - Premium Glass Effect */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-100">
        <nav className="container-rail">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-[22px] font-bold text-navy-900 tracking-tight">
                The Rail
              </span>
              <span className="text-[22px] font-bold text-rail-orange tracking-tight">
                Exchange
              </span>
              <span className="text-rail-orange text-[11px] font-semibold -mt-2">™</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <Link
                href="/listings"
                className="text-[15px] font-medium text-slate-600 hover:text-navy-900 transition-colors duration-200"
              >
                Marketplace
              </Link>
              <Link
                href="/contractors"
                className="text-[15px] font-medium text-slate-600 hover:text-navy-900 transition-colors duration-200"
              >
                Contractors
              </Link>
              <Link
                href="/search"
                className="text-[15px] font-medium text-slate-600 hover:text-navy-900 transition-colors duration-200"
              >
                Search
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-5">
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex text-[15px] font-medium text-navy-900 hover:text-rail-orange transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="inline-flex items-center justify-center h-10 px-5 bg-rail-orange text-white text-[14px] font-semibold rounded-[10px] shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section - Premium Gradient */}
        <section className="relative bg-gradient-to-b from-slate-50/80 via-white to-white overflow-hidden">
          <div className="container-rail max-w-[1280px] mx-auto px-6 md:px-8 py-14 md:py-20 lg:py-24">
            <div className="max-w-4xl mx-auto text-center">
              
              {/* Premium Badge - Tighter, Refined */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rail-orange/8 border border-rail-orange/20 rounded-full mb-10">
                <span className="w-1.5 h-1.5 bg-rail-orange rounded-full animate-pulse" />
                <span className="text-[13px] font-semibold text-rail-orange tracking-wide">
                  #1 Rail Industry Marketplace
                </span>
              </div>

              {/* Headline - Premium Spacing */}
              <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-bold text-navy-900 leading-[1.1] tracking-tight mb-7">
                Buy, Sell & Connect in the{" "}
                <span className="text-rail-orange">Rail Industry</span>
              </h1>

              {/* Subheadline */}
              <p className="text-[17px] md:text-[19px] text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
                The premium marketplace for rail equipment, materials, services, and
                verified contractors. Trusted by industry professionals nationwide.
              </p>

              {/* Search Module - Perfectly Centered */}
              <div className="max-w-3xl mx-auto px-4 md:px-0">
                <HeroSearch />
              </div>

              {/* Stats Container - Premium Cards */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-14">
                <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <p className="text-[28px] md:text-[32px] font-bold text-navy-900 tracking-tight">
                    {listingCount > 0 ? listingCount.toLocaleString() : '—'}
                  </p>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">Active Listings</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <p className="text-[28px] md:text-[32px] font-bold text-navy-900 tracking-tight">
                    {contractorCount > 0 ? contractorCount.toLocaleString() : '—'}
                  </p>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">Verified Contractors</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <p className="text-[28px] md:text-[32px] font-bold text-navy-900 tracking-tight">50</p>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">States Covered</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Background Accents */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rail-orange/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-slate-100/50 to-transparent pointer-events-none" />
        </section>

        {/* Section Separator */}
        <div className="border-t border-slate-200 mx-auto max-w-[1280px] px-6 md:px-8" />

        {/* Category Section - Premium Refinements */}
        <section className="pt-14 pb-12 bg-white">
          <div className="container-rail max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[28px] md:text-[32px] font-bold text-navy-900 tracking-tight mb-4">
                Browse by Category
              </h2>
              <p className="text-[16px] text-slate-500 max-w-xl mx-auto">
                Find exactly what you need across our comprehensive marketplace
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
              {/* Equipment Tile */}
              <Link
                href="/listings?category=locomotives"
                className="group bg-white rounded-2xl p-7 md:p-8 text-center border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-rail-orange/8 rounded-xl flex items-center justify-center group-hover:bg-rail-orange/12 transition-colors duration-300">
                  <svg className="w-7 h-7 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-navy-900 mb-1.5 group-hover:text-rail-orange transition-colors duration-200">
                  Equipment
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Locomotives, rail cars & machinery
                </p>
              </Link>

              {/* Materials Tile */}
              <Link
                href="/listings?category=track-materials"
                className="group bg-white rounded-2xl p-7 md:p-8 text-center border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-navy-900/6 rounded-xl flex items-center justify-center group-hover:bg-navy-900/10 transition-colors duration-300">
                  <svg className="w-7 h-7 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-navy-900 mb-1.5 group-hover:text-rail-orange transition-colors duration-200">
                  Materials
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Rails, ties & infrastructure
                </p>
              </Link>

              {/* Services Tile */}
              <Link
                href="/listings?category=services"
                className="group bg-white rounded-2xl p-7 md:p-8 text-center border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-emerald-500/8 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/12 transition-colors duration-300">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-navy-900 mb-1.5 group-hover:text-rail-orange transition-colors duration-200">
                  Services
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Maintenance & consulting
                </p>
              </Link>

              {/* Contractors Tile */}
              <Link
                href="/contractors"
                className="group bg-white rounded-2xl p-7 md:p-8 text-center border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-blue-500/8 rounded-xl flex items-center justify-center group-hover:bg-blue-500/12 transition-colors duration-300">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-navy-900 mb-1.5 group-hover:text-rail-orange transition-colors duration-200">
                  Contractors
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Verified rail professionals
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Section Separator */}
        <div className="border-t border-slate-200 mx-auto max-w-[1280px] px-6 md:px-8" />

        {/* Featured Listings - Dynamic */}
        <section className="pt-14 pb-12 bg-gradient-to-b from-slate-50/60 to-white">
          <div className="container-rail max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-[28px] md:text-[32px] font-bold text-navy-900 tracking-tight mb-2">
                  Featured Listings
                </h2>
                <p className="text-[15px] text-slate-500">Premium equipment from verified sellers</p>
              </div>
              <Link
                href="/listings?featured=true"
                className="hidden md:inline-flex items-center gap-2 text-[14px] font-semibold text-navy-900 hover:text-rail-orange transition-colors duration-200"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {featuredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
                {featuredListings.slice(0, 3).map((listing) => (
                  <Link 
                    key={listing._id} 
                    href={`/listings/${listing.slug}`}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                      {listing.images?.[0]?.url ? (
                        <Image
                          src={listing.images[0].url}
                          alt={listing.images[0].alt || listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {listing.premiumAddOns?.elite?.active && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] font-semibold rounded-full shadow-sm">
                            Elite
                          </span>
                        )}
                        {listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
                          <span className="px-2.5 py-1 bg-purple-600 text-white text-[11px] font-semibold rounded-full shadow-sm">
                            Premium
                          </span>
                        )}
                        {listing.premiumAddOns?.featured?.active && !listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
                          <span className="px-2.5 py-1 bg-rail-orange text-white text-[11px] font-semibold rounded-full shadow-sm">
                            Featured
                          </span>
                        )}
                        {!listing.premiumAddOns?.featured?.active && !listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
                          <span className="px-2.5 py-1 bg-rail-orange text-white text-[11px] font-semibold rounded-full shadow-sm">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full">
                          {getCategoryLabel(listing.category)}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full capitalize">
                          {listing.condition}
                        </span>
                      </div>
                      <h3 className="text-[16px] font-semibold text-navy-900 mb-2 line-clamp-2 group-hover:text-rail-orange transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[18px] font-bold text-navy-900">
                          {formatPrice(listing.price)}
                        </p>
                        {(listing.location?.city || listing.location?.state) && (
                          <p className="text-[13px] text-slate-500">
                            {[listing.location.city, listing.location.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Elite Placement Promo Card */}
                <FeaturedListingPromoCard />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Elite Placement Promo Card - Left Position */}
                <FeaturedListingPromoCard className="max-w-sm" />
                
                {/* Empty State Message */}
                <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-[20px] font-bold text-navy-900 mb-3">Be the First Seller</h3>
                  <p className="text-[15px] text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                    No equipment has been listed yet. Be the first to showcase your rail equipment, materials, or services on The Rail Exchange marketplace.
                  </p>
                  <Link
                    href="/listings/create"
                    className="inline-flex items-center justify-center h-11 px-6 bg-rail-orange text-white text-[14px] font-semibold rounded-xl hover:bg-[#e55f15] transition-colors"
                  >
                    Create a Listing
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section Separator */}
        <div className="border-t border-slate-200 mx-auto max-w-[1280px] px-6 md:px-8" />

        {/* Contractor Directory Preview - Premium */}
        <section className="pt-10 md:pt-12 pb-14 md:pb-16 bg-white">
          <div className="container-rail max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded-full mb-6">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[12px] font-semibold text-emerald-700">Verified Professionals</span>
                </div>

                <h2 className="text-[32px] md:text-[40px] font-bold text-navy-900 leading-[1.15] tracking-tight mb-6">
                  Find Trusted Rail Contractors
                </h2>
                
                <p className="text-[16px] md:text-[17px] text-slate-500 leading-relaxed mb-10">
                  Connect with verified contractors across the nation. Search by service type,
                  region, and specialization to find the perfect partner for your rail project.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/contractors" 
                    className="inline-flex items-center justify-center h-12 px-7 bg-rail-orange text-white text-[15px] font-semibold rounded-xl shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
                  >
                    Browse Contractors
                  </Link>
                  <Link 
                    href="/contractors/onboard" 
                    className="inline-flex items-center justify-center h-12 px-7 bg-white border-2 border-navy-900 text-navy-900 text-[15px] font-semibold rounded-xl hover:bg-navy-900 hover:text-white transition-all duration-200"
                  >
                    Join as Contractor
                  </Link>
                </div>
              </div>

              {/* Map Placeholder - Premium Styling */}
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl overflow-hidden border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-[14px] text-slate-400 font-medium">
                        Interactive Map Coming Soon
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Stats Badge - Refined */}
                <div className="absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[18px] font-bold text-navy-900 leading-none">
                        {contractorCount > 0 ? contractorCount.toLocaleString() : '—'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Verified Contractors</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Add-Ons Section - Premium Dark */}
        <section className="py-14 md:py-16 lg:py-20 bg-[#0d1f35]">
          <div className="container-rail max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight mb-4">
                Boost Your Visibility
              </h2>
              <p className="text-[16px] text-white/60 max-w-2xl mx-auto">
                Premium add-ons to help your listings and profile stand out from the competition
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 md:gap-6 mb-10">
              {/* Featured - $20/30 days */}
              <div className="bg-white/[0.06] backdrop-blur rounded-2xl p-7 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-rail-orange/40 transition-all duration-300">
                <div className="w-11 h-11 bg-rail-orange/15 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-2">Featured Listing</h3>
                <p className="text-[14px] text-white/50 mb-5 leading-relaxed">
                  Boost your listing in search results with priority placement and a featured badge.
                </p>
                <p className="text-[22px] font-bold text-rail-orange">$20<span className="text-[14px] font-medium text-white/40">/30 days</span></p>
              </div>

              {/* Premium - $50/30 days - Popular */}
              <div className="bg-white/[0.06] backdrop-blur rounded-2xl p-7 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-rail-orange/40 transition-all duration-300 relative">
                <div className="absolute -top-2.5 right-5 bg-rail-orange text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                  POPULAR
                </div>
                <div className="w-11 h-11 bg-purple-500/15 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-2">Premium Placement</h3>
                <p className="text-[14px] text-white/50 mb-5 leading-relaxed">
                  Pin your listing to category pages with enhanced visibility and premium badge.
                </p>
                <p className="text-[22px] font-bold text-purple-400">$50<span className="text-[14px] font-medium text-white/40">/30 days</span></p>
              </div>

              {/* Elite - $99/30 days */}
              <div className="bg-white/[0.06] backdrop-blur rounded-2xl p-7 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-amber-500/40 transition-all duration-300">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-2">Elite Placement</h3>
                <p className="text-[14px] text-white/50 mb-5 leading-relaxed">
                  Homepage spotlight, category pins, and maximum visibility across the platform.
                </p>
                <p className="text-[22px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">$99<span className="text-[14px] font-medium text-white/40">/30 days</span></p>
              </div>
            </div>

            {/* Additional Add-Ons Row */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3.5 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.5 3a1.5 1.5 0 100 3h.5a.5.5 0 01.5.5v.5a1.5 1.5 0 003 0V6a1 1 0 00-1-1h-.5a1.5 1.5 0 01-1.5-1.5V3zm-5 0A1.5 1.5 0 017 4.5V5a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3H6a.5.5 0 01.5.5v.5a1.5 1.5 0 003 0V9.5a.5.5 0 01.5-.5h.5a1.5 1.5 0 000-3H10a1 1 0 01-1-1v-.5A1.5 1.5 0 008.5 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white">AI Enhancement</h4>
                  <p className="text-[12px] text-white/40">$10 — Optimized listing content</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                <div className="w-9 h-9 bg-slate-500/15 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white">Spec Sheet</h4>
                  <p className="text-[12px] text-white/40">$25 — Auto-generated PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                <div className="w-9 h-9 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white">Verified Badge</h4>
                  <p className="text-[12px] text-white/40">$149/year — Build trust instantly</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Separator */}
        <div className="border-t border-slate-200 mx-auto max-w-[1280px] px-6 md:px-8" />

        {/* CTA Section - Premium */}
        <section className="py-14 md:py-16 lg:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8 text-center">
            <h2 className="text-[32px] md:text-[40px] font-bold text-navy-900 tracking-tight mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-[16px] md:text-[17px] text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
              Join thousands of rail industry professionals already using The Rail Exchange
              to buy, sell, and connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center justify-center h-14 px-10 bg-rail-orange text-white text-[16px] font-semibold rounded-xl shadow-md hover:bg-[#e55f15] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Create Free Account
              </Link>
              <Link 
                href="/listings" 
                className="inline-flex items-center justify-center h-14 px-10 bg-white border-2 border-navy-900 text-navy-900 text-[16px] font-semibold rounded-xl hover:bg-navy-900 hover:text-white transition-all duration-200"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Premium Refinements */}
      <footer className="bg-[#0a1825] text-white pt-16 pb-8">
        <div className="container-rail">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 pb-12 border-b border-white/[0.08]">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center mb-5">
                <span className="text-[18px] font-bold text-white">The Rail</span>
                <span className="text-[18px] font-bold text-rail-orange ml-1">Exchange</span>
                <span className="text-rail-orange text-[10px] font-medium ml-0.5">™</span>
              </Link>
              <p className="text-[13px] text-white/50 leading-relaxed mb-6 max-w-[240px]">
                The premier marketplace for the rail industry. Buy, sell, and connect with
                verified professionals.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a href="#" className="text-white/40 hover:text-white transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="#" className="text-white/40 hover:text-white transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="text-white/40 hover:text-white transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Marketplace Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider mb-4">Marketplace</h4>
              <ul className="space-y-2.5">
                <li><Link href="/listings" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Browse All</Link></li>
                <li><Link href="/listings?category=locomotives" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Equipment</Link></li>
                <li><Link href="/listings?category=track-materials" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Materials</Link></li>
                <li><Link href="/listings?category=services" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Services</Link></li>
              </ul>
            </div>

            {/* Contractors Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider mb-4">Contractors</h4>
              <ul className="space-y-2.5">
                <li><Link href="/contractors" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Find Contractors</Link></li>
                <li><Link href="/contractors/onboard" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Join as Contractor</Link></li>
                <li><Link href="/contractors?verified=true" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Verified Only</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">About Us</Link></li>
                <li><Link href="/contact" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Contact</Link></li>
                <li><Link href="/privacy" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-[13px] text-white/50 hover:text-white transition-colors leading-relaxed">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/40">
              © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
            </p>
            <p className="text-[12px] text-white/30">
              Made with precision for the rail industry.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
