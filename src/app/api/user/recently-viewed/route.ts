/**
 * THE RAIL EXCHANGE™ — Recently Viewed API
 * 
 * BUYER AUDIT IMPLEMENTATION: Track and retrieve recently viewed listings
 * 
 * POST /api/user/recently-viewed - Add listing to recently viewed
 * GET /api/user/recently-viewed - Get recently viewed listings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import mongoose from 'mongoose';

const MAX_RECENTLY_VIEWED = 50;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recentlyViewedIds = (user.recentlyViewed || [])
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 20)
      .map(rv => rv.listingId);

    const listings = await Listing.find({
      _id: { $in: recentlyViewedIds },
    })
      .select('title slug category condition primaryImageUrl price location equipment quantity daysOnMarket createdAt isActive status')
      .populate('sellerId', 'name isVerifiedSeller')
      .lean();

    // Sort by view order
    const listingMap = new Map(listings.map(l => [l._id.toString(), l]));
    const orderedListings = recentlyViewedIds
      .map(id => listingMap.get(id.toString()))
      .filter(Boolean);

    // Add view timestamp to each listing
    const viewTimestamps = new Map(
      (user.recentlyViewed || []).map(rv => [rv.listingId.toString(), rv.viewedAt])
    );

    const enrichedListings = orderedListings.map(listing => ({
      ...listing,
      viewedAt: viewTimestamps.get((listing as { _id: mongoose.Types.ObjectId })._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      data: {
        listings: enrichedListings,
        total: enrichedListings.length,
      },
    });
  } catch (error) {
    console.error('Get recently viewed error:', error);
    return NextResponse.json(
      { error: 'Failed to get recently viewed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize if doesn't exist
    if (!user.recentlyViewed) {
      user.recentlyViewed = [];
    }

    // Remove if already exists (to update timestamp)
    user.recentlyViewed = user.recentlyViewed.filter(
      rv => rv.listingId.toString() !== listingId
    );

    // Add to front
    user.recentlyViewed.unshift({
      listingId: new mongoose.Types.ObjectId(listingId),
      viewedAt: new Date(),
    });

    // Trim to max
    if (user.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
      user.recentlyViewed = user.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Added to recently viewed',
    });
  } catch (error) {
    console.error('Add recently viewed error:', error);
    return NextResponse.json(
      { error: 'Failed to add to recently viewed' },
      { status: 500 }
    );
  }
}
