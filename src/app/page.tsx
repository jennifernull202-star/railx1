/**
 * THE RAIL EXCHANGE™ — Amazon-Style Homepage
 * 
 * Premium retail marketplace homepage with high information density,
 * modular blocks, and Amazon-inspired design patterns.
 */

import SiteHeader from "@/components/SiteHeader";
import {
  HeroBanner,
  CategoryGrid,
  FeaturedCarousel,
  UseCaseBlocks,
  ContractorSlider,
  SpotlightBlocks,
  DenseFooter,
} from "@/components/homepage";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import ContractorProfile from "@/models/ContractorProfile";

interface ListingData {
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
  images: Array<{ url: string; alt?: string }>;
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

interface ContractorData {
  _id: string;
  businessName: string;
  logo?: string;
  services: string[];
  address?: {
    city?: string;
    state?: string;
  };
  verificationStatus?: string;
  rating?: number;
  reviewCount?: number;
}

async function getHomeData() {
  try {
    await connectDB();

    // Featured listings - Elite > Premium > Featured > Recent
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
      .limit(8)
      .lean();

    let premiumListings: typeof eliteListings = [];
    if (eliteListings.length < 8) {
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
        .limit(8 - eliteListings.length)
        .lean();
    }

    let featuredListings: typeof eliteListings = [];
    const existingIds = [...eliteListings, ...premiumListings].map(l => l._id);
    if (existingIds.length < 8) {
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
        .limit(8 - existingIds.length)
        .lean();
    }

    let allFeatured = [...eliteListings, ...premiumListings, ...featuredListings];

    // If no premium listings, get recent active listings
    if (allFeatured.length === 0) {
      allFeatured = await Listing.find({ status: 'active' })
        .select('title slug category condition price images location premiumAddOns')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
    }

    // Get railcars for spotlight
    const railcars = await Listing.find({
      status: 'active',
      category: { $in: ['railcars', 'freight-cars', 'passenger-cars', 'tank-cars'] },
    })
      .select('title slug category price images location')
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // Get locomotives for spotlight
    const locomotives = await Listing.find({
      status: 'active',
      category: 'locomotives',
    })
      .select('title slug category price images location')
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // Get contractors
    const contractors = await ContractorProfile.find({
      status: 'active',
    })
      .select('businessName logo services address verificationStatus rating reviewCount')
      .sort({ verificationStatus: -1, createdAt: -1 })
      .limit(8)
      .lean();

    return {
      featuredListings: allFeatured as unknown as ListingData[],
      railcars: railcars as unknown as ListingData[],
      locomotives: locomotives as unknown as ListingData[],
      contractors: contractors as unknown as ContractorData[],
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    return {
      featuredListings: [],
      railcars: [],
      locomotives: [],
      contractors: [],
    };
  }
}

export default async function HomePage() {
  const { featuredListings, railcars, locomotives, contractors } = await getHomeData();

  return (
    <>
      {/* Global Header */}
      <SiteHeader showCTA={false} />

      <main className="flex-1">
        {/* Hero Banner with Rotating Slides */}
        <HeroBanner />

        {/* Shop by Category - 4x3 Grid */}
        <CategoryGrid />

        {/* Featured Listings Carousel */}
        <FeaturedCarousel 
          listings={featuredListings} 
          title="Featured Listings"
        />

        {/* Use Case Story Blocks */}
        <UseCaseBlocks />

        {/* Contractor Slider */}
        <ContractorSlider 
          contractors={contractors}
        />

        {/* Spotlight: Railcars & Locomotives */}
        <SpotlightBlocks 
          railcars={railcars}
          locomotives={locomotives}
        />

        {/* CTA Section */}
        <section className="py-14 md:py-20 bg-gradient-to-r from-navy-700 to-navy-600">
          <div className="container-rail max-w-[1440px] mx-auto px-4 md:px-8 text-center">
            <h2 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-[16px] text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of rail industry professionals already using The Rail Exchange
              to buy, sell, and connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center h-14 px-10 bg-rail-orange text-white text-[16px] font-semibold rounded-xl shadow-lg hover:bg-[#e55f15] transition-all"
              >
                Create Free Account
              </a>
              <a
                href="/listings"
                className="inline-flex items-center justify-center h-14 px-10 bg-white/10 backdrop-blur border border-white/20 text-white text-[16px] font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Browse Marketplace
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Dense Amazon-Style Footer */}
      <DenseFooter />
    </>
  );
}
