/**
 * THE RAIL EXCHANGE™ — Seller Verification Status API
 * 
 * GET /api/verification/seller/status
 * 
 * Returns the current seller verification status and details.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';

export async function GET() {
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

    // Get verification record
    const verification = await SellerVerification.findOne({ userId: user._id });

    // Check for expiration
    if (user.isVerifiedSeller && user.verifiedSellerExpiresAt) {
      const now = new Date();
      if (new Date(user.verifiedSellerExpiresAt) <= now) {
        // Mark as expired
        user.verifiedSellerStatus = 'expired';
        user.isVerifiedSeller = false;
        await user.save();

        if (verification) {
          verification.status = 'expired';
          verification.statusHistory.push({
            status: 'expired',
            changedAt: now,
            reason: 'Verification expired',
          });
          await verification.save();
        }
      }
    }

    return NextResponse.json({
      userStatus: {
        isVerifiedSeller: user.isVerifiedSeller,
        verifiedSellerStatus: user.verifiedSellerStatus,
        verifiedSellerTier: user.verifiedSellerTier,
        verifiedSellerExpiresAt: user.verifiedSellerExpiresAt?.toISOString(),
        verifiedSellerApprovedAt: user.verifiedSellerApprovedAt?.toISOString(),
      },
      verification: verification ? {
        status: verification.status,
        verificationTier: verification.verificationTier,
        documents: verification.documents.map(d => ({
          type: d.type,
          fileName: d.fileName,
          uploadedAt: d.uploadedAt?.toISOString(),
        })),
        aiVerification: {
          status: verification.aiVerification?.status || 'pending',
          confidence: verification.aiVerification?.confidence || 0,
          flags: verification.aiVerification?.flags || [],
        },
        adminReview: {
          status: verification.adminReview?.status || 'pending',
          rejectionReason: verification.adminReview?.rejectionReason,
        },
        approvedAt: verification.approvedAt?.toISOString(),
        expiresAt: verification.expiresAt?.toISOString(),
      } : null,
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}
