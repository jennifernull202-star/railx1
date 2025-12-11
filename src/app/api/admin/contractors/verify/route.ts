/**
 * THE RAIL EXCHANGE™ — Admin Contractor Verification Review API
 * 
 * POST /api/admin/contractors/verify - Admin approve/reject verification
 * GET /api/admin/contractors/verify - Get pending verifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import Notification from '@/models/Notification';
import { Types } from 'mongoose';

// ============================================================================
// GET - Get pending verifications for admin review
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all profiles needing review
    const pendingProfiles = await ContractorProfile.find({
      $or: [
        { verificationStatus: 'pending' },
        { 'verificationResult.status': 'needs_review' },
      ],
    })
      .populate('userId', 'name email')
      .sort({ 'verificationDocuments.submittedAt': -1 })
      .lean();

    return NextResponse.json({
      success: true,
      profiles: pendingProfiles,
    });
  } catch (error) {
    console.error('Admin get verifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending verifications' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Admin approve or reject verification
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, action, notes } = body;

    if (!profileId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Profile ID and action (approve/reject) required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await ContractorProfile.findById(profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update verification result
    profile.verificationResult = {
      status: action === 'approve' ? 'approved' : 'rejected',
      confidence: 100,
      notes: notes || (action === 'approve' ? 'Approved by admin' : 'Rejected by admin'),
      reviewedAt: new Date(),
      reviewedBy: 'admin',
      adminId: new Types.ObjectId(session.user.id as string),
    };

    if (action === 'approve') {
      profile.verificationStatus = 'approved';
      
      // Create notification for payment
      await Notification.create({
        userId: profile.userId,
        type: 'verification_approved',
        title: '🎉 Verification Approved!',
        message: 'Your contractor verification has been approved by our team! Complete payment to activate your Verified badge.',
        data: {
          action: 'complete_payment',
          url: '/dashboard/contractor/verify/payment',
        },
        read: false,
      });
    } else {
      profile.verificationStatus = 'rejected';
      
      await Notification.create({
        userId: profile.userId,
        type: 'verification_rejected',
        title: 'Verification Not Approved',
        message: `Your verification was not approved: ${notes || 'Please contact support for more information.'}`,
        data: {
          reason: notes,
        },
        read: false,
      });
    }

    await profile.save();

    return NextResponse.json({
      success: true,
      message: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Admin verification action error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}
