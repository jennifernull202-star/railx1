/**
 * THE RAIL EXCHANGE™ — ISO Request Detail API
 * 
 * Endpoints:
 * - GET: Get single ISO request
 * - PUT: Update ISO request
 * - DELETE: Delete ISO request (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ISORequest from '@/models/ISORequest';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/iso/[id]
 * Get single ISO request
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const isoRequest = await ISORequest.findById(id)
      .populate('userId', 'name email image')
      .lean();

    if (!isoRequest || isoRequest.status === 'deleted') {
      return NextResponse.json(
        { error: 'ISO request not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await ISORequest.updateOne({ _id: id }, { $inc: { viewCount: 1 } });

    return NextResponse.json({ request: isoRequest });
  } catch (error) {
    console.error('Get ISO request error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ISO request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/iso/[id]
 * Update ISO request
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const isoRequest = await ISORequest.findById(id);

    if (!isoRequest || isoRequest.status === 'deleted') {
      return NextResponse.json(
        { error: 'ISO request not found' },
        { status: 404 }
      );
    }

    // Check ownership (admins can also edit)
    const isOwner = isoRequest.userId.toString() === session.user.id;
    const isAdmin = session.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update this request' },
        { status: 403 }
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
      allowMessaging,
      status,
    } = body;

    // Update allowed fields
    if (title) isoRequest.title = title.trim();
    if (category) isoRequest.category = category;
    if (description) isoRequest.description = description.trim();
    if (location !== undefined) isoRequest.location = location;
    if (budget !== undefined) isoRequest.budget = budget;
    if (neededBy !== undefined) isoRequest.neededBy = neededBy ? new Date(neededBy) : undefined;
    if (typeof allowMessaging === 'boolean') isoRequest.allowMessaging = allowMessaging;
    if (status && ['active', 'fulfilled', 'closed'].includes(status)) {
      isoRequest.status = status;
    }

    await isoRequest.save();
    await isoRequest.populate('userId', 'name email image');

    return NextResponse.json({
      success: true,
      request: isoRequest,
    });
  } catch (error) {
    console.error('Update ISO request error:', error);
    return NextResponse.json(
      { error: 'Failed to update ISO request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/iso/[id]
 * Soft delete ISO request
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const isoRequest = await ISORequest.findById(id);

    if (!isoRequest || isoRequest.status === 'deleted') {
      return NextResponse.json(
        { error: 'ISO request not found' },
        { status: 404 }
      );
    }

    // Check ownership (admins can also delete)
    const isOwner = isoRequest.userId.toString() === session.user.id;
    const isAdmin = session.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete this request' },
        { status: 403 }
      );
    }

    // Soft delete
    isoRequest.status = 'deleted';
    await isoRequest.save();

    return NextResponse.json({
      success: true,
      message: 'ISO request deleted successfully',
    });
  } catch (error) {
    console.error('Delete ISO request error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ISO request' },
      { status: 500 }
    );
  }
}
