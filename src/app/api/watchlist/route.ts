/**
 * THE RAIL EXCHANGE™ — Watchlist API
 * 
 * Manage user's saved listings (watchlist).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import WatchlistItem from '@/models/WatchlistItem';
import Listing from '@/models/Listing';
import { Types } from 'mongoose';

// GET /api/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';

    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      console.error('Session fetch error in watchlist:', error);
      // Return safe default for countOnly requests
      if (countOnly) {
        return NextResponse.json({ success: true, data: { count: 0 } });
      }
      return NextResponse.json({ error: 'Session error' }, { status: 500 });
    }

    if (!session?.user?.id) {
      // Return safe default for countOnly requests (not logged in = 0 items)
      if (countOnly) {
        return NextResponse.json({ success: true, data: { count: 0 } });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ObjectId format to prevent Mongoose errors
    const { Types } = await import('mongoose');
    if (!Types.ObjectId.isValid(session.user.id)) {
      console.warn('Invalid user ID format in watchlist:', session.user.id);
      if (countOnly) {
        return NextResponse.json({ success: true, data: { count: 0 } });
      }
      return NextResponse.json({ success: true, data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
    }

    await connectDB();

    // Handle countOnly requests efficiently
    if (countOnly) {
      const count = await WatchlistItem.countDocuments({ userId: session.user.id });
      return NextResponse.json({ success: true, data: { count } });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;

    // Get watchlist items with populated listing data
    const [items, total] = await Promise.all([
      WatchlistItem.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'listingId',
          select: 'title slug category condition primaryImageUrl price location status viewCount',
        })
        .lean(),
      WatchlistItem.countDocuments({ userId: session.user.id }),
    ]);

    // Filter out items where listing no longer exists
    const validItems = items.filter((item) => item.listingId);

    return NextResponse.json({
      success: true,
      data: {
        items: validItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST /api/watchlist - Add listing to watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { listingId, notes, notifyOnPriceChange, notifyOnStatusChange } = body;

    if (!listingId || !Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: 'Valid listing ID is required' },
        { status: 400 }
      );
    }

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if already in watchlist
    const existing = await WatchlistItem.findOne({
      userId: session.user.id,
      listingId,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Listing already in watchlist', item: existing },
        { status: 409 }
      );
    }

    // Create watchlist item
    const item = new WatchlistItem({
      userId: new Types.ObjectId(session.user.id),
      listingId: new Types.ObjectId(listingId),
      notes: notes || '',
      notifyOnPriceChange: notifyOnPriceChange !== false,
      notifyOnStatusChange: notifyOnStatusChange !== false,
      lastPrice: listing.price?.amount,
    });

    await item.save();

    // Increment save count on listing
    await Listing.findByIdAndUpdate(listingId, {
      $inc: { saveCount: 1 },
    });

    // Populate listing for response
    await item.populate('listingId', 'title slug primaryImageUrl price');

    return NextResponse.json(
      {
        success: true,
        message: 'Added to watchlist',
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlist - Remove listing from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId || !Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: 'Valid listing ID is required' },
        { status: 400 }
      );
    }

    const result = await WatchlistItem.findOneAndDelete({
      userId: session.user.id,
      listingId,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Item not found in watchlist' },
        { status: 404 }
      );
    }

    // Decrement save count on listing
    await Listing.findByIdAndUpdate(listingId, {
      $inc: { saveCount: -1 },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
