/**
 * THE RAIL EXCHANGE™ — Cart Checkout API
 * 
 * Creates a Stripe checkout session for multiple items:
 * - Subscriptions (recurring)
 * - Add-ons (one-time)
 * 
 * POST /api/checkout/cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import {
  ADD_ON_TYPES,
  ADD_ON_PRICING,
} from '@/config/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartItem {
  type: 'subscription' | 'addon';
  tier?: string;
  period?: 'monthly' | 'yearly';
  addonType?: string;
  listingId?: string;
}

// Get Stripe price ID from environment at runtime
function getStripePriceId(type: 'seller' | 'contractor', tier: string, period: string): string {
  const envKey = `STRIPE_PRICE_${type.toUpperCase()}_${tier.toUpperCase()}_${period.toUpperCase()}`;
  return process.env[envKey] || '';
}

// Get add-on Stripe price ID
// Elite is the ONLY placement tier (no Premium/Featured tiers)
function getAddonPriceId(addonType: string): string {
  const addonMap: Record<string, string> = {
    [ADD_ON_TYPES.ELITE]: process.env.STRIPE_PRICE_ADDON_ELITE || '',
    [ADD_ON_TYPES.AI_ENHANCEMENT]: process.env.STRIPE_PRICE_ADDON_AI || '',
    [ADD_ON_TYPES.SPEC_SHEET]: process.env.STRIPE_PRICE_ADDON_SPEC || '',
    [ADD_ON_TYPES.VERIFIED_BADGE]: process.env.STRIPE_PRICE_ADDON_VERIFIED || '',
  };
  return addonMap[addonType] || '';
}

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

    const body = await request.json();
    const { items } = body as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Validate items and build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const subscriptionItems: CartItem[] = [];
    const oneTimeItems: CartItem[] = [];

    for (const item of items) {
      if (item.type === 'subscription') {
        if (!item.tier || !item.period) {
          return NextResponse.json({ error: 'Invalid subscription item' }, { status: 400 });
        }
        subscriptionItems.push(item);
      } else if (item.type === 'addon') {
        if (!item.addonType || !item.listingId) {
          return NextResponse.json({ error: 'Invalid addon item' }, { status: 400 });
        }
        // Verify listing exists and belongs to user
        const listing = await Listing.findOne({ _id: item.listingId, seller: user._id });
        if (!listing) {
          return NextResponse.json({ error: `Listing not found: ${item.listingId}` }, { status: 404 });
        }
        oneTimeItems.push(item);
      }
    }

    // Can only have one subscription
    if (subscriptionItems.length > 1) {
      return NextResponse.json({ error: 'Only one subscription allowed' }, { status: 400 });
    }

    // Build subscription line item
    if (subscriptionItems.length === 1) {
      const sub = subscriptionItems[0];
      const priceId = getStripePriceId('seller', sub.tier!, sub.period!);
      
      if (!priceId) {
        console.error('Missing price ID for:', { type: 'seller', tier: sub.tier, period: sub.period });
        return NextResponse.json({ error: 'Invalid subscription configuration' }, { status: 400 });
      }

      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    }

    // Build add-on line items
    for (const addon of oneTimeItems) {
      const priceId = getAddonPriceId(addon.addonType!);
      
      if (!priceId) {
        // If no Stripe price, create a price on the fly
        const price = ADD_ON_PRICING[addon.addonType as keyof typeof ADD_ON_PRICING] || 0;
        if (price <= 0) {
          return NextResponse.json({ error: `Invalid add-on: ${addon.addonType}` }, { status: 400 });
        }

        // Use price_data for dynamic pricing
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${addon.addonType} Add-on`,
              description: `Listing boost for listing ID: ${addon.listingId}`,
              metadata: {
                addonType: addon.addonType!,
                listingId: addon.listingId!,
              },
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        });
      } else {
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 });
    }

    // Determine checkout mode
    const hasSubscription = subscriptionItems.length > 0;
    const hasOneTime = oneTimeItems.length > 0;
    
    // Stripe requires either subscription mode (for recurring) or payment mode (for one-time)
    // If we have both, we need to use subscription mode and add one-time items
    // However, Stripe doesn't support mixing one-time and recurring in same checkout easily
    // So we'll handle this by creating separate sessions or using subscription mode with invoice items
    
    // For now, if there's a subscription, use subscription mode
    // Add-ons will be handled separately or through invoice
    
    let mode: 'subscription' | 'payment' = hasSubscription ? 'subscription' : 'payment';
    
    // If mixing, we'll only process subscription for now
    // Add-ons can be processed through separate flow
    if (hasSubscription && hasOneTime) {
      // For mixed cart, we'll need to handle add-ons separately
      // Store add-on info in metadata for webhook processing
      mode = 'subscription';
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create metadata for cart items
    const metadata: Record<string, string> = {
      userId: user._id.toString(),
      cartItemCount: items.length.toString(),
    };

    // Add subscription info
    if (subscriptionItems.length > 0) {
      const sub = subscriptionItems[0];
      metadata.subscriptionTier = sub.tier!;
      metadata.subscriptionPeriod = sub.period!;
      metadata.subscriptionType = 'seller';
    }

    // Add addon info (limited by Stripe metadata size)
    oneTimeItems.forEach((addon, index) => {
      if (index < 5) { // Limit to 5 addons in metadata
        metadata[`addon_${index}_type`] = addon.addonType!;
        metadata[`addon_${index}_listing`] = addon.listingId!;
      }
    });
    metadata.addonCount = oneTimeItems.length.toString();

    // Create appropriate line items based on mode
    let finalLineItems = lineItems;
    if (mode === 'subscription' && hasOneTime) {
      // Only include subscription in line items
      // Add-ons will be added as invoice items after checkout
      finalLineItems = lineItems.filter((_, i) => i === 0); // Keep only first (subscription)
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.therailexchange.com';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      line_items: mode === 'payment' ? lineItems : finalLineItems,
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/upgrade?checkout=cancelled`,
      metadata,
      subscription_data: mode === 'subscription' ? {
        metadata: {
          userId: user._id.toString(),
          tier: subscriptionItems[0]?.tier || '',
          type: 'seller',
        },
      } : undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    // If we have add-ons with a subscription, we'll process them via webhook
    // Store pending add-ons info in user record for webhook to pick up
    if (hasSubscription && hasOneTime) {
      user.pendingAddons = oneTimeItems.map(addon => ({
        addonType: addon.addonType,
        listingId: addon.listingId,
        checkoutSessionId: checkoutSession.id,
      }));
      await user.save();
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Cart checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
