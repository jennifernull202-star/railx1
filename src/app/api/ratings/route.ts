/**
 * THE RAIL EXCHANGE™ — Ratings API Route
 * 
 * GET /api/ratings?entityId=xxx
 * 
 * Returns aggregate ratings for an entity.
 * NO auth required.
 * Returns null average if no ratings (NOT zero).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse, RatingsResponseData } from '../profiles/types';

// Default empty ratings state - null average means "no ratings yet"
const EMPTY_RATINGS: RatingsResponseData = {
  averageRating: null,    // null = no ratings, NOT zero
  totalReviews: 0,
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<RatingsResponseData>>> {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    if (!entityId) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'entityId is required',
      }, { status: 400 });
    }

    // TODO: Implement actual database lookup
    // Will aggregate ratings from reviews collection
    // Returns null average if no reviews exist (not zero)
    
    // Safe empty response - no ratings data
    return NextResponse.json({
      success: true,
      data: EMPTY_RATINGS,
    });

  } catch (error) {
    console.error('[Ratings API] Error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Failed to fetch ratings',
    }, { status: 500 });
  }
}
