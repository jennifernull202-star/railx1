/**
 * THE RAIL EXCHANGE™ — Relevant Contractors API
 * 
 * GET /api/contractors/relevant?category=<equipment-category>&limit=<number>
 * 
 * Returns contractors relevant to an equipment category.
 * Uses EQUIPMENT_TO_CONTRACTOR_MAPPING to match contractor types.
 * 
 * BUSINESS RULES:
 * - Only returns PAID + VERIFIED contractors
 * - Priority tier first, then Featured, then Verified
 * - Limited results to maintain value
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { getRelevantContractorTypes } from '@/config/contractor-types';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'default';
    const limit = Math.min(parseInt(searchParams.get('limit') || '3'), 5); // Max 5

    // Get relevant contractor types for this equipment category
    const relevantTypes = getRelevantContractorTypes(category);
    const now = new Date();

    // Build query - HARD GATE: Only paid + verified contractors
    const query = {
      isActive: true,
      isPublished: true,
      // HARD GATE: Must be verified
      verificationStatus: 'verified',
      // HARD GATE: Must have a paid visibility tier
      visibilityTier: { $in: ['verified', 'featured', 'priority'] },
      // HARD GATE: Subscription must be active
      visibilitySubscriptionStatus: 'active',
      // HARD GATE: Visibility not expired
      $or: [
        { visibilityExpiresAt: { $gt: now } },
        { visibilityExpiresAt: { $exists: false } },
        { visibilityExpiresAt: null },
      ],
      // HARD GATE: Verification badge not expired
      $and: [
        {
          $or: [
            { verifiedBadgeExpiresAt: { $gt: now } },
            { verifiedBadgeExpiresAt: { $exists: false } },
            { verifiedBadgeExpiresAt: null },
          ],
        },
      ],
      // Match by contractor types
      contractorTypes: { $in: relevantTypes },
    };

    const contractors = await ContractorProfile.find(query)
      .select('businessName logo contractorTypes visibilityTier address.city address.state')
      .sort({ 
        // Priority tier first, then Featured, then Verified
        visibilityTier: -1,
      })
      .limit(limit)
      .lean();

    return NextResponse.json({
      contractors,
      category,
      relevantTypes,
    });
  } catch (error) {
    console.error('Relevant contractors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relevant contractors' },
      { status: 500 }
    );
  }
}
