/**
 * THE RAIL EXCHANGE™ — Listings API
 * 
 * GET: List all listings with filters
 * POST: Create new listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Listing, { LISTING_CATEGORIES, LISTING_CONDITIONS, LISTING_STATUSES } from '@/models/Listing';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { 
  canCreateListing, 
  getRemainingListingSlots,
  SELLER_TIER_CONFIG,
  SELLER_TIERS,
  SellerTier,
} from '@/config/pricing';
import { FEATURED_LISTING_CARD } from '@/lib/featured-listing';

// Define query interface
interface ListingQuery {
  isActive: boolean;
  status?: string | { $in: string[] };
  category?: string;
  condition?: string | { $in: string[] };
  'location.state'?: string;
  sellerId?: string;
  'premiumAddOns.featured.active'?: boolean;
  'price.amount'?: { $gte?: number; $lte?: number };
  $text?: { $search: string };
}

/**
 * GET /api/listings
 * List all listings with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Try to connect to database
    let dbConnected = false;
    try {
      await connectDB();
      dbConnected = true;
    } catch {
      console.log('Database not available, returning featured example only');
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')));
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const state = searchParams.get('state');
    const sellerId = searchParams.get('seller');
    const featured = searchParams.get('featured');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // If database not connected, return only the featured example listing
    if (!dbConnected) {
      // Featured example always shows first in every category
      const featuredListing = {
        ...FEATURED_LISTING_CARD,
        // Format for API response
        primaryImageUrl: FEATURED_LISTING_CARD.images[0]?.url,
      };

      return NextResponse.json({
        listings: [featuredListing],
        pagination: {
          page: 1,
          limit,
          total: 1,
          totalPages: 1,
        },
      });
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query: ListingQuery = {
      isActive: true,
    };

    // Default to active listings for public
    const session = await getServerSession(authOptions);
    if (status && session?.user) {
      if (status === 'all') {
        // Don't filter by status
      } else if (LISTING_STATUSES.includes(status as typeof LISTING_STATUSES[number])) {
        query.status = status;
      }
    } else {
      query.status = 'active';
    }

    // Category filter
    if (category && LISTING_CATEGORIES.includes(category as typeof LISTING_CATEGORIES[number])) {
      query.category = category;
    }

    // Condition filter (supports multiple)
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

    // Location filter
    if (state) {
      query['location.state'] = state;
    }

    // Seller filter
    if (sellerId) {
      query.sellerId = sellerId;
    }

    // Featured filter
    if (featured === 'true') {
      query['premiumAddOns.featured.active'] = true;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = parseInt(minPrice);
      if (maxPrice) query['price.amount'].$lte = parseInt(maxPrice);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    type SortObject = Record<string, 1 | -1>;
    let sortObj: SortObject = {};

    // Featured listings first, then by sort field
    if (!search) {
      sortObj = {
        'premiumAddOns.featured.active': -1 as const,
        'premiumAddOns.boosted.active': -1 as const,
      };
    }

    // Add requested sort
    const allowedSortFields = ['createdAt', 'price.amount', 'viewCount', 'title'];
    if (allowedSortFields.includes(sortBy)) {
      sortObj[sortBy] = sortOrder as 1 | -1;
    } else {
      sortObj.createdAt = -1;
    }

    // Execute query
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .select('-description') // Exclude large fields for list view
        .populate('sellerId', 'name image')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('List listings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings
 * Create a new listing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // ================================================================
    // LISTING LIMIT CHECK
    // ================================================================
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's seller tier (default to BUYER if not set)
    const sellerTier = (user.sellerTier || SELLER_TIERS.BUYER) as SellerTier;
    
    // Count user's current active listings
    const activeListingCount = await Listing.countDocuments({
      sellerId: session.user.id,
      status: { $in: ['active', 'draft', 'pending'] },
      isActive: true,
    });

    // Check if user is on buyer tier (cannot create listings)
    if (sellerTier === SELLER_TIERS.BUYER) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A seller subscription is required to create listings. Please upgrade to Seller Basic or higher.',
          code: 'SUBSCRIPTION_REQUIRED',
          data: {
            currentTier: sellerTier,
            upgradeRequired: true,
          }
        },
        { status: 403 }
      );
    }

    // Check if user can create more listings
    if (!canCreateListing(sellerTier, activeListingCount)) {
      const tierConfig = SELLER_TIER_CONFIG[sellerTier];
      const remaining = getRemainingListingSlots(sellerTier, activeListingCount);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Listing limit reached. Your ${tierConfig.name} plan allows up to ${tierConfig.listingLimit} listings. You have ${activeListingCount} active listings.`,
          code: 'LISTING_LIMIT_REACHED',
          data: {
            currentTier: sellerTier,
            tierName: tierConfig.name,
            limit: tierConfig.listingLimit,
            current: activeListingCount,
            remaining: remaining,
            upgradeRequired: true,
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'condition', 'location'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate category
    if (!LISTING_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate condition
    if (!LISTING_CONDITIONS.includes(body.condition)) {
      return NextResponse.json(
        { success: false, error: 'Invalid condition' },
        { status: 400 }
      );
    }

    // Create listing
    const listingData = {
      title: body.title,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      condition: body.condition,
      status: body.status || 'draft',
      sellerId: session.user.id,
      sellerType: session.user.role === 'contractor' ? 'contractor' : 'individual',
      price: body.price || { type: 'contact', currency: 'USD' },
      location: {
        city: body.location.city,
        state: body.location.state,
        country: body.location.country || 'USA',
        zipCode: body.location.zipCode,
        // Add GeoJSON coordinates if lat/lng provided
        ...(body.location.lat && body.location.lng ? {
          coordinates: {
            type: 'Point' as const,
            coordinates: [Number(body.location.lng), Number(body.location.lat)] as [number, number], // GeoJSON is [lng, lat]
          },
        } : {}),
      },
      media: body.media || [],
      specifications: body.specifications || [],
      quantity: body.quantity || 1,
      quantityUnit: body.quantityUnit,
      sku: body.sku,
      shippingOptions: body.shippingOptions || {
        localPickup: true,
        sellerShips: false,
        buyerArranges: true,
      },
      tags: body.tags || [],
      keywords: body.keywords || [],
    };

    const listing = await Listing.create(listingData);

    // Update user's active listing count
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { activeListingCount: 1 },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Listing created successfully',
        data: listing,
        meta: {
          remainingSlots: getRemainingListingSlots(sellerTier, activeListingCount + 1),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create listing error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
