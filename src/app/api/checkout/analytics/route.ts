/**
 * THE RAIL EXCHANGE™ — Analytics Add-On Checkout API
 * 
 * Creates a Stripe checkout session for purchasing the Seller Analytics add-on.
 * This is a user-level add-on (not listing-specific).
 * 
 * POST /api/checkout/analytics
 * 
 * ENTITLEMENT RULES:
 * - Only verified sellers can purchase
 * - Professionals (Contractor = Company) already have analytics included
 * - Buyers cannot purchase
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AddOnPurchase from '@/models/AddOnPurchase';
import { ADD_ON_TYPES, STRIPE_ADDON_PRICE_IDS } from '@/config/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is eligible for analytics add-on
    const isContractor = user.isContractor === true;
    const isCompany = !!user.company && user.sellerTier === 'enterprise';
    const isVerifiedSeller = user.isVerifiedSeller === true;
    const isBuyer = !isContractor && !isCompany && !isVerifiedSeller && user.sellerTier === 'buyer';
    
    // Professional = contractor tier 'professional', 'platform', 'priority' OR enterprise seller
    const isProfessional = user.contractorTier === 'professional' || 
                           user.contractorTier === 'platform' || 
                           user.contractorTier === 'priority' ||
                           isCompany;

    // Buyers cannot purchase analytics
    if (isBuyer) {
      return NextResponse.json({ 
        error: 'Analytics is not available for buyer accounts. Please verify as a seller first.' 
      }, { status: 403 });
    }

    // Professionals already have analytics included
    if ((isContractor || isCompany) && isProfessional) {
      return NextResponse.json({ 
        error: 'Analytics is already included in your Professional plan.' 
      }, { status: 400 });
    }

    // Only verified sellers can purchase
    if (!isVerifiedSeller) {
      return NextResponse.json({ 
        error: 'Please complete seller verification before purchasing analytics.' 
      }, { status: 403 });
    }

    // Check if user already has an active analytics add-on
    const existingAddOn = await AddOnPurchase.findOne({
      userId: user._id,
      type: ADD_ON_TYPES.SELLER_ANALYTICS,
      status: 'active',
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null },
      ],
    });

    if (existingAddOn) {
      return NextResponse.json({ 
        error: 'You already have an active analytics subscription.',
        expiresAt: existingAddOn.expiresAt,
      }, { status: 400 });
    }

    // Get Stripe price ID for analytics add-on
    const priceId = STRIPE_ADDON_PRICE_IDS[ADD_ON_TYPES.SELLER_ANALYTICS];
    if (!priceId) {
      console.error('Missing Stripe price ID for seller analytics');
      return NextResponse.json({ 
        error: 'Analytics add-on is not currently available. Please try again later.' 
      }, { status: 500 });
    }

    // Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(user._id, { stripeCustomerId });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/analytics?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/analytics?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        addonType: ADD_ON_TYPES.SELLER_ANALYTICS,
        productName: 'Seller Analytics Access',
      },
    });

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Analytics checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
