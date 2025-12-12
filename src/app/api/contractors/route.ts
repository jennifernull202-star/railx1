/**
 * THE RAIL EXCHANGE™ — Contractors List API
 * 
 * GET /api/contractors
 * Returns list of PAID VERIFIED contractors with optional filters.
 * 
 * HARD VISIBILITY GATE:
 * - Contractor MUST be verified (verificationStatus === 'verified')
 * - Contractor MUST have active paid visibility tier (visibilityTier !== 'none')
 * - Contractor subscription MUST be active (visibilitySubscriptionStatus === 'active')
 * - Visibility and verification must NOT be expired
 * 
 * NO FREE CONTRACTOR VISIBILITY.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const now = new Date();
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const service = searchParams.get('service');
    const region = searchParams.get('region');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const tier = searchParams.get('tier'); // 'verified', 'featured', 'priority'

    // ================================================================
    // HARD VISIBILITY GATE — NO FREE CONTRACTORS
    // ================================================================
    const query: Record<string, unknown> = {
      isPublished: true,
      isActive: true,
      // HARD GATE: Must be verified
      verificationStatus: 'verified',
      // HARD GATE: Must have a paid visibility tier
      visibilityTier: tier 
        ? tier 
        : { $in: ['verified', 'featured', 'priority'] },
      // HARD GATE: Subscription must be active
      visibilitySubscriptionStatus: 'active',
      // HARD GATE: Visibility not expired
      $or: [
        { visibilityExpiresAt: { $gt: now } },
        { visibilityExpiresAt: { $exists: false } },
        { visibilityExpiresAt: null },
      ],
    };

    // Add verification expiry check
    query.$and = [
      {
        $or: [
          { verifiedBadgeExpiresAt: { $gt: now } },
          { verifiedBadgeExpiresAt: { $exists: false } },
          { verifiedBadgeExpiresAt: null },
        ],
      },
    ];

    // ================================================================
    // OPTIONAL FILTERS
    // ================================================================
    if (service) {
      query.services = { $in: [service] };
    }

    if (region) {
      query.regionsServed = { $in: [region] };
    }

    if (state) {
      query['address.state'] = state;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [contractors, total] = await Promise.all([
      ContractorProfile.find(query)
        .sort({ 
          // Priority tier first, then Featured, then Verified
          visibilityTier: -1,
          profileCompleteness: -1,
          createdAt: -1 
        })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name image'),
      ContractorProfile.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: contractors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Contractors list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contractors' },
      { status: 500 }
    );
  }
}
