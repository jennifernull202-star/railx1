/**
 * THE RAIL EXCHANGE™ — Contractor Verification Status API
 * 
 * GET /api/contractors/verification/status
 * Returns the contractor's verification status and profile existence
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { Types } from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await ContractorProfile.findOne({ 
      userId: new Types.ObjectId(session.user.id) 
    })
      .select('companyName verificationStatus verifiedBadgePurchased verifiedAt verifiedBadgeExpiresAt')
      .lean();

    // Determine verification status
    let verificationStatus: 'none' | 'pending' | 'ai_approved' | 'approved' | 'verified' | 'rejected' | 'expired' = 'none';
    
    if (profile) {
      const status = profile.verificationStatus;
      if (status === 'verified' && profile.verifiedBadgePurchased) {
        // Check if expired
        if (profile.verifiedBadgeExpiresAt && new Date(profile.verifiedBadgeExpiresAt) < new Date()) {
          verificationStatus = 'expired';
        } else {
          verificationStatus = 'verified';
        }
      } else if (status === 'approved' || status === 'ai_approved') {
        verificationStatus = status;
      } else if (status === 'pending') {
        verificationStatus = 'pending';
      } else if (status === 'rejected') {
        verificationStatus = 'rejected';
      }
    }

    return NextResponse.json({
      hasContractorProfile: !!profile,
      verificationStatus,
      profile: profile ? {
        _id: profile._id,
        businessName: profile.businessName,
        verificationStatus: profile.verificationStatus,
        verifiedBadgePurchased: profile.verifiedBadgePurchased,
        verifiedAt: profile.verifiedAt,
        verifiedBadgeExpiresAt: profile.verifiedBadgeExpiresAt,
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
