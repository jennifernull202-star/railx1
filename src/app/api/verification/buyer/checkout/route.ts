/**
 * THE RAIL EXCHANGE™ — Buyer Verification Checkout API
 * 
 * POST /api/verification/buyer/checkout
 * Creates a Stripe checkout session for $1 buyer verification.
 * 
 * FLOW:
 * 1. User clicks "Verify for $1"
 * 2. This API creates a Stripe checkout session
 * 3. User completes payment
 * 4. Webhook activates verification
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { BUYER_VERIFICATION } from '@/config/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already verified
    if (user.isVerifiedBuyer === true) {
      return NextResponse.json({ 
        error: 'You are already a verified buyer' 
      }, { status: 400 });
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

    // Get price ID from config
    const priceId = BUYER_VERIFICATION.stripePriceId;
    if (!priceId) {
      console.error('Missing Stripe price ID for buyer verification');
      return NextResponse.json({ 
        error: 'Buyer verification is not currently available. Please try again later.' 
      }, { status: 500 });
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
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/verification/buyer?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/verification/buyer?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        type: 'buyer_verification',
        productName: 'Buyer Verification',
      },
    });

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Buyer verification checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
