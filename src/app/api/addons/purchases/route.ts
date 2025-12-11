/**
 * THE RAIL EXCHANGE™ — Add-On Purchases API
 * 
 * GET /api/addons/purchases
 * Returns user's add-on purchases with listing info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AddOnPurchase from '@/models/AddOnPurchase';
import Listing from '@/models/Listing';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's purchases with listing info
    const purchases = await AddOnPurchase.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get listing titles for purchases with listingId
    const listingIds = purchases
      .filter(p => p.listingId)
      .map(p => p.listingId);
    
    const listings = await Listing.find({
      _id: { $in: listingIds },
    }).select('title').lean();

    const listingMap = new Map(
      listings.map(l => [l._id.toString(), l.title])
    );

    // Add listing titles to purchases
    const purchasesWithTitles = purchases.map(p => ({
      ...p,
      listingTitle: p.listingId ? listingMap.get(p.listingId.toString()) : undefined,
    }));

    return NextResponse.json({
      purchases: purchasesWithTitles,
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
