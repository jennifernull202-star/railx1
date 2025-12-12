/**
 * THE RAIL EXCHANGE™ — Seller Verification Checkout API
 * 
 * POST /api/verification/seller/checkout
 * 
 * Creates a Stripe checkout session for seller verification.
 * Two tiers:
 * - Standard ($29): 24-hour AI verification
 * - Priority ($49): Instant verification + 3-day ranking boost
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const VERIFICATION_PRICES = {
  standard: {
    priceId: process.env.STRIPE_PRICE_SELLER_VERIFIED || '',
    amount: 2900, // $29.00
    name: 'Standard Seller Verification',
  },
  priority: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_SELLER_VERIFIED || '',
    amount: 4900, // $49.00
    name: 'Priority Seller Verification',
  },
};

export async function POST(request: NextRequest) {
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

    // Check if already verified and not expired
    if (user.isVerifiedSeller && user.verifiedSellerStatus === 'active') {
      const expiresAt = user.verifiedSellerExpiresAt;
      if (expiresAt && new Date(expiresAt) > new Date()) {
        // Check if more than 30 days remaining
        const daysRemaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysRemaining > 30) {
          return NextResponse.json(
            { error: 'Your verification is still active. Renewal available within 30 days of expiration.' },
            { status: 400 }
          );
        }
      }
    }

    const body = await request.json();
    const { tier } = body as { tier: 'standard' | 'priority' };

    if (!tier || !['standard', 'priority'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid verification tier' }, { status: 400 });
    }

    // Get or create verification record
    let verification = await SellerVerification.findOne({ userId: user._id });
    if (!verification) {
      verification = await SellerVerification.create({
        userId: user._id,
        status: 'draft',
        verificationTier: tier,
      });
    }

    // Check for required documents
    const hasDriversLicense = verification.documents.some(d => d.type === 'drivers_license');
    const hasBusinessDoc = verification.documents.some(d => 
      d.type === 'business_license' || d.type === 'ein_document'
    );

    if (!hasDriversLicense || !hasBusinessDoc) {
      return NextResponse.json(
        { error: 'Please upload required documents before checkout' },
        { status: 400 }
      );
    }

    // Update tier selection
    verification.verificationTier = tier;
    await verification.save();

    const priceConfig = VERIFICATION_PRICES[tier];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.therailexchange.com';

    // Get or create Stripe customer
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

    // Create checkout session
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (priceConfig.priceId) {
      // Use existing Stripe price
      lineItems.push({
        price: priceConfig.priceId,
        quantity: 1,
      });
    } else {
      // Create price on the fly
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: priceConfig.name,
            description: `${tier === 'priority' ? 'Instant' : '24-hour'} AI verification for selling on The Rail Exchange. Valid for 1 year.`,
            metadata: {
              type: 'seller_verification',
              tier: tier,
            },
          },
          unit_amount: priceConfig.amount,
        },
        quantity: 1,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${baseUrl}/dashboard/verification/seller?success=true&tier=${tier}`,
      cancel_url: `${baseUrl}/dashboard/verification/seller?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        type: 'seller_verification',
        tier: tier,
        verificationId: verification._id.toString(),
      },
      payment_intent_data: {
        metadata: {
          userId: user._id.toString(),
          type: 'seller_verification',
          tier: tier,
          verificationId: verification._id.toString(),
        },
      },
    });

    // Update verification status
    verification.status = 'pending-payment';
    verification.statusHistory.push({
      status: 'pending-payment',
      changedAt: new Date(),
      reason: `Checkout session created for ${tier} tier`,
    });
    await verification.save();

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Seller verification checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
