/**
 * THE RAIL EXCHANGE™ — Premium Homepage
 * 
 * 10/10 Quality Benchmark - AutoTrader-grade design
 * with Premium Design System refinements.
 */

import Link from "next/link";
import Image from "next/image";
import HeroSearch from "@/components/HeroSearch";
import SiteHeader from "@/components/SiteHeader";
import ScrollToTop from "@/components/ScrollToTop";
import { getImageUrl } from "@/lib/utils";
import { FeaturedListingPromoCard } from "@/components/cards";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
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
    
    return { 
      featuredListings: listings as unknown as FeaturedListing[],
    };
  } catch {
    return { featuredListings: [] };
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
  const { featuredListings } = await getHomeData();

  return (
    <>
      {/* Navigation with Mobile Menu */}
      <SiteHeader showCTA={false} />

      <main className="flex-1">
        {/* Hero Section - Premium Gradient Mesh */}
        <section 
          className="relative bg-cover bg-center bg-no-repeat min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh] overflow-hidden pt-16 md:pt-20"
          style={{ backgroundImage: "url('/hero-rail.jpg')" }}
        >
          {/* Dark Overlay with Gradient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-navy-900/90 z-10" />
          <div className="absolute inset-0 z-[11] opacity-30" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(255, 107, 26, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(30, 64, 175, 0.1) 0%, transparent 50%)' }} />
          
          <div className="relative z-20 container-rail max-w-[1280px] mx-auto px-5 md:px-8 py-10 md:py-16 lg:py-20 flex items-center">
            <div className="max-w-4xl mx-auto text-center">
              {/* Headline */}
              <h1 className="relative z-20 text-[32px] md:text-[44px] lg:text-[52px] font-bold text-white leading-[1.1] tracking-tight mb-5">
                The Marketplace Where{" "}
                <span className="text-rail-orange">Rail Professionals</span> Trade
              </h1>

              {/* Subheadline */}
              <p className="relative z-20 text-[16px] md:text-[18px] text-white/90 max-w-2xl mx-auto mb-5 leading-relaxed">
                Buy and sell locomotives, freight cars, track materials, and MOW equipment.
                Connect with document-reviewed contractors nationwide.
              </p>

              {/* Quick Category Pills */}
              <div className="relative z-20 flex flex-wrap justify-center gap-2 mb-6">
                <Link href="/listings?category=locomotives" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/20 transition-colors min-h-[36px]">
                  <span className="text-[13px] font-medium text-white">🚂 Locomotives</span>
                </Link>
                <Link href="/listings?category=freight-cars" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/20 transition-colors min-h-[36px]">
                  <span className="text-[13px] font-medium text-white">🚃 Freight Cars</span>
                </Link>
                <Link href="/listings?category=track-materials" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/20 transition-colors min-h-[36px]">
                  <span className="text-[13px] font-medium text-white">🛤️ Track & Materials</span>
                </Link>
                <Link href="/listings?category=maintenance-of-way" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/20 transition-colors min-h-[36px]">
                  <span className="text-[13px] font-medium text-white">🔧 MOW Equipment</span>
                </Link>
              </div>

              {/* Search Module */}
              <div className="relative z-20 max-w-3xl mx-auto px-2 md:px-0">
                <HeroSearch />
                
                {/* Secondary CTAs */}
                <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
                  <Link 
                    href="/search?view=map" 
                    className="relative z-20 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-navy-900 hover:bg-rail-orange hover:text-white hover:border-rail-orange shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Explore Map</span>
                  </Link>
                  <Link 
                    href="/contractors" 
                    className="relative z-20 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-white/10 backdrop-blur border border-white/20 rounded-xl text-[14px] font-medium text-white hover:bg-white/20 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Find Contractors</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Category Section - Mega Categories */}
        <section className="pt-12 pb-10 bg-white">
          <div className="container-rail max-w-[1280px] mx-auto px-5 md:px-8">
            <div className="text-center mb-10">
              <h2 className="text-[24px] md:text-[28px] font-bold text-navy-900 tracking-tight mb-3">
                Browse Equipment & Services
              </h2>
              <p className="text-[15px] text-slate-500 max-w-lg mx-auto">
                Find rolling stock, track materials, MOW equipment, and verified contractors
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {/* Rolling Stock - Mega Category */}
              <Link
                href="/listings?category=locomotives"
                className="group bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-rail-orange/30 transition-all duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-rail-orange/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🚂</span>
                </div>
                <h3 className="text-[15px] font-semibold text-navy-900 text-center mb-1 group-hover:text-rail-orange transition-colors duration-200">
                  Rolling Stock
                </h3>
                <p className="text-[13px] text-slate-500 text-center leading-snug mb-3">
                  Locomotives • Freight Cars • Passenger
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 group-hover:bg-rail-orange/10 text-slate-600 group-hover:text-rail-orange text-[11px] font-medium rounded-full transition-colors duration-200">
                    Browse All
                  </span>
                </div>
              </Link>

              {/* Track & Infrastructure */}
              <Link
                href="/listings?category=track-materials"
                className="group bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-navy-900/8 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🛤️</span>
                </div>
                <h3 className="text-[15px] font-semibold text-navy-900 text-center mb-1 group-hover:text-rail-orange transition-colors duration-200">
                  Track & Materials
                </h3>
                <p className="text-[13px] text-slate-500 text-center leading-snug mb-3">
                  Rails • Ties • Turnouts • OTM
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 group-hover:bg-navy-900/10 text-slate-600 group-hover:text-navy-900 text-[11px] font-medium rounded-full transition-colors duration-200">
                    Browse All
                  </span>
                </div>
              </Link>

              {/* MOW Equipment */}
              <Link
                href="/listings?category=maintenance-of-way"
                className="group bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🛠️</span>
                </div>
                <h3 className="text-[15px] font-semibold text-navy-900 text-center mb-1 group-hover:text-rail-orange transition-colors duration-200">
                  MOW Equipment
                </h3>
                <p className="text-[13px] text-slate-500 text-center leading-snug mb-3">
                  Tampers • Ballast • Rail Handling
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 group-hover:bg-amber-500/10 text-slate-600 group-hover:text-amber-700 text-[11px] font-medium rounded-full transition-colors duration-200">
                    Browse All
                  </span>
                </div>
              </Link>

              {/* Contractors */}
              <Link
                href="/contractors"
                className="group bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👷</span>
                </div>
                <h3 className="text-[15px] font-semibold text-navy-900 text-center mb-1 group-hover:text-rail-orange transition-colors duration-200">
                  Contractors
                </h3>
                <p className="text-[13px] text-slate-500 text-center leading-snug mb-3">
                  Document-Reviewed • Insured • Nationwide
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 text-[11px] font-medium rounded-full transition-colors duration-200">
                    View All
                  </span>
                </div>
              </Link>
            </div>

            {/* Secondary Categories Row */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/listings?category=parts-components" className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-medium rounded-full transition-colors duration-200">
                Parts & Components
              </Link>
              <Link href="/listings?category=signals-communications" className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-medium rounded-full transition-colors duration-200">
                Signals & Communications
              </Link>
              <Link href="/listings?category=tools-equipment" className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-medium rounded-full transition-colors duration-200">
                Tools & Equipment
              </Link>
              <Link href="/listings" className="inline-flex items-center px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-[13px] font-medium rounded-full transition-colors duration-200">
                View All →
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Listings - Dynamic */}
        <section className="pt-14 pb-12 bg-gradient-to-b from-slate-50/60 to-white">
          <div className="container-rail max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-[28px] md:text-[32px] font-bold text-navy-900 tracking-tight mb-2">
                  Featured Listings
                </h2>
                <p className="text-[15px] text-slate-500">Premium equipment from document-reviewed sellers</p>
                <p className="text-[12px] text-slate-400 mt-1">Featured placement reflects paid visibility options and does not indicate quality, condition, or endorsement.</p>
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
                          src={getImageUrl(listing.images[0].url)}
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
                          <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white text-[11px] font-bold rounded-full shadow-[0_2px_8px_rgba(245,158,11,0.4)] flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Elite
                          </span>
                        )}
                        {listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
                          <span className="px-2.5 py-1 bg-purple-600 text-white text-[11px] font-bold rounded-full shadow-[0_2px_8px_rgba(147,51,234,0.35)]">
                            Premium
                          </span>
                        )}
                        {listing.premiumAddOns?.featured?.active && !listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
                          <span className="px-2.5 py-1 bg-navy-900 text-white text-[11px] font-medium rounded-full border border-white/20">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded">
                          {getCategoryLabel(listing.category)}
                        </span>
                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded capitalize ${
                          listing.condition === 'new' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : listing.condition === 'rebuilt' 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {listing.condition}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-navy-900 mb-3 line-clamp-2 leading-snug group-hover:text-rail-orange transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="text-[17px] font-bold text-navy-900">
                          {formatPrice(listing.price)}
                        </p>
                        {(listing.location?.city || listing.location?.state) && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
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
                  <span className="text-[12px] font-semibold text-emerald-700">Document-Reviewed Contractors</span>
                </div>

                <h2 className="text-[32px] md:text-[40px] font-bold text-navy-900 leading-[1.15] tracking-tight mb-6">
                  Find Rail Contractors
                </h2>
                
                <p className="text-[16px] md:text-[17px] text-slate-500 leading-relaxed mb-10">
                  Connect with contractors who have submitted business documentation for review. 
                  Search by service type, region, and specialization to find partners for your rail project.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/contractors" 
                    className="inline-flex items-center justify-center h-12 px-7 bg-rail-orange text-white text-[15px] font-semibold rounded-xl shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
                  >
                    Find Your Contractor
                  </Link>
                  <Link 
                    href="/dashboard/contractor/profile" 
                    className="inline-flex items-center justify-center h-12 px-7 bg-white border-2 border-navy-900 text-navy-900 text-[15px] font-semibold rounded-xl hover:bg-navy-900 hover:text-white transition-all duration-200"
                  >
                    Join as Contractor — Free
                  </Link>
                </div>
              </div>

              {/* Contractor Stats Card - Replaces problematic map iframe */}
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl overflow-hidden border border-navy-700 shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-6 md:p-8 flex flex-col justify-between">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                  
                  <div className="relative z-10">
                    <h3 className="text-[20px] md:text-[24px] font-bold text-white mb-2">Nationwide Coverage</h3>
                    <p className="text-[14px] text-white/70">Find document-reviewed rail contractors across the USA</p>
                  </div>
                  
                  {/* Features Grid */}
                  <div className="relative z-10 grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium">Document-Reviewed Profiles</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium">Nationwide</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium">Direct Contact</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium">Insurance Documentation</p>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <Link 
                    href="/contractors"
                    className="relative z-10 mt-6 flex items-center justify-center gap-2 w-full px-5 py-3 min-h-[44px] bg-white text-navy-900 font-semibold rounded-xl hover:bg-rail-orange hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Browse Contractor Directory</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-14 md:py-16 lg:py-20 bg-slate-50">
          <div className="max-w-[900px] mx-auto px-5 md:px-8">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-[24px] md:text-[32px] font-bold text-navy-900 tracking-tight mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-[15px] text-slate-500">
                Everything you need to know about buying and selling on The Rail Exchange
              </p>
            </div>

            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">How much does it cost to list equipment?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  Listing equipment on The Rail Exchange is completely free. You can create unlimited listings at no cost. Optional premium add-ons like Featured Placement ($25/30 days), Premium Placement ($50/30 days), and Elite Placement ($99/30 days) are available to boost visibility.
                </div>
              </details>

              {/* FAQ Item 2 */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">How do I become a verified seller?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  {/* S-2.6: Clarified verification description */}
                  Purchase the Verified Seller badge ($149/year) and submit business documents for AI-assisted review. This includes company registration and industry documentation. Verification indicates document submission and review—it does not guarantee ownership, authority to sell, or transaction outcomes.
                </div>
              </details>

              {/* FAQ Item 3 */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">What types of equipment can I list?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  We accept all rail-related equipment: locomotives, freight cars, passenger cars, tank cars, track materials (rail, ties, switches), MOW equipment (hi-rail trucks, tampers, rail grinders), signals, parts, and components. If it&apos;s used in the rail industry, it belongs here.
                </div>
              </details>

              {/* FAQ Item 4 */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">How do payments work?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  The Rail Exchange is a listing and connection platform—we facilitate introductions between buyers and sellers. All transactions, negotiations, and payments happen directly between parties. We never take a commission on sales.
                </div>
              </details>

              {/* FAQ Item 5 */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">Can I list contractor services?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  Yes! Create a free contractor profile to showcase your services—track installation, welding, inspection, signaling, and more. Verified contractors with complete profiles receive project inquiries directly through the platform.
                </div>
              </details>

              {/* S-12.8: FAQ Item 6 - Account requirement explanation */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden" id="faq">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">Why do I need an account to contact sellers or contractors?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  To protect users from spam, fraud, and misuse, all messages are sent through verified accounts. Creating an account is free and required only for direct contact — browsing is always available without signing in.
                </div>
              </details>

              {/* S-13.7: FAQ Item 7 - Trust clarification */}
              <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-navy-900">Does verification mean a seller or contractor is guaranteed?</span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">
                  No. Verification confirms that documents were submitted and reviewed. Buyers and sellers are responsible for conducting their own due diligence before any transaction.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Section - Premium */}
        <section className="py-14 md:py-16 lg:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 text-center">
            <h2 className="text-[28px] md:text-[36px] font-bold text-navy-900 tracking-tight mb-5">
              Ready to Buy or Sell Rail Equipment?
            </h2>
            <p className="text-[16px] md:text-[17px] text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
              List your equipment for free. Connect with buyers and sellers nationwide.
              Join the dedicated marketplace for rail professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/listings/create" 
                className="inline-flex items-center justify-center h-14 px-8 bg-rail-orange text-white text-[16px] font-semibold rounded-xl shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
              >
                List Your Equipment Free
              </Link>
              <Link 
                href="/listings" 
                className="inline-flex items-center justify-center h-14 px-8 bg-white border-2 border-navy-900 text-navy-900 text-[16px] font-semibold rounded-xl hover:bg-navy-900 hover:text-white transition-all duration-200"
              >
                Browse Equipment Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Premium with Mobile Safe Zones */}
      <footer className="w-full bg-[#0a1825] text-white px-5 md:px-6 pt-14 pb-20 md:pb-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between gap-10 pb-10 border-b border-white/[0.08]">
            {/* Brand Column */}
            <div className="flex flex-col gap-3 text-center md:text-left">
              <Link href="/" className="inline-flex items-center justify-center md:justify-start mb-2">
                <span className="text-[18px] font-bold text-white">The Rail</span>
                <span className="text-[18px] font-bold text-rail-orange ml-1">Exchange</span>
                <span className="text-rail-orange text-[10px] font-medium ml-0.5">™</span>
              </Link>
              <p className="text-[14px] text-white/70 leading-relaxed mb-3 max-w-[280px] mx-auto md:mx-0">
                The marketplace where rail professionals trade equipment, materials, and services.
              </p>
              {/* Social Icons */}
              <div className="flex items-center justify-center md:justify-start gap-3">
                <a 
                  href="https://www.linkedin.com/company/the-rail-exchange" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10"
                  aria-label="Follow us on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Marketplace Links */}
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h4 className="text-[13px] font-semibold text-white/90 uppercase tracking-wider mb-2">Marketplace</h4>
              <ul className="space-y-3 md:space-y-2">
                <li><Link href="/listings" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Browse All</Link></li>
                <li><Link href="/listings?category=locomotives" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Rolling Stock</Link></li>
                <li><Link href="/listings?category=track-materials" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Track & Materials</Link></li>
                <li><Link href="/listings?category=maintenance-of-way" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">MOW Equipment</Link></li>
              </ul>
            </div>

            {/* Contractors Links */}
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h4 className="text-[13px] font-semibold text-white/90 uppercase tracking-wider mb-2">Contractors</h4>
              <ul className="space-y-3 md:space-y-2">
                <li><Link href="/contractors" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Find Contractors</Link></li>
                <li><Link href="/dashboard/contractor/profile" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Join as Contractor</Link></li>
                <li><Link href="/contractors?verified=true" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Verified Only</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h4 className="text-[13px] font-semibold text-white/90 uppercase tracking-wider mb-2">Company</h4>
              <ul className="space-y-3 md:space-y-2">
                <li><Link href="/about" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">About Us</Link></li>
                <li><Link href="/contact" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Contact</Link></li>
                <li><Link href="/privacy" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Terms of Service</Link></li>
              </ul>
            </div>

            {/* S-6.6: Marketplace Safety Links */}
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h4 className="text-[13px] font-semibold text-white/90 uppercase tracking-wider mb-2">Marketplace Safety</h4>
              <ul className="space-y-3 md:space-y-2">
                <li><Link href="/terms#reporting" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">How reporting works</Link></li>
                <li><Link href="/terms#buyer-responsibility" className="text-[14px] md:text-[13px] text-white/70 hover:text-white transition-colors leading-relaxed">Buyer responsibility & due diligence</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-[13px] text-white/50 mt-8">
            <p>
              © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
            </p>
            {/* BATCH E-5: No Endorsement Disclosure */}
            <p className="mt-3 text-[11px] text-white/40">
              Presence on The Rail Exchange does not constitute endorsement, recommendation, or certification by the platform.
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
        </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
      </footer>
    </>
  );
}
