/**
 * THE RAIL EXCHANGE™ — Analytics Events API
 * 
 * POST /api/analytics/events - Track analytics events
 * GET /api/analytics/events - Get aggregated analytics data
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ Tracks:                                                                  │
 * │ • Outbound clicks (website, LinkedIn, phone, email)                     │
 * │ • Source attribution (Search, Map, Profile, Listing, Direct)            │
 * │ • Map visibility (impressions, opens, click-through)                    │
 * │ • Page views with referrer tracking                                     │
 * │                                                                          │
 * │ PRIVACY: Aggregate counts only. No PII stored.                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AddOnPurchase from '@/models/AddOnPurchase';
import AnalyticsEvent, { 
  getAggregationDate, 
  getDateRange,
  AnalyticsTargetType,
  AnalyticsEventType,
  AnalyticsClickType,
  AnalyticsSource 
} from '@/models/AnalyticsEvent';
import { ADD_ON_TYPES } from '@/config/pricing';
import mongoose, { Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════
// POST - Track an analytics event
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, eventType, clickType, source } = body;

    // Validate required fields
    if (!targetType || !targetId || !eventType || !source) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: targetType, targetId, eventType, source' },
        { status: 400 }
      );
    }

    // Validate enums
    const validTargetTypes: AnalyticsTargetType[] = ['listing', 'contractor', 'seller', 'company'];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target type' },
        { status: 400 }
      );
    }

    const validEventTypes: AnalyticsEventType[] = [
      'outbound_click', 'page_view', 'map_impression', 'map_open', 'search_impression'
    ];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
    }

    const validSources: AnalyticsSource[] = ['search', 'map', 'profile', 'listing', 'direct', 'external'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: 'Invalid source' },
        { status: 400 }
      );
    }

    // Validate click type for outbound_click events
    if (eventType === 'outbound_click') {
      const validClickTypes: AnalyticsClickType[] = ['phone', 'email', 'website', 'linkedin', 'inquiry'];
      if (!clickType || !validClickTypes.includes(clickType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid or missing click type for outbound_click event' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Get today's date (rounded to day) for aggregation
    const today = getAggregationDate();

    // Upsert: increment count for this unique combination
    await AnalyticsEvent.findOneAndUpdate(
      {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
        eventType,
        clickType: eventType === 'outbound_click' ? clickType : null,
        source,
        date: today,
      },
      {
        $inc: { count: 1 },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics event tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Retrieve aggregated analytics data
// ═══════════════════════════════════════════════════════════════════════════
// ENTITLEMENT ENFORCEMENT:
// - Professionals (Contractor/Company): ALLOWED
// - Sellers with active Seller Analytics add-on: ALLOWED
// - Buyers: REJECTED
// - Sellers without add-on: REJECTED
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Session verification
    // ─────────────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Entitlement check
    // ─────────────────────────────────────────────────────────────────────────
    const [user, analyticsAddOn] = await Promise.all([
      User.findById(session.user.id).lean(),
      AddOnPurchase.findOne({
        userId: new Types.ObjectId(session.user.id),
        type: ADD_ON_TYPES.SELLER_ANALYTICS,
        status: 'active',
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null },
        ],
      }).lean(),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine user type
    const isContractor = user.isContractor === true;
    const isCompany = !!user.company && user.sellerTier === 'enterprise';
    const isVerifiedSeller = user.isVerifiedSeller === true;
    const isBuyer = !isContractor && !isCompany && !isVerifiedSeller && user.sellerTier === 'buyer';

    // Professional = contractor tier 'professional', 'platform', 'priority' OR enterprise seller
    const isProfessional = user.contractorTier === 'professional' || 
                           user.contractorTier === 'platform' || 
                           user.contractorTier === 'priority' ||
                           isCompany;

    // Check analytics entitlement
    const professionalHasAnalytics = (isContractor || isCompany) && isProfessional;
    const sellerHasAnalytics = isVerifiedSeller && !!analyticsAddOn;
    const hasAnalyticsAccess = professionalHasAnalytics || sellerHasAnalytics;

    // Reject buyers
    if (isBuyer) {
      return NextResponse.json(
        { success: false, error: 'Analytics not available for buyer accounts' },
        { status: 403 }
      );
    }

    // Reject sellers without add-on
    if (!hasAnalyticsAccess) {
      return NextResponse.json(
        { success: false, error: 'Analytics add-on required. Purchase at /dashboard/analytics' },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Parse and validate request parameters
    // ─────────────────────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType') as AnalyticsTargetType | null;
    const targetId = searchParams.get('targetId');
    const days = parseInt(searchParams.get('days') || '30', 10) as 7 | 30 | 90;

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: 'Missing targetType or targetId' },
        { status: 400 }
      );
    }

    // Validate days parameter
    if (![7, 30, 90].includes(days)) {
      return NextResponse.json(
        { success: false, error: 'Invalid days parameter. Must be 7, 30, or 90' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Fetch and aggregate analytics data
    // ─────────────────────────────────────────────────────────────────────────
    const { start } = getDateRange(days);

    // Get all events for this target in date range
    const events = await AnalyticsEvent.aggregate([
      {
        $match: {
          targetType,
          targetId: new mongoose.Types.ObjectId(targetId),
          date: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            clickType: '$clickType',
            source: '$source',
          },
          total: { $sum: '$count' },
        },
      },
    ]);

    // Structure the response data
    const result = {
      // Outbound click breakdown
      outboundClicks: {
        phone: 0,
        email: 0,
        website: 0,
        linkedin: 0,
        inquiry: 0,
        total: 0,
      },
      // Source attribution breakdown  
      sourceAttribution: {
        search: 0,
        map: 0,
        profile: 0,
        listing: 0,
        direct: 0,
        external: 0,
        total: 0,
      },
      // Map visibility metrics
      mapMetrics: {
        impressions: 0,
        opens: 0,
        clickThrough: 0, // Calculated as opens/impressions percentage
      },
      // Page view metrics
      pageViews: {
        total: 0,
        bySource: {
          search: 0,
          map: 0,
          profile: 0,
          listing: 0,
          direct: 0,
          external: 0,
        },
      },
      // Search impressions
      searchImpressions: 0,
    };

    // Process events into structured response
    for (const event of events) {
      const { eventType, clickType, source } = event._id;
      const total = event.total;

      switch (eventType) {
        case 'outbound_click':
          if (clickType && clickType in result.outboundClicks) {
            result.outboundClicks[clickType as AnalyticsClickType] = total;
            result.outboundClicks.total += total;
          }
          break;

        case 'page_view':
          result.pageViews.total += total;
          if (source && source in result.pageViews.bySource) {
            result.pageViews.bySource[source as AnalyticsSource] = total;
          }
          // Also track source attribution from page views
          if (source && source in result.sourceAttribution) {
            result.sourceAttribution[source as AnalyticsSource] += total;
            result.sourceAttribution.total += total;
          }
          break;

        case 'map_impression':
          result.mapMetrics.impressions += total;
          break;

        case 'map_open':
          result.mapMetrics.opens += total;
          break;

        case 'search_impression':
          result.searchImpressions += total;
          break;
      }
    }

    // Calculate click-through rate for map
    if (result.mapMetrics.impressions > 0) {
      result.mapMetrics.clickThrough = Math.round(
        (result.mapMetrics.opens / result.mapMetrics.impressions) * 100
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      period: `${days} days`,
      dateRange: {
        start: start.toISOString(),
        end: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
