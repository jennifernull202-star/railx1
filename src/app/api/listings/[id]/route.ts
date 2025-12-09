/**
 * THE RAIL EXCHANGE™ — Single Listing API
 * 
 * GET: Get listing by ID or slug
 * PUT: Update listing
 * DELETE: Delete listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/listings/[id]
 * Get a single listing by ID or slug
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    // Try to find by ID or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const listing = await Listing.findOne(
      isObjectId ? { _id: id } : { slug: id }
    ).populate('sellerId', 'name email image');

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if listing is viewable
    const isOwner = session?.user?.id === listing.sellerId._id.toString();
    const isAdmin = session?.user?.role === 'admin';

    if (!listing.isActive && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.status !== 'active' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Listing not available' },
        { status: 404 }
      );
    }

    // Increment view count for non-owners
    if (!isOwner && listing.status === 'active') {
      await Listing.updateOne({ _id: listing._id }, { $inc: { viewCount: 1 } });
    }

    // Return listing with ownership flag
    return NextResponse.json({
      success: true,
      data: {
        ...listing.toJSON(),
        isOwner,
      },
    });
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/listings/[id]
 * Update a listing
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    // Find listing
    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const isOwner = session.user.id === listing.sellerId.toString();
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this listing' },
        { status: 403 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      'title',
      'description',
      'category',
      'subcategory',
      'condition',
      'status',
      'price',
      'location',
      'media',
      'specifications',
      'quantity',
      'quantityUnit',
      'sku',
      'shippingOptions',
      'tags',
      'keywords',
    ];

    // Admin-only fields
    const adminOnlyFields = [
      'isActive',
      'isFlagged',
      'flagReason',
      'premiumAddOns',
    ];

    // Apply updates
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (listing as unknown as Record<string, unknown>)[field] = body[field];
      }
    }

    // Apply admin-only updates
    if (isAdmin) {
      for (const field of adminOnlyFields) {
        if (body[field] !== undefined) {
          (listing as unknown as Record<string, unknown>)[field] = body[field];
        }
      }
    }

    // Handle publishing
    if (body.status === 'active' && listing.status !== 'active') {
      listing.publishedAt = new Date();
      // Set expiration to 90 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      listing.expiresAt = expiresAt;
    }

    await listing.save();

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully',
      data: listing,
    });
  } catch (error) {
    console.error('Update listing error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]
 * Delete a listing (soft delete by setting isActive = false)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    // Find listing
    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const isOwner = session.user.id === listing.sellerId.toString();
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this listing' },
        { status: 403 }
      );
    }

    // Soft delete
    listing.isActive = false;
    listing.status = 'archived';
    await listing.save();

    // Decrement user's active listing count
    await User.findByIdAndUpdate(listing.sellerId, {
      $inc: { activeListingCount: -1 },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
