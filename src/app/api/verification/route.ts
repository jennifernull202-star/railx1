/**
 * THE RAIL EXCHANGE™ — Verification API Route (PUBLIC ONLY)
 * 
 * GET /api/verification?entityId=xxx
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ARCHITECTURAL NOTE: PUBLIC-FACING ENDPOINT ONLY                     │
 * │                                                                      │
 * │ This API is designed EXCLUSIVELY for:                               │
 * │ - Public profile pages (/profile/[slug])                            │
 * │ - Badge display on public listings                                  │
 * │ - Search result verification indicators                             │
 * │                                                                      │
 * │ This API is NOT for:                                                │
 * │ - Dashboard verification management UIs                            │
 * │ - Admin verification review queues                                 │
 * │ - Document upload/review workflows                                 │
 * │                                                                      │
 * │ Management UIs use auth-gated APIs:                                 │
 * │ - /api/verification/seller/status (seller dashboard)               │
 * │ - /api/admin/seller-verifications (admin queue)                    │
 * │ - /api/admin/contractors/verify (contractor admin)                 │
 * │                                                                      │
 * │ This separation is INTENTIONAL. Do not merge.                       │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * Returns AI verification status for an entity.
 * NO auth required for public status.
 * Returns safe empty data if not found.
 * 
 * AI VERIFICATION MODEL (structure only):
 * - NOT_VERIFIED: No verification submitted
 * - IN_PROGRESS: AI is reviewing documents
 * - VERIFIED: AI has validated identity + documents
 * - EXPIRED: Verification has lapsed
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse, VerificationResponseData } from '../profiles/types';

// Default empty verification state
const EMPTY_VERIFICATION: VerificationResponseData = {
  status: 'not_verified',
  certificationBadges: [],
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<VerificationResponseData>>> {
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
    // Will query verification records for the entity
    // AI verification logic is separate - this just returns state
    
    // Safe empty response - no verification data
    return NextResponse.json({
      success: true,
      data: EMPTY_VERIFICATION,
    });

  } catch (error) {
    console.error('[Verification API] Error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Failed to fetch verification status',
    }, { status: 500 });
  }
}
