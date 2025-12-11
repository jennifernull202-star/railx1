/**
 * THE RAIL EXCHANGE™ — Contractor Verification Status API
 * 
 * GET /api/contractors/verification/status
 * Returns the contractor's verification status
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import User from '@/models/User';
import { Types } from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [profile, user] = await Promise.all([
      ContractorProfile.findOne({ userId: new Types.ObjectId(session.user.id) })
        .select('businessName verificationStatus verifiedBadgePurchased verifiedAt verifiedBadgeExpiresAt')
        .lean(),
      User.findById(session.user.id)
        .select('contractorVerificationStatus contractorSubscriptionId')
        .lean(),
    ]);

    return NextResponse.json({
      profile: profile ? {
        _id: profile._id,
        companyName: profile.businessName,
        verificationStatus: profile.verificationStatus,
        verifiedBadgePurchased: profile.verifiedBadgePurchased,
        verifiedAt: profile.verifiedAt,
        verifiedBadgeExpiresAt: profile.verifiedBadgeExpiresAt,
      } : null,
      userStatus: user ? {
        isVerifiedContractor: user.contractorVerificationStatus === 'active',
        contractorVerificationStatus: user.contractorVerificationStatus,
        contractorSubscriptionId: user.contractorSubscriptionId,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching contractor verification status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}
