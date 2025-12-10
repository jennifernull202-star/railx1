/**
 * THE RAIL EXCHANGE™ — Add-On Assignment API
 * 
 * POST /api/addons/assign
 * Assigns a purchased add-on to a specific listing.
 * 
 * PART 6 RULE 3: Once a listing is selected, system MUST automatically:
 * - Set the add-on flags on the listing
 * - Activate ranking logic sitewide
 * - Apply badges instantly
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AddOnPurchase from '@/models/AddOnPurchase';
import Listing from '@/models/Listing';
import { Types } from 'mongoose';
import { ADD_ON_TYPES, type AddOnType } from '@/config/addons';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { purchaseId, listingId } = body;

    // Validate required fields
    if (!purchaseId || !listingId) {
      return NextResponse.json(
        { error: 'Missing required fields: purchaseId, listingId' },
        { status: 400 }
      );
    }

    // Validate IDs
    if (!Types.ObjectId.isValid(purchaseId) || !Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: 'Invalid purchaseId or listingId' },
        { status: 400 }
      );
    }

    // Find the purchase
    const purchase = await AddOnPurchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (purchase.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to assign this purchase' },
        { status: 403 }
      );
    }

    // Check if purchase is active
    if (purchase.status !== 'active') {
      return NextResponse.json(
        { error: 'Purchase is not active' },
        { status: 400 }
      );
    }

    // Check if purchase already has a listing assigned
    if (purchase.listingId) {
      return NextResponse.json(
        { error: 'This add-on is already assigned to a listing' },
        { status: 400 }
      );
    }

    // Find the listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify listing ownership
    if (listing.sellerId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to add add-ons to this listing' },
        { status: 403 }
      );
    }

    // Check listing is active (not draft/archived)
    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only assign add-ons to active listings' },
        { status: 400 }
      );
    }

    // Check if listing already has this add-on type active
    const type = purchase.type as AddOnType;
    const addons = listing.premiumAddOns || {};
    
    if (type === ADD_ON_TYPES.FEATURED && addons.featured?.active) {
      return NextResponse.json(
        { error: 'This listing already has Featured placement active' },
        { status: 400 }
      );
    }
    if (type === ADD_ON_TYPES.PREMIUM && addons.premium?.active) {
      return NextResponse.json(
        { error: 'This listing already has Premium placement active' },
        { status: 400 }
      );
    }
    if (type === ADD_ON_TYPES.ELITE && addons.elite?.active) {
      return NextResponse.json(
        { error: 'This listing already has Elite placement active' },
        { status: 400 }
      );
    }

    // Update the purchase with listing reference
    purchase.listingId = new Types.ObjectId(listingId);
    await purchase.save();

    // Update listing with add-on flags (PART 6 RULE 3)
    const updateData: Record<string, unknown> = {};
    const now = new Date();
    const expiresAt = purchase.expiresAt;

    if (type === ADD_ON_TYPES.FEATURED) {
      updateData['premiumAddOns.featured'] = {
        active: true,
        expiresAt: expiresAt,
        purchasedAt: now,
      };
    } else if (type === ADD_ON_TYPES.PREMIUM) {
      // Premium includes featured
      updateData['premiumAddOns.premium'] = {
        active: true,
        expiresAt: expiresAt,
        purchasedAt: now,
      };
      updateData['premiumAddOns.featured'] = {
        active: true,
        expiresAt: expiresAt,
        purchasedAt: now,
      };
    } else if (type === ADD_ON_TYPES.ELITE) {
      // Elite includes premium and featured
      updateData['premiumAddOns.elite'] = {
        active: true,
        expiresAt: expiresAt,
        purchasedAt: now,
      };
      updateData['premiumAddOns.premium'] = {
        active: true,
        expiresAt: expiresAt,
        purchasedAt: now,
      };
      updateData['premiumAddOns.featured'] = {
        active: true,
        expiresAt: expiresAt,
        purchasedAt: now,
      };
    } else if (type === ADD_ON_TYPES.AI_ENHANCEMENT) {
      updateData['premiumAddOns.aiEnhanced'] = true;
    } else if (type === ADD_ON_TYPES.SPEC_SHEET) {
      updateData['premiumAddOns.specSheet.generated'] = true;
    }

    await Listing.findByIdAndUpdate(listingId, { $set: updateData });

    console.log(`Add-on ${type} assigned to listing ${listingId} by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Add-on assigned successfully',
      data: {
        purchaseId: purchase._id,
        listingId,
        type: purchase.type,
        expiresAt: purchase.expiresAt,
      },
    });
  } catch (error) {
    console.error('Assign add-on error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
