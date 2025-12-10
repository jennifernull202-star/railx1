/**
 * THE RAIL EXCHANGE™ — Promo Code Validation API
 * 
 * Validates promo codes against Stripe and returns discount info.
 * 
 * RAILXFREE Configuration:
 * - 100% off first month
 * - Applies ONLY to Seller Pro tier
 * - Limited to 50 total redemptions
 * - Syncs with Stripe coupon ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';

// Initialize Stripe lazily
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key, {});
};

// Promo code configuration
const PROMO_CONFIGS: Record<string, {
  appliesTo: string[];
  description: string;
  maxRedemptions?: number;
}> = {
  'RAILXFREE': {
    appliesTo: ['pro'], // Only applies to Seller Pro
    description: 'First month free for Seller Pro',
    maxRedemptions: 50,
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, tier } = body;

    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promo code is required' 
      }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();
    const stripe = getStripe();

    // First check our config for tier restrictions
    const promoConfig = PROMO_CONFIGS[normalizedCode];
    if (promoConfig && tier) {
      // Check if the promo applies to the selected tier
      if (!promoConfig.appliesTo.includes(tier.toLowerCase())) {
        return NextResponse.json({
          valid: false,
          error: `This promo code only applies to ${promoConfig.appliesTo.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} plan(s)`,
        });
      }
    }

    // Look up the promotion code in Stripe
    const promoCodes = await stripe.promotionCodes.list({
      code: normalizedCode,
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'], // Expand coupon details
    });

    if (promoCodes.data.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired promo code',
      });
    }

    const promoCode = promoCodes.data[0];
    
    // Access coupon through promotion object
    const coupon = promoCode.promotion?.coupon;
    
    if (!coupon || typeof coupon === 'string') {
      return NextResponse.json({
        valid: false,
        error: 'Unable to validate promo code',
      });
    }

    // Check if max redemptions reached
    if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
      return NextResponse.json({
        valid: false,
        error: 'This promo code has reached its maximum redemptions',
      });
    }

    // Check coupon validity
    if (!coupon.valid) {
      return NextResponse.json({
        valid: false,
        error: 'This promo code has expired',
      });
    }

    // Build response
    const response: {
      valid: boolean;
      code: string;
      promotionCodeId: string;
      percentOff?: number;
      amountOff?: number;
      duration: string;
      durationInMonths?: number;
      appliesTo?: string[];
      message: string;
      redemptionsRemaining?: number;
    } = {
      valid: true,
      code: normalizedCode,
      promotionCodeId: promoCode.id,
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months || undefined,
      appliesTo: promoConfig?.appliesTo,
      message: '',
    };

    // Set discount amounts
    if (coupon.percent_off) {
      response.percentOff = coupon.percent_off;
      if (coupon.percent_off === 100) {
        if (coupon.duration === 'once' || coupon.duration_in_months === 1) {
          response.message = '🎉 First month FREE!';
        } else {
          response.message = '🎉 100% discount applied!';
        }
      } else {
        response.message = `🎉 ${coupon.percent_off}% off applied!`;
      }
    } else if (coupon.amount_off) {
      response.amountOff = coupon.amount_off;
      response.message = `🎉 $${(coupon.amount_off / 100).toFixed(2)} off applied!`;
    }

    // Add redemptions remaining info
    if (promoCode.max_redemptions) {
      response.redemptionsRemaining = promoCode.max_redemptions - promoCode.times_redeemed;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Promo validation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        valid: false,
        error: 'Unable to validate promo code. Please try again.',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      valid: false,
      error: 'Failed to validate promo code',
    }, { status: 500 });
  }
}
