/**
 * THE RAIL EXCHANGE™ — Search API
 * 
 * Advanced search with MongoDB text search, filters, and aggregations.
 * Includes add-on ranking boost for featured/premium/elite listings.
 * 
 * BUYER AUDIT UPGRADE: Full equipment-specific filters
 * - reportingMarks, manufacturer, model, yearBuilt, horsepower
 * - FRA compliance, AAR car type, availability
 * - Radius search with geospatial
 * - Seller type, verified seller toggle
 * 
 * SECURITY CONTROLS (Section 1, 5, 10):
 * - Rate limiting to prevent scraping
 * - Input sanitization (regex escape, SQL injection prevention)
 * - MongoDB operator stripping
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
import User from '@/models/User';
import { ADD_ON_RANKING_BOOST, ADD_ON_TYPES } from '@/config/addons';
import { checkRateLimit } from '@/lib/rate-limit';
import { escapeRegex, validateManufacturer } from '@/lib/sanitize';

// Add-on ranking weights for scoring (based on tier system)
// Elite is the ONLY placement tier - no Premium/Featured tiers
const BASE_TIER_POINTS = 250;
const RANKING_WEIGHTS = {
  elite: BASE_TIER_POINTS * ADD_ON_RANKING_BOOST[ADD_ON_TYPES.ELITE],      // +3 tier = 750
  premium: BASE_TIER_POINTS * 2, // Legacy support: map to elite/2 = 500
  featured: BASE_TIER_POINTS * 1, // Legacy support: map to elite/3 = 250
  aiEnhanced: 25, // Small bonus for AI-enhanced content
  specSheet: 10,  // Small bonus for having spec sheet
};

// Extended search query interface for equipment filters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchQuery = Record<string, any>;

/**
 * GET /api/search
 * Unified search across listings and contractors
 * 
 * BUYER AUDIT: Extended filter support
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting (Section 1)
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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
    
    // ============================================
    // BUYER AUDIT: New equipment-specific filters
    // ============================================
    const reportingMarks = searchParams.get('reportingMarks');
    const manufacturer = searchParams.get('manufacturer');
    const model = searchParams.get('model');
    const minYearBuilt = searchParams.get('minYearBuilt');
    const maxYearBuilt = searchParams.get('maxYearBuilt');
    const minHorsepower = searchParams.get('minHorsepower');
    const maxHorsepower = searchParams.get('maxHorsepower');
    const minEngineHours = searchParams.get('minEngineHours');
    const maxEngineHours = searchParams.get('maxEngineHours');
    const minMileage = searchParams.get('minMileage');
    const maxMileage = searchParams.get('maxMileage');
    const fraCompliant = searchParams.get('fraCompliant');
    const aarCarType = searchParams.get('aarCarType');
    const availability = searchParams.get('availability');
    const sellerType = searchParams.get('sellerType');
    const verifiedSellerOnly = searchParams.get('verifiedSellerOnly') === 'true';
    const minQuantity = searchParams.get('minQuantity');
    
    // Radius search parameters
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusMiles = searchParams.get('radius');

    const results: {
      listings?: unknown[];
      contractors?: unknown[];
      listingsTotal?: number;
      contractorsTotal?: number;
      suggestions?: string[];
      facets?: {
        manufacturers?: { _id: string; count: number }[];
        yearRange?: { min: number; max: number };
        priceRange?: { min: number; max: number };
      };
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
      
      // ============================================
      // BUYER AUDIT: Equipment-specific filter logic
      // ============================================
      
      // Reporting marks (exact or partial match)
      // SECURITY: Already escaped inline
      if (reportingMarks) {
        listingQuery['equipment.reportingMarks'] = { 
          $regex: escapeRegex(reportingMarks), 
          $options: 'i' 
        };
      }
      
      // Manufacturer filter (multi-select)
      // SECURITY: Validate against known manufacturers
      if (manufacturer) {
        const manufacturers = manufacturer.split(',').map(m => m.trim()).filter(m => validateManufacturer(m));
        if (manufacturers.length === 1) {
          listingQuery['equipment.manufacturer'] = manufacturers[0];
        } else if (manufacturers.length > 0) {
          listingQuery['equipment.manufacturer'] = { $in: manufacturers };
        }
      }
      
      // Model filter (partial match)
      // SECURITY: Escape regex special characters
      if (model) {
        listingQuery['equipment.model'] = { $regex: escapeRegex(model), $options: 'i' };
      }
      
      // Year built range
      if (minYearBuilt || maxYearBuilt) {
        listingQuery['equipment.yearBuilt'] = {};
        if (minYearBuilt) listingQuery['equipment.yearBuilt'].$gte = parseInt(minYearBuilt);
        if (maxYearBuilt) listingQuery['equipment.yearBuilt'].$lte = parseInt(maxYearBuilt);
      }
      
      // Horsepower range
      if (minHorsepower || maxHorsepower) {
        listingQuery['equipment.horsepower'] = {};
        if (minHorsepower) listingQuery['equipment.horsepower'].$gte = parseInt(minHorsepower);
        if (maxHorsepower) listingQuery['equipment.horsepower'].$lte = parseInt(maxHorsepower);
      }
      
      // Engine hours range
      if (minEngineHours || maxEngineHours) {
        listingQuery['equipment.engineHours'] = {};
        if (minEngineHours) listingQuery['equipment.engineHours'].$gte = parseInt(minEngineHours);
        if (maxEngineHours) listingQuery['equipment.engineHours'].$lte = parseInt(maxEngineHours);
      }
      
      // Mileage range
      if (minMileage || maxMileage) {
        listingQuery['equipment.mileage'] = {};
        if (minMileage) listingQuery['equipment.mileage'].$gte = parseInt(minMileage);
        if (maxMileage) listingQuery['equipment.mileage'].$lte = parseInt(maxMileage);
      }
      
      // FRA compliance toggle
      if (fraCompliant === 'true') {
        listingQuery['equipment.fraCompliant'] = true;
      }
      
      // AAR car type (multi-select)
      if (aarCarType) {
        const types = aarCarType.split(',').map(t => t.trim());
        if (types.length === 1) {
          listingQuery['equipment.aarCarType'] = types[0];
        } else {
          listingQuery['equipment.aarCarType'] = { $in: types };
        }
      }
      
      // Availability filter
      if (availability) {
        const avails = availability.split(',').map(a => a.trim());
        if (avails.length === 1) {
          listingQuery['equipment.availability'] = avails[0];
        } else {
          listingQuery['equipment.availability'] = { $in: avails };
        }
      }
      
      // Seller type filter
      if (sellerType) {
        const types = sellerType.split(',').map(t => t.trim());
        if (types.length === 1) {
          listingQuery.sellerType = types[0];
        } else {
          listingQuery.sellerType = { $in: types };
        }
      }
      
      // Verified seller only filter
      if (verifiedSellerOnly) {
        const verifiedSellers = await User.find(
          { isVerifiedSeller: true },
          { _id: 1 }
        ).lean();
        listingQuery.sellerId = { $in: verifiedSellers.map(s => s._id) };
      }
      
      // Minimum quantity filter (for bulk buyers)
      if (minQuantity) {
        listingQuery.quantity = { $gte: parseInt(minQuantity) };
      }
      
      // Radius search using geospatial
      if (lat && lng && radiusMiles) {
        const radiusInRadians = parseFloat(radiusMiles) / 3963.2; // Earth radius in miles
        listingQuery['location.coordinates'] = {
          $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
          }
        };
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
          .select('title slug category condition primaryImageUrl price location viewCount inquiryCount premiumAddOns createdAt publishedAt sellerId sellerType quantity equipment daysOnMarket')
          .populate('sellerId', 'isVerifiedSeller name verifiedSellerStatus')
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
      
      // ============================================
      // BUYER AUDIT: Generate faceted search counts
      // ============================================
      if (page === 1) {
        const [manufacturerFacets, yearRange, priceRange] = await Promise.all([
          // Get manufacturer counts
          Listing.aggregate([
            { $match: { isActive: true, status: 'active', 'equipment.manufacturer': { $exists: true, $ne: null } } },
            { $group: { _id: '$equipment.manufacturer', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ]),
          // Get year range
          Listing.aggregate([
            { $match: { isActive: true, status: 'active', 'equipment.yearBuilt': { $exists: true, $ne: null } } },
            { $group: { _id: null, min: { $min: '$equipment.yearBuilt' }, max: { $max: '$equipment.yearBuilt' } } },
          ]),
          // Get price range
          Listing.aggregate([
            { $match: { isActive: true, status: 'active', 'price.amount': { $exists: true, $gt: 0 } } },
            { $group: { _id: null, min: { $min: '$price.amount' }, max: { $max: '$price.amount' } } },
          ]),
        ]);
        
        results.facets = {
          manufacturers: manufacturerFacets,
          yearRange: yearRange[0] || { min: 1950, max: new Date().getFullYear() },
          priceRange: priceRange[0] || { min: 0, max: 1000000 },
        };
      }
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

      // SECURITY: Escape query for regex use
      if (query) {
        const escapedQuery = escapeRegex(query);
        contractorQuery.$or = [
          { businessName: { $regex: escapedQuery, $options: 'i' } },
          { businessDescription: { $regex: escapedQuery, $options: 'i' } },
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
    // SECURITY: Use escaped query for regex
    if (query.length >= 2) {
      const escapedQuery = escapeRegex(query);
      // Get popular tags that match the query
      const tagAggregation = await Listing.aggregate([
        { $match: { isActive: true, status: 'active' } },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: escapedQuery, $options: 'i' } } },
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
    // SECURITY: Rate limiting for autocomplete
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await connectDB();

    const body = await request.json();
    const query = body.query || '';

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    // SECURITY: Escape query for regex use
    const escapedQuery = escapeRegex(query);

    // Get title suggestions from recent/popular listings
    const titleSuggestions = await Listing.find(
      {
        isActive: true,
        status: 'active',
        title: { $regex: escapedQuery, $options: 'i' },
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
