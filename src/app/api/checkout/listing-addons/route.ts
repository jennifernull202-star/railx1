/**
 * THE RAIL EXCHANGE™ — Listing Add-ons Checkout API
 * 
 * POST /api/checkout/listing-addons
 * 
 * Creates a Stripe checkout session for listing add-ons.
 * Called when seller selects add-ons during publish.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import { STRIPE_ADDON_PRICE_IDS, ADD_ON_TYPES, ADD_ON_PRICING } from '@/config/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { listingId, addons, successUrl, cancelUrl } = body;

    if (!listingId || !addons || !Array.isArray(addons) || addons.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify listing exists and belongs to user
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.sellerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    for (const addonId of addons) {
      const priceId = STRIPE_ADDON_PRICE_IDS[addonId as keyof typeof STRIPE_ADDON_PRICE_IDS];
      
      if (priceId) {
        // Use existing Stripe price
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      } else {
        // Fallback to price_data for add-ons without Stripe price IDs
        const price = ADD_ON_PRICING[addonId as keyof typeof ADD_ON_PRICING];
        if (price) {
          const addonNames: Record<string, string> = {
            [ADD_ON_TYPES.FEATURED]: 'Featured Listing (30 days)',
            [ADD_ON_TYPES.PREMIUM]: 'Premium Placement (30 days)',
            [ADD_ON_TYPES.ELITE]: 'Elite Placement (30 days)',
            [ADD_ON_TYPES.AI_ENHANCEMENT]: 'AI Listing Enhancement',
            [ADD_ON_TYPES.SPEC_SHEET]: 'Spec Sheet PDF',
            [ADD_ON_TYPES.VERIFIED_BADGE]: 'Verified Asset Badge (30 days)',
          };
          
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: addonNames[addonId] || addonId,
                description: `Add-on for: ${listing.title}`,
              },
              unit_amount: price,
            },
            quantity: 1,
          });
        }
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid add-ons selected' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email || undefined,
      line_items: lineItems,
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/listings/${listing.slug}?addons=success`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/listings/${listing.slug}?addons=cancelled`,
      metadata: {
        type: 'listing_addons',
        listingId: listingId,
        userId: session.user.id,
        addons: JSON.stringify(addons),
      },
      payment_intent_data: {
        metadata: {
          type: 'listing_addons',
          listingId: listingId,
          userId: session.user.id,
          addons: JSON.stringify(addons),
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Listing add-ons checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
