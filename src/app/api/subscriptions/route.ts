/**
 * THE RAIL EXCHANGE™ — Subscription Management API
 * 
 * Handles Stripe Billing subscriptions for sellers and contractors.
 * - Create checkout sessions for new subscriptions
 * - Manage existing subscriptions (upgrade/downgrade/cancel)
 * - Create billing portal sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import {
  SELLER_TIER_CONFIG,
  CONTRACTOR_TIER_CONFIG,
  SELLER_TIERS,
  CONTRACTOR_TIERS,
  SellerTier,
  ContractorTier,
} from '@/config/pricing';

// Initialize Stripe lazily to avoid build-time errors
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key, {
    apiVersion: '2023-10-16',
  });
};

// ============================================================================
// GET - Get current subscription status
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build subscription info based on user role
    const subscriptionInfo: {
      sellerTier: SellerTier;
      sellerStatus: string | null;
      sellerSubscriptionId: string | null;
      contractorTier: ContractorTier;
      contractorStatus: string | null;
      contractorSubscriptionId: string | null;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
      activeListingCount: number;
      stripeCustomerId: string | null;
    } = {
      sellerTier: user.sellerTier || SELLER_TIERS.BUYER,
      sellerStatus: user.sellerSubscriptionStatus,
      sellerSubscriptionId: user.sellerSubscriptionId,
      contractorTier: user.contractorTier || CONTRACTOR_TIERS.FREE,
      contractorStatus: user.contractorSubscriptionStatus,
      contractorSubscriptionId: user.contractorSubscriptionId,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd || false,
      activeListingCount: user.activeListingCount || 0,
      stripeCustomerId: user.stripeCustomerId,
    };

    return NextResponse.json(subscriptionInfo);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create checkout session for new subscription
// ============================================================================

// Helper function to get price IDs at runtime
function getStripePriceId(type: 'seller' | 'contractor', tier: string, period: 'monthly' | 'yearly'): string {
  const priceMap: Record<string, string | undefined> = {
    // Seller prices
    'seller_basic_monthly': process.env.STRIPE_PRICE_SELLER_BASIC_MONTHLY,
    'seller_basic_yearly': process.env.STRIPE_PRICE_SELLER_BASIC_YEARLY,
    'seller_plus_monthly': process.env.STRIPE_PRICE_SELLER_PLUS_MONTHLY,
    'seller_plus_yearly': process.env.STRIPE_PRICE_SELLER_PLUS_YEARLY,
    'seller_pro_monthly': process.env.STRIPE_PRICE_SELLER_PRO_MONTHLY,
    'seller_pro_yearly': process.env.STRIPE_PRICE_SELLER_PRO_YEARLY,
    // Contractor prices
    'contractor_verified_monthly': process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_MONTHLY,
    'contractor_verified_yearly': process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_YEARLY,
  };
  
  const key = `${type}_${tier}_${period}`;
  return priceMap[key] || '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, type, billingPeriod = 'monthly' } = body;

    // Validate type
    if (!['seller', 'contractor'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid subscription type' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the appropriate tier config and price ID at runtime
    let tierConfig;
    let priceId;

    if (type === 'seller') {
      tierConfig = SELLER_TIER_CONFIG[tier as SellerTier];
      if (!tierConfig) {
        return NextResponse.json({ error: 'Invalid seller tier' }, { status: 400 });
      }
      // Get price ID at runtime from env vars
      priceId = getStripePriceId('seller', tier, billingPeriod);
    } else {
      tierConfig = CONTRACTOR_TIER_CONFIG[tier as ContractorTier];
      if (!tierConfig) {
        return NextResponse.json({ error: 'Invalid contractor tier' }, { status: 400 });
      }
      // Get price ID at runtime from env vars
      priceId = getStripePriceId('contractor', tier, billingPeriod);
    }

    // Log for debugging
    console.log('Checkout request:', { type, tier, billingPeriod, priceId: priceId ? 'found' : 'missing' });

    // Check if this is a free tier (no checkout needed)
    if (tierConfig.priceMonthly === 0) {
      // Update user directly for free tier
      if (type === 'seller') {
        user.sellerTier = tier;
        user.sellerSubscriptionStatus = null;
        // Also update role if they were a buyer
        if (user.role === 'buyer') {
          user.role = 'seller';
        }
      } else {
        user.contractorTier = tier;
        user.contractorSubscriptionStatus = null;
      }
      await user.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Free tier activated',
        tier 
      });
    }

    // Ensure we have a valid price ID
    if (!priceId) {
      console.error(`Missing Stripe price ID for ${type}_${tier}_${billingPeriod}`);
      return NextResponse.json(
        { error: `Stripe price ID not configured for ${tier} (${billingPeriod}). Please contact support.` },
        { status: 400 }
      );
    }

    // Get Stripe instance
    const stripe = getStripe();

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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id.toString(),
        subscriptionType: type,
        tier: tier,
      },
      success_url: `${baseUrl}/dashboard?subscription=success&tier=${tier}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          subscriptionType: type,
          tier: tier,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update subscription (upgrade/downgrade)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, type, newTier } = body;

    await connectDB();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get Stripe instance
    const stripe = getStripe();

    if (action === 'cancel') {
      // Cancel subscription at period end
      const subscriptionId = type === 'seller' 
        ? user.sellerSubscriptionId 
        : user.contractorSubscriptionId;

      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'No active subscription to cancel' },
          { status: 400 }
        );
      }

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      user.subscriptionCancelAtPeriodEnd = true;
      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription will be canceled at period end' 
      });
    }

    if (action === 'reactivate') {
      // Reactivate a subscription that was set to cancel
      const subscriptionId = type === 'seller' 
        ? user.sellerSubscriptionId 
        : user.contractorSubscriptionId;

      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'No subscription to reactivate' },
          { status: 400 }
        );
      }

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      user.subscriptionCancelAtPeriodEnd = false;
      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription reactivated' 
      });
    }

    if (action === 'change_plan') {
      // Change to a different plan (upgrade/downgrade)
      const subscriptionId = type === 'seller' 
        ? user.sellerSubscriptionId 
        : user.contractorSubscriptionId;

      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'No active subscription to change' },
          { status: 400 }
        );
      }

      // Get new price ID
      let newPriceId;
      if (type === 'seller') {
        const tierConfig = SELLER_TIER_CONFIG[newTier as SellerTier];
        newPriceId = tierConfig?.stripePriceIdMonthly;
      } else {
        const tierConfig = CONTRACTOR_TIER_CONFIG[newTier as ContractorTier];
        newPriceId = tierConfig?.stripePriceIdMonthly;
      }

      if (!newPriceId) {
        return NextResponse.json(
          { error: 'Invalid tier or price not configured' },
          { status: 400 }
        );
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update subscription with new price
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        metadata: {
          tier: newTier,
        },
      });

      // Update user's tier
      if (type === 'seller') {
        user.sellerTier = newTier;
      } else {
        user.contractorTier = newTier;
      }
      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: `Plan changed to ${newTier}`,
        newTier 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
