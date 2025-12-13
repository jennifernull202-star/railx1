/**
 * THE RAIL EXCHANGE™ — Listings API
 * 
 * GET: List all listings with filters
 * POST: Create new listing
 * 
 * SECURITY CONTROLS (Section 10):
 * - Tag/keyword array limits to prevent SEO spam
 * - Input sanitization
 * - Duplicate title detection
 * - Manufacturer enum enforcement
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
import { 
  getVerificationResult,
  canPublishListings,
} from '@/lib/verification';
import { 
  sanitizeString, 
  sanitizeHTML, 
  detectKeywordStuffing, 
  validateManufacturer 
} from '@/lib/sanitize';
import {
  checkListingCompleteness,
  generateImageHashes,
} from '@/lib/abuse-prevention';

// SECTION 10: SEO/Content Spam Controls
const MAX_TAGS = 10;
const MAX_KEYWORDS = 15;
const MAX_TAG_LENGTH = 50;

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
    // SELLER VERIFICATION CHECK (Required to create listings)
    // Using unified verification hierarchy:
    // - CONTRACTOR verified: Can create listings (includes seller access)
    // - SELLER verified: Can create listings
    // - Not verified: Cannot create listings
    // ================================================================
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // SECURITY: Email verification required before creating listings (enterprise abuse prevention)
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This action is temporarily unavailable due to account or security requirements.',
          code: 'EMAIL_UNVERIFIED'
        },
        { status: 403 }
      );
    }

    // Parse body early to check requested status
    const body = await request.json();
    const requestedStatus = body.status || 'active';
    
    // Use unified verification helper
    const verificationResult = getVerificationResult(user);
    
    // UX ITEM #1: Verification is only required when PUBLISHING (status=active)
    // Drafts can be created without verification to allow completing the full form
    if (requestedStatus !== 'draft' && !canPublishListings(user)) {
      // Log event: listing_publish_blocked_verification
      console.log(`[EVENT] listing_publish_blocked_verification | userId: ${session.user.id} | status: ${verificationResult.status}`);
      
      // Check specific status for appropriate error message
      if (verificationResult.isExpired) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Your verification has expired. Please renew to publish listings.',
            code: 'VERIFICATION_EXPIRED',
            data: {
              verificationStatus: 'expired',
              verificationType: verificationResult.type,
              renewalRequired: true,
              renewalUrl: '/dashboard/verification/seller',
              draftAllowed: true,
            }
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Seller verification is required to publish listings. Your draft has been saved.',
          code: 'VERIFICATION_REQUIRED',
          data: {
            verificationStatus: verificationResult.status,
            verificationType: verificationResult.type,
            verificationRequired: true,
            verificationUrl: '/dashboard/verification/seller',
            draftAllowed: true,
          }
        },
        { status: 403 }
      );
    }

    // Check if verification is about to expire (within 7 days)
    const expiresAt = verificationResult.expiresAt;
    if (expiresAt) {
      const daysUntilExpiration = Math.ceil(
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiration <= 0) {
        // Actually expired - update status based on verification type
        if (verificationResult.type === 'contractor') {
          user.contractorVerificationStatus = 'revoked';
        } else if (verificationResult.type === 'seller') {
          user.verifiedSellerStatus = 'expired';
          user.isVerifiedSeller = false;
        }
        await user.save();
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Your verification has expired. Please renew to continue creating listings.',
            code: 'VERIFICATION_EXPIRED',
            data: {
              verificationStatus: 'expired',
              verificationType: verificationResult.type,
              renewalRequired: true,
              renewalUrl: '/dashboard/verification/seller',
            }
          },
          { status: 403 }
        );
      }
    }

    // Get user's seller tier (for any future tier-based limits)
    const sellerTier = (user.sellerTier || SELLER_TIERS.BUYER) as SellerTier;
    
    // Count user's current active listings
    const activeListingCount = await Listing.countDocuments({
      sellerId: session.user.id,
      status: { $in: ['active', 'draft', 'pending'] },
      isActive: true,
    });

    // Check if user can create more listings (unlimited for verified sellers)
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

    // body already parsed above for status check

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

    // PHOTO LIMIT: Maximum 20 photos per listing
    const MAX_PHOTOS = 20;
    if (body.media && Array.isArray(body.media) && body.media.length > MAX_PHOTOS) {
      return NextResponse.json(
        { success: false, error: `Maximum photo limit reached: Up to ${MAX_PHOTOS} images allowed per listing.` },
        { status: 400 }
      );
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

    // SECTION 10: SEO/Content Spam Controls
    
    // Validate and sanitize tags
    let sanitizedTags: string[] = [];
    if (body.tags && Array.isArray(body.tags)) {
      if (body.tags.length > MAX_TAGS) {
        return NextResponse.json(
          { success: false, error: `Maximum ${MAX_TAGS} tags allowed` },
          { status: 400 }
        );
      }
      sanitizedTags = body.tags
        .map((tag: string) => sanitizeString(tag, { maxLength: MAX_TAG_LENGTH }))
        .filter((tag: string | null) => tag && tag.length > 0);
    }

    // Validate and sanitize keywords
    let sanitizedKeywords: string[] = [];
    if (body.keywords && Array.isArray(body.keywords)) {
      if (body.keywords.length > MAX_KEYWORDS) {
        return NextResponse.json(
          { success: false, error: `Maximum ${MAX_KEYWORDS} keywords allowed` },
          { status: 400 }
        );
      }
      sanitizedKeywords = body.keywords
        .map((kw: string) => sanitizeString(kw, { maxLength: MAX_TAG_LENGTH }))
        .filter((kw: string | null) => kw && kw.length > 0);
    }

    // Check for keyword stuffing in title/description
    if (detectKeywordStuffing(body.title) || detectKeywordStuffing(body.description)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Your listing appears to contain keyword stuffing. Please use natural language in your title and description.',
          code: 'KEYWORD_STUFFING_DETECTED'
        },
        { status: 400 }
      );
    }

    // Validate manufacturer if provided (equipment field)
    if (body.equipment?.manufacturer && !validateManufacturer(body.equipment.manufacturer)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid manufacturer. Please select from the available options or contact support if yours is missing.',
          code: 'INVALID_MANUFACTURER'
        },
        { status: 400 }
      );
    }

    // Sanitize title and description
    const sanitizedTitle = sanitizeString(body.title, { maxLength: 200 }) || body.title;
    const sanitizedDescription = sanitizeHTML(body.description) || body.description;

    // SECTION 10: Check for duplicate titles from same seller (anti-spam)
    const normalizedTitle = sanitizedTitle.toLowerCase().trim();
    const duplicateListing = await Listing.findOne({
      sellerId: session.user.id,
      isActive: true,
      $expr: {
        $eq: [{ $toLower: '$title' }, normalizedTitle]
      }
    });
    
    if (duplicateListing) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active listing with this title. Please use a unique title.',
          code: 'DUPLICATE_TITLE'
        },
        { status: 400 }
      );
    }

    // ================================================================
    // S-1.3: FAKE LISTING DETECTION
    // ================================================================
    
    // S-1.3a: Minimum content completeness check
    const completenessResult = checkListingCompleteness({
      title: sanitizedTitle,
      price: body.price,
      location: body.location,
      media: body.media,
    });
    
    if (!completenessResult.isComplete) {
      return NextResponse.json(
        {
          success: false,
          error: `Listing does not meet minimum content requirements: ${completenessResult.missingFields.join(', ')}`,
          code: 'INCOMPLETE_LISTING',
          data: { missingFields: completenessResult.missingFields }
        },
        { status: 400 }
      );
    }
    
    // S-1.3b: Image hash duplicate detection across different sellers
    let imageHashes: string[] = [];
    if (body.media && Array.isArray(body.media) && body.media.length > 0) {
      const imageUrls = body.media
        .filter((m: { type?: string; url?: string }) => m.type === 'image' || !m.type)
        .map((m: { url: string }) => m.url);
      
      imageHashes = generateImageHashes(imageUrls);
      
      // Check if these images are used by OTHER sellers (not this seller)
      const duplicateImageListing = await Listing.findOne({
        sellerId: { $ne: session.user.id },  // Different seller
        imageHashes: { $in: imageHashes },   // Has matching image
        isActive: true,
        status: { $in: ['active', 'pending'] },
      }).select('_id title sellerId');
      
      if (duplicateImageListing) {
        // Auto-flag this listing for admin review
        console.warn(`S-1.3: Duplicate image detected. User ${session.user.id} submitted images matching listing ${duplicateImageListing._id}`);
        // Don't block, but flag for review - the listing will still be created but flagged
        body._autoFlagged = true;
        body._flagReason = 'Duplicate images detected from different seller';
      }
    }

    // Create listing
    const listingData = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      category: body.category,
      subcategory: body.subcategory,
      condition: body.condition,
      status: body.status || 'draft',
      sellerId: session.user.id,
      sellerType: session.user.isContractor ? 'contractor' : 'individual',
      price: body.price || { type: 'contact', currency: 'USD' },
      location: {
        city: sanitizeString(body.location.city, { maxLength: 100 }) || body.location.city,
        state: body.location.state,
        country: body.location.country || 'USA',
        zipCode: sanitizeString(body.location.zipCode || '', { maxLength: 20 }) || '',
        // Add GeoJSON coordinates if lat/lng provided
        ...(body.location.lat && body.location.lng ? {
          coordinates: {
            type: 'Point' as const,
            coordinates: [Number(body.location.lng), Number(body.location.lat)] as [number, number], // GeoJSON is [lng, lat]
          },
        } : {}),
      },
      media: body.media || [],
      imageHashes: imageHashes, // S-1.3: Store image hashes for duplicate detection
      specifications: body.specifications || [],
      quantity: body.quantity || 1,
      quantityUnit: body.quantityUnit,
      sku: body.sku ? (sanitizeString(body.sku, { maxLength: 50 }) || undefined) : undefined,
      shippingOptions: body.shippingOptions || {
        localPickup: true,
        sellerShips: false,
        buyerArranges: true,
      },
      tags: sanitizedTags,
      keywords: sanitizedKeywords,
      // S-1.3: Auto-flag if duplicate images detected
      ...(body._autoFlagged ? {
        isFlagged: true,
        flagReason: body._flagReason,
      } : {}),
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
