/**
 * THE RAIL EXCHANGE™ — Contractors List API
 * 
 * GET /api/contractors
 * Returns list of published contractors with optional filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const service = searchParams.get('service');
    const region = searchParams.get('region');
    const state = searchParams.get('state');
    const verifiedOnly = searchParams.get('verified') === 'true';
    const search = searchParams.get('search');

    // Build query
    const query: Record<string, unknown> = {
      isPublished: true,
      isActive: true,
    };

    if (service) {
      query.services = { $in: [service] };
    }

    if (region) {
      query.regionsServed = { $in: [region] };
    }

    if (state) {
      query['address.state'] = state;
    }

    if (verifiedOnly) {
      query.verificationStatus = 'verified';
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [contractors, total] = await Promise.all([
      ContractorProfile.find(query)
        .sort({ 
          verifiedBadgePurchased: -1, 
          verificationStatus: 1, 
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
