/**
 * THE RAIL EXCHANGE™ — Visibility API Route
 * 
 * GET /api/visibility?entityId=xxx
 * 
 * Returns visibility tier and add-on flags for an entity.
 * Affects:
 * - ProfileVisibilityStrip
 * - Marketplace card display
 * - Search ordering (future)
 * 
 * NO pricing logic here - just returns state.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse, VisibilityResponseData } from '../profiles/types';

// Default visibility state
const DEFAULT_VISIBILITY: VisibilityResponseData = {
  tier: 'basic',
  isFeatured: false,
  isPriority: false,
  addOns: [],
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<VisibilityResponseData>>> {
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
    // Will query:
    // 1. User/Profile visibility tier
    // 2. Active add-on purchases
    // 3. Listing-level add-ons
    
    // Safe default response - basic visibility
    return NextResponse.json({
      success: true,
      data: DEFAULT_VISIBILITY,
    });

  } catch (error) {
    console.error('[Visibility API] Error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Failed to fetch visibility',
    }, { status: 500 });
  }
}
