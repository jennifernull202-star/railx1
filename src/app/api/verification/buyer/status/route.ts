/**
 * THE RAIL EXCHANGE™ — Buyer Verification Status API
 * 
 * GET /api/verification/buyer/status
 * Returns the current buyer's verification status.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('isVerifiedBuyer buyerVerificationStatus buyerVerifiedAt')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      isVerifiedBuyer: user.isVerifiedBuyer || false,
      buyerVerificationStatus: user.buyerVerificationStatus || 'none',
      buyerVerifiedAt: user.buyerVerifiedAt || null,
    });

  } catch (error) {
    console.error('Buyer verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}
