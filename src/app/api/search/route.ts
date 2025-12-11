/**
 * THE RAIL EXCHANGE™ — Search API
 * 
 * Advanced search with MongoDB text search, filters, and aggregations.
 * Includes add-on ranking boost for featured/premium/elite listings.
 * 
 * Ranking tiers from config:
 * - Featured = +1 tier (250 points)
 * - Premium = +2 tier (500 points)
 * - Elite = +3 tier (1000 points) - highest, homepage + category
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing, { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/models/Listing';
import ContractorProfile from '@/models/ContractorProfile';
import { ADD_ON_RANKING_BOOST, ADD_ON_TYPES } from '@/config/addons';

// Add-on ranking weights for scoring (based on tier system)
// Each tier = ~250 base points, multiplied by ranking boost from config
const BASE_TIER_POINTS = 250;
const RANKING_WEIGHTS = {
  elite: BASE_TIER_POINTS * ADD_ON_RANKING_BOOST[ADD_ON_TYPES.ELITE],      // +3 tier = 750
  premium: BASE_TIER_POINTS * ADD_ON_RANKING_BOOST[ADD_ON_TYPES.PREMIUM],  // +2 tier = 500
  featured: BASE_TIER_POINTS * ADD_ON_RANKING_BOOST[ADD_ON_TYPES.FEATURED], // +1 tier = 250
  aiEnhanced: 25, // Small bonus for AI-enhanced content
  specSheet: 10,  // Small bonus for having spec sheet
};

interface SearchQuery {
  isActive: boolean;
  status?: string;
  $text?: { $search: string };
  category?: string | { $in: string[] };
  condition?: string | { $in: string[] };
  'location.state'?: string;
  'price.amount'?: { $gte?: number; $lte?: number };
}

/**
 * GET /api/search
 * Unified search across listings and contractors
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, listings, contractors
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const results: {
      listings?: unknown[];
      contractors?: unknown[];
      listingsTotal?: number;
      contractorsTotal?: number;
      suggestions?: string[];
    } = {};

    // Search Listings
    if (type === 'all' || type === 'listings') {
      const listingQuery: SearchQuery = {
        isActive: true,
        status: 'active',
      };

      if (query) {
        listingQuery.$text = { $search: query };
      }

      if (category) {
        const categories = category.split(',').filter(c => 
          LISTING_CATEGORIES.includes(c as typeof LISTING_CATEGORIES[number])
        );
        if (categories.length === 1) {
          listingQuery.category = categories[0];
        } else if (categories.length > 1) {
          listingQuery.category = { $in: categories };
        }
      }

      if (condition) {
        const conditions = condition.split(',').filter(c =>
          LISTING_CONDITIONS.includes(c as typeof LISTING_CONDITIONS[number])
        );
        if (conditions.length === 1) {
          listingQuery.condition = conditions[0];
        } else if (conditions.length > 1) {
          listingQuery.condition = { $in: conditions };
        }
      }

      if (state) {
        listingQuery['location.state'] = state;
      }

      if (minPrice || maxPrice) {
        listingQuery['price.amount'] = {};
        if (minPrice) listingQuery['price.amount'].$gte = parseInt(minPrice);
        if (maxPrice) listingQuery['price.amount'].$lte = parseInt(maxPrice);
      }

      // Build projection for text score if searching
      const projection = query
        ? { score: { $meta: 'textScore' } }
        : {};

      // Build sort - use explicit type to avoid TypeScript issues
      type SortSpec = Record<string, 1 | -1 | { $meta: 'textScore' }>;
      const sort: SortSpec = query
        ? { score: { $meta: 'textScore' }, 'premiumAddOns.featured.active': -1 }
        : { 'premiumAddOns.featured.active': -1, createdAt: -1 };

      const [listings, listingsTotal] = await Promise.all([
        Listing.find(listingQuery, projection)
          .select('title slug category condition primaryImageUrl price location viewCount premiumAddOns createdAt')
          .sort(sort as Record<string, 1 | -1>)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Listing.countDocuments(listingQuery),
      ]);

      // Post-process to add ranking scores and sort by add-on priority
      interface ProcessedListing {
        _id: unknown;
        title?: string;
        slug?: string;
        category?: string;
        condition?: string;
        primaryImageUrl?: string;
        price?: { amount?: number; type?: string };
        location?: { city?: string; state?: string };
        viewCount?: number;
        premiumAddOns?: {
          featured?: { active: boolean; expiresAt?: Date };
          premium?: { active: boolean; expiresAt?: Date };
          elite?: { active: boolean; expiresAt?: Date };
          verifiedBadge?: { active: boolean; expiresAt?: Date };
          aiEnhanced?: boolean;
          specSheet?: boolean;
        };
        createdAt?: Date;
        _rankScore: number;
        _rankTier: 'elite' | 'premium' | 'featured' | 'standard';
        isFeatured: boolean;
        isPremium: boolean;
        isElite: boolean;
        hasVerifiedBadge: boolean;
        isAiEnhanced: boolean;
        hasSpecSheet: boolean;
      }

      const processedListings: ProcessedListing[] = (listings as unknown as Record<string, unknown>[]).map((listing) => {
        let rankScore = 0;
        let rankTier: ProcessedListing['_rankTier'] = 'standard';
        const addOns = listing.premiumAddOns as ProcessedListing['premiumAddOns'];
        const now = new Date();

        // Check Elite tier (highest priority - homepage + category top)
        const eliteActive = addOns?.elite?.active && 
          (!addOns.elite.expiresAt || new Date(addOns.elite.expiresAt) > now);
        if (eliteActive) {
          rankScore += RANKING_WEIGHTS.elite;
          rankTier = 'elite';
        }

        // Check Premium tier (2nd priority - category top)
        const premiumActive = addOns?.premium?.active && 
          (!addOns.premium.expiresAt || new Date(addOns.premium.expiresAt) > now);
        if (premiumActive && rankTier === 'standard') {
          rankScore += RANKING_WEIGHTS.premium;
          rankTier = 'premium';
        }

        // Check Featured tier (3rd priority - boosted visibility)
        const featuredActive = addOns?.featured?.active && 
          (!addOns.featured.expiresAt || new Date(addOns.featured.expiresAt) > now);
        if (featuredActive && rankTier === 'standard') {
          rankScore += RANKING_WEIGHTS.featured;
          rankTier = 'featured';
        }

        // Enhancement bonuses (small additional boost)
        if (addOns?.aiEnhanced) {
          rankScore += RANKING_WEIGHTS.aiEnhanced;
        }
        if (addOns?.specSheet) {
          rankScore += RANKING_WEIGHTS.specSheet;
        }

        // Check Verified Badge status
        const verifiedBadgeActive = addOns?.verifiedBadge?.active && 
          (!addOns.verifiedBadge.expiresAt || new Date(addOns.verifiedBadge.expiresAt) > now);

        return {
          ...listing,
          _rankScore: rankScore,
          _rankTier: rankTier,
          isFeatured: !!featuredActive || rankTier !== 'standard',
          isPremium: !!premiumActive || rankTier === 'elite',
          isElite: !!eliteActive,
          hasVerifiedBadge: !!verifiedBadgeActive,
          isAiEnhanced: !!addOns?.aiEnhanced,
          hasSpecSheet: !!addOns?.specSheet,
        } as ProcessedListing;
      });

      // Re-sort by rank score (elite > premium > featured > standard)
      processedListings.sort((a, b) => {
        if (b._rankScore !== a._rankScore) {
          return b._rankScore - a._rankScore;
        }
        // Fall back to creation date
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });

      results.listings = processedListings;
      results.listingsTotal = listingsTotal;
    }

    // Search Contractors
    if (type === 'all' || type === 'contractors') {
      interface ContractorQuery {
        isActive: boolean;
        isPublished: boolean;
        $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
        services?: string;
        regionsServed?: string;
      }

      const contractorQuery: ContractorQuery = {
        isActive: true,
        isPublished: true,
      };

      if (query) {
        contractorQuery.$or = [
          { businessName: { $regex: query, $options: 'i' } },
          { businessDescription: { $regex: query, $options: 'i' } },
        ];
      }

      if (category) {
        contractorQuery.services = category;
      }

      if (state) {
        contractorQuery.regionsServed = state;
      }

      const [contractors, contractorsTotal] = await Promise.all([
        ContractorProfile.find(contractorQuery)
          .select('businessName businessDescription logo services regionsServed yearsInBusiness verificationStatus address.city address.state')
          .sort({ verificationStatus: -1, yearsInBusiness: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        ContractorProfile.countDocuments(contractorQuery),
      ]);

      results.contractors = contractors;
      results.contractorsTotal = contractorsTotal;
    }

    // Generate search suggestions based on popular categories and tags
    if (query.length >= 2) {
      // Get popular tags that match the query
      const tagAggregation = await Listing.aggregate([
        { $match: { isActive: true, status: 'active' } },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: query, $options: 'i' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      results.suggestions = tagAggregation.map((t: { _id: string }) => t._id);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        query,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/autocomplete
 * Fast autocomplete for search suggestions
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const query = body.query || '';

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    // Get title suggestions from recent/popular listings
    const titleSuggestions = await Listing.find(
      {
        isActive: true,
        status: 'active',
        title: { $regex: query, $options: 'i' },
      },
      { title: 1, category: 1 }
    )
      .sort({ viewCount: -1 })
      .limit(5)
      .lean();

    // Get category matches
    const categoryMatches = LISTING_CATEGORIES
      .filter(cat => cat.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      data: {
        suggestions: [
          ...titleSuggestions.map((l: { title: string }) => ({ type: 'listing', text: l.title })),
          ...categoryMatches.map(cat => ({ type: 'category', text: cat })),
        ],
      },
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { success: false, error: 'Autocomplete failed' },
      { status: 500 }
    );
  }
}
