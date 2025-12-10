/**
 * Debug endpoint to verify Stripe configuration
 * DELETE THIS AFTER DEBUGGING
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'NOT SET',
    // All subscription price IDs
    seller_basic_monthly: process.env.STRIPE_PRICE_SELLER_BASIC_MONTHLY || 'NOT SET',
    seller_basic_yearly: process.env.STRIPE_PRICE_SELLER_BASIC_YEARLY || 'NOT SET',
    seller_plus_monthly: process.env.STRIPE_PRICE_SELLER_PLUS_MONTHLY || 'NOT SET',
    seller_plus_yearly: process.env.STRIPE_PRICE_SELLER_PLUS_YEARLY || 'NOT SET',
    seller_pro_monthly: process.env.STRIPE_PRICE_SELLER_PRO_MONTHLY || 'NOT SET',
    seller_pro_yearly: process.env.STRIPE_PRICE_SELLER_PRO_YEARLY || 'NOT SET',
    contractor_verified_monthly: process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_MONTHLY || 'NOT SET',
    contractor_verified_yearly: process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_YEARLY || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
  };

  return NextResponse.json(config);
}
