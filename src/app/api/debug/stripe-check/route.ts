/**
 * Debug endpoint to verify Stripe configuration
 * DELETE THIS AFTER DEBUGGING
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'NOT SET',
    hasPlusMonthly: !!process.env.STRIPE_PRICE_SELLER_PLUS_MONTHLY,
    plusMonthlyId: process.env.STRIPE_PRICE_SELLER_PLUS_MONTHLY || 'NOT SET',
    hasContractorMonthly: !!process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_MONTHLY,
    contractorMonthlyId: process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_MONTHLY || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
  };

  return NextResponse.json(config);
}
