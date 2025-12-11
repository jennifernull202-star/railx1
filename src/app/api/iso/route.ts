/**
 * THE RAIL EXCHANGE™ — ISO (In Search Of) Request API
 * 
 * Lightweight "wanted" posts - available for ALL membership tiers (free).
 * 
 * Endpoints:
 * - GET: List ISO requests (with filtering)
 * - POST: Create new ISO request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ISORequest, { ISOCategory } from '@/models/ISORequest';

/**
 * GET /api/iso
 * List ISO requests with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') as ISOCategory | null;
    const status = searchParams.get('status') || 'active';
    const userId = searchParams.get('userId');

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (userId) {
      query.userId = userId;
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      ISORequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email image')
        .lean(),
      ISORequest.countDocuments(query),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get ISO requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ISO requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/iso
 * Create new ISO request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      category,
      description,
      location,
      budget,
      neededBy,
      allowMessaging = true,
    } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.length < 5) {
      return NextResponse.json(
        { error: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const isoRequest = await ISORequest.create({
      userId: session.user.id,
      title: title.trim(),
      category,
      description: description.trim(),
      location: location || {},
      budget: budget || undefined,
      neededBy: neededBy ? new Date(neededBy) : undefined,
      allowMessaging,
      status: 'active',
    });

    // Populate user data
    await isoRequest.populate('userId', 'name email image');

    return NextResponse.json({
      success: true,
      request: isoRequest,
    }, { status: 201 });
  } catch (error) {
    console.error('Create ISO request error:', error);
    return NextResponse.json(
      { error: 'Failed to create ISO request' },
      { status: 500 }
    );
  }
}
