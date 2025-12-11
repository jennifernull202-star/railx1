/**
 * THE RAIL EXCHANGE™ — Add-Ons API
 * 
 * Purchase add-ons for listings and contractors.
 * Handles pricing, Stripe integration, and activation.
 * 
 * IMPORTANT: All pricing comes from /src/config/addons.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AddOnPurchase from '@/models/AddOnPurchase';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { Types } from 'mongoose';
import {
  ADD_ON_TYPES,
  ADD_ON_PRICING,
  ADD_ON_DURATION,
  ADD_ON_METADATA,
  STRIPE_ADDON_PRICE_IDS,
  formatAddOnPrice,
  formatAddOnDuration,
  calculateExpirationDate,
  type AddOnType,
} from '@/config/addons';

// Initialize Stripe lazily to avoid build-time errors
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key);
};

// GET /api/addons - Get add-on info and user's purchases
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const contractorId = searchParams.get('contractorId');

    // Always return add-on info for display using config
    const addOnInfo = Object.entries(ADD_ON_METADATA).map(([type, info]) => ({
      type,
      ...info,
      price: ADD_ON_PRICING[type as AddOnType],
      priceFormatted: formatAddOnPrice(type as AddOnType),
      duration: ADD_ON_DURATION[type as AddOnType],
      durationLabel: formatAddOnDuration(type as AddOnType),
    }));

    // If user is authenticated, include their purchases
    let userPurchases: unknown[] = [];
    let activeListing: string[] = [];
    let activeContractor: string[] = [];

    if (session?.user?.id) {
      await connectDB();

      // Build query for user's purchases
      const query: Record<string, unknown> = { userId: session.user.id };
      if (listingId && Types.ObjectId.isValid(listingId)) {
        query.listingId = new Types.ObjectId(listingId);
      }
      if (contractorId && Types.ObjectId.isValid(contractorId)) {
        query.contractorId = new Types.ObjectId(contractorId);
      }

      userPurchases = await AddOnPurchase.find(query)
        .sort({ createdAt: -1 })
      if (contractorId && Types.ObjectId.isValid(contractorId)) {
        query.contractorId = new Types.ObjectId(contractorId);
      }

      userPurchases = await AddOnPurchase.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Get active add-ons for specific listing/contractor
      if (listingId && Types.ObjectId.isValid(listingId)) {
        const activeAddOns = await AddOnPurchase.find({
          listingId: new Types.ObjectId(listingId),
          status: 'active',
          $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null },
          ],
        }).select('type');
        activeListing = activeAddOns.map((a) => a.type);
      }

      if (contractorId && Types.ObjectId.isValid(contractorId)) {
        const activeAddOns = await AddOnPurchase.find({
          contractorId: new Types.ObjectId(contractorId),
          status: 'active',
          $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null },
          ],
        }).select('type');
        activeContractor = activeAddOns.map((a) => a.type);
      }
    }

    return NextResponse.json({
      addOns: addOnInfo,
      purchases: userPurchases,
      activeListing,
      activeContractor,
    });
  } catch (error) {
    console.error('Get add-ons error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/addons/purchase - Purchase an add-on
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { type, listingId, contractorId } = body;

    // Validate add-on type
    if (!type || !Object.values(ADD_ON_TYPES).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid add-on type' },
        { status: 400 }
      );
    }

    // Verify at least one target is provided
    if (!listingId && !contractorId) {
      return NextResponse.json(
        { error: 'Must specify listingId or contractorId' },
        { status: 400 }
      );
    }

    // Verify listing ownership if provided
    if (listingId) {
      if (!Types.ObjectId.isValid(listingId)) {
        return NextResponse.json(
          { error: 'Invalid listing ID' },
          { status: 400 }
        );
      }

      const listing = await Listing.findById(listingId);
      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      if (listing.sellerId.toString() !== session.user.id && !session.user.isAdmin) {
        return NextResponse.json(
          { error: 'Not authorized to purchase add-ons for this listing' },
          { status: 403 }
        );
      }

      // Check for existing active add-on of same type
      const existing = await AddOnPurchase.findOne({
        listingId: new Types.ObjectId(listingId),
        type,
        status: 'active',
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null },
        ],
      });

      if (existing) {
        return NextResponse.json(
          { error: 'This listing already has an active add-on of this type' },
          { status: 400 }
        );
      }
    }

    // Get pricing from config
    const amount = ADD_ON_PRICING[type as AddOnType];
    const stripePriceId = STRIPE_ADDON_PRICE_IDS[type as AddOnType];

    // Calculate expiration using config helper
    const expiresAt = calculateExpirationDate(type as AddOnType);

    // Create pending purchase record
    const purchase = new AddOnPurchase({
      userId: new Types.ObjectId(session.user.id),
      listingId: listingId ? new Types.ObjectId(listingId) : undefined,
      contractorId: contractorId ? new Types.ObjectId(contractorId) : undefined,
      type,
      amount,
      currency: 'usd',
      status: 'pending', // Will be activated via webhook
      startedAt: null, // Set when payment confirmed
      expiresAt: null, // Set when payment confirmed
    });

    await purchase.save();

    // Check if Stripe price ID is configured
    if (!stripePriceId) {
      // No Stripe integration yet - activate immediately for testing
      // This allows testing without Stripe configuration
      console.warn(`No Stripe price ID for add-on: ${type}. Activating for testing.`);
      purchase.status = 'active';
      purchase.startedAt = new Date();
      purchase.expiresAt = expiresAt;
      await purchase.save();

      // Update listing with add-on flags
      if (listingId) {
        await updateListingAddOns(listingId, type as AddOnType, purchase.expiresAt);
      }

      return NextResponse.json(
        {
          success: true,
          testMode: true,
          purchase: {
            id: purchase._id,
            type: purchase.type,
            status: purchase.status,
            expiresAt: purchase.expiresAt,
            amount: purchase.amount,
            priceFormatted: formatAddOnPrice(type as AddOnType),
          },
          message: `Test Mode: ${ADD_ON_METADATA[type as AddOnType].name} activated. Configure Stripe price IDs for production.`,
        },
        { status: 201 }
      );
    }

    // Get Stripe instance
    const stripe = getStripe();

    // Get or create Stripe customer
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session for one-time payment
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // PART 6 RULE 1: Purchasing an add-on MUST NOT auto-apply to a listing
    // After checkout, redirect to addons page for listing selection
    // If listingId was provided at purchase time, we still redirect to selection
    // to confirm the choice and allow changing it
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment', // One-time payment, not subscription
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id.toString(),
        purchaseId: purchase._id.toString(),
        purchaseType: 'addon',
        addonType: type,
        // Don't include listingId in metadata - user must select after payment
        listingId: '', // Intentionally empty - selection happens post-checkout
        contractorId: contractorId || '',
      },
      // Redirect to My Add-Ons page for listing selection (PART 6 RULE 1)
      success_url: `${baseUrl}/dashboard/addons?addon=success&type=${type}`,
      cancel_url: `${baseUrl}/dashboard/upgrade?addon=canceled`,
    });

    // Save stripe session ID to purchase
    purchase.stripeSessionId = checkoutSession.id;
    await purchase.save();

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      purchaseId: purchase._id,
    });
  } catch (error) {
    console.error('Purchase add-on error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update listing with add-on flags
async function updateListingAddOns(listingId: string, type: AddOnType, expiresAt: Date | null) {
  const updateData: Record<string, unknown> = {};
  
  if (type === ADD_ON_TYPES.FEATURED) {
    updateData['premiumAddOns.featured'] = {
      active: true,
      expiresAt: expiresAt,
    };
  } else if (type === ADD_ON_TYPES.PREMIUM) {
    updateData['premiumAddOns.premium'] = {
      active: true,
      expiresAt: expiresAt,
    };
    // Premium also gets featured
    updateData['premiumAddOns.featured'] = {
      active: true,
      expiresAt: expiresAt,
    };
  } else if (type === ADD_ON_TYPES.ELITE) {
    updateData['premiumAddOns.elite'] = {
      active: true,
      expiresAt: expiresAt,
    };
    // Elite gets premium and featured
    updateData['premiumAddOns.premium'] = {
      active: true,
      expiresAt: expiresAt,
    };
    updateData['premiumAddOns.featured'] = {
      active: true,
      expiresAt: expiresAt,
    };
  } else if (type === ADD_ON_TYPES.AI_ENHANCEMENT) {
    updateData['premiumAddOns.aiEnhanced'] = true;
  } else if (type === ADD_ON_TYPES.SPEC_SHEET) {
    updateData['premiumAddOns.specSheet'] = true;
  }

  if (Object.keys(updateData).length > 0) {
    await Listing.findByIdAndUpdate(listingId, { $set: updateData });
  }
}
