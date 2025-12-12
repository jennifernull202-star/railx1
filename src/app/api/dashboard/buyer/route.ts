/**
 * THE RAIL EXCHANGE™ — Buyer Dashboard API
 * 
 * BUYER AUDIT IMPLEMENTATION: Complete buyer dashboard data
 * 
 * Returns:
 * - Matches today (new listings matching saved searches)
 * - Price drop alerts (watchlist items with price reductions)
 * - Watchlist summary with procurement status counts
 * - Saved search stats
 * - Recently viewed listings
 * - Budget tracking
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import WatchlistItem from '@/models/WatchlistItem';
import SavedSearch from '@/models/SavedSearch';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ============================================
    // 1. MATCHES TODAY - New listings matching saved searches
    // ============================================
    const savedSearches = await SavedSearch.find({ 
      userId, 
      isActive: true 
    }).lean();
    
    let matchesToday = 0;
    const matchingListings: unknown[] = [];
    
    for (const search of savedSearches) {
      // Build query from saved search filters
      const query: Record<string, unknown> = {
        isActive: true,
        status: 'active',
        createdAt: { $gte: oneDayAgo },
      };
      
      if (search.query) {
        query.$text = { $search: search.query };
      }
      if (search.filters.categories?.length) {
        query.category = { $in: search.filters.categories };
      }
      if (search.filters.conditions?.length) {
        query.condition = { $in: search.filters.conditions };
      }
      if (search.filters.state) {
        query['location.state'] = search.filters.state;
      }
      if (search.filters.minPrice || search.filters.maxPrice) {
        query['price.amount'] = {};
        if (search.filters.minPrice) (query['price.amount'] as Record<string, number>).$gte = search.filters.minPrice;
        if (search.filters.maxPrice) (query['price.amount'] as Record<string, number>).$lte = search.filters.maxPrice;
      }
      // Equipment-specific filters
      if (search.filters.manufacturers?.length) {
        query['equipment.manufacturer'] = { $in: search.filters.manufacturers };
      }
      if (search.filters.model) {
        query['equipment.model'] = { $regex: search.filters.model, $options: 'i' };
      }
      if (search.filters.minYearBuilt || search.filters.maxYearBuilt) {
        query['equipment.yearBuilt'] = {};
        if (search.filters.minYearBuilt) (query['equipment.yearBuilt'] as Record<string, number>).$gte = search.filters.minYearBuilt;
        if (search.filters.maxYearBuilt) (query['equipment.yearBuilt'] as Record<string, number>).$lte = search.filters.maxYearBuilt;
      }
      if (search.filters.fraCompliant) {
        query['equipment.fraCompliant'] = true;
      }
      
      const matches = await Listing.find(query)
        .select('title slug category primaryImageUrl price location equipment createdAt')
        .limit(5)
        .lean();
      
      matchesToday += matches.length;
      matchingListings.push(...matches.slice(0, 3)); // Limit to 3 per search for preview
    }

    // ============================================
    // 2. PRICE DROP ALERTS - Watchlist items with price reductions
    // ============================================
    const priceDrops = await WatchlistItem.find({
      userId,
      hasNewPriceDrop: true,
    })
      .populate({
        path: 'listingId',
        select: 'title slug category primaryImageUrl price location equipment',
      })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    // ============================================
    // 3. WATCHLIST SUMMARY with procurement status counts
    // ============================================
    const watchlistStats = await WatchlistItem.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$procurementStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const watchlistSummary = {
      watching: 0,
      reviewing: 0,
      approved: 0,
      purchased: 0,
      archived: 0,
      total: 0,
      priceDropCount: priceDrops.length,
    };

    for (const stat of watchlistStats) {
      if (stat._id in watchlistSummary) {
        watchlistSummary[stat._id as keyof typeof watchlistSummary] = stat.count;
      }
      watchlistSummary.total += stat.count;
    }

    // ============================================
    // 4. SAVED SEARCH STATS
    // ============================================
    const savedSearchStats = {
      total: savedSearches.length,
      withNotifications: savedSearches.filter(s => s.notifyOnMatch).length,
      totalNewMatches: savedSearches.reduce((sum, s) => sum + (s.newMatchCount || 0), 0),
    };

    // ============================================
    // 5. RECENTLY VIEWED LISTINGS
    // ============================================
    const recentlyViewedIds = (user.recentlyViewed || [])
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 10)
      .map(rv => rv.listingId);

    const recentlyViewed = await Listing.find({
      _id: { $in: recentlyViewedIds },
      isActive: true,
    })
      .select('title slug category primaryImageUrl price location equipment createdAt')
      .lean();

    // ============================================
    // 6. BUDGET TRACKING (from approved/reviewing items)
    // ============================================
    const budgetItems = await WatchlistItem.find({
      userId,
      procurementStatus: { $in: ['reviewing', 'approved'] },
    })
      .populate({
        path: 'listingId',
        select: 'title price quantity',
      })
      .lean();

    let budgetTotal = 0;
    let itemCount = 0;
    for (const item of budgetItems) {
      const listing = item.listingId as { price?: { amount?: number }; quantity?: number } | null;
      if (listing?.price?.amount) {
        budgetTotal += listing.price.amount * (listing.quantity || 1);
        itemCount++;
      }
    }

    // ============================================
    // 7. ACTIVITY SUMMARY
    // ============================================
    const recentInquiries = await (await import('@/models/Inquiry')).default.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    }).catch(() => 0);

    const recentMessages = await (await import('@/models/Message')).default.countDocuments({
      senderId: userId,
      createdAt: { $gte: sevenDaysAgo },
    }).catch(() => 0);

    return NextResponse.json({
      success: true,
      data: {
        // Matches today
        matchesToday: {
          count: matchesToday,
          preview: matchingListings.slice(0, 6),
        },
        
        // Price drops
        priceDrops: {
          count: priceDrops.length,
          items: priceDrops,
        },
        
        // Watchlist
        watchlist: watchlistSummary,
        
        // Saved searches
        savedSearches: savedSearchStats,
        
        // Recently viewed
        recentlyViewed,
        
        // Budget tracking
        budget: {
          totalValue: budgetTotal,
          itemCount,
          byStatus: {
            reviewing: budgetItems.filter(i => i.procurementStatus === 'reviewing').length,
            approved: budgetItems.filter(i => i.procurementStatus === 'approved').length,
          },
        },
        
        // Activity
        activity: {
          inquiriesThisWeek: recentInquiries,
          messagesThisWeek: recentMessages,
        },
      },
    });
  } catch (error) {
    console.error('Buyer dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load buyer dashboard' },
      { status: 500 }
    );
  }
}
