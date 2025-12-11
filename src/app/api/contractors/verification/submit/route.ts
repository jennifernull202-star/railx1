/**
 * THE RAIL EXCHANGE™ — Contractor Verification Submit API
 * 
 * POST /api/contractors/verification/submit
 * Submits contractor profile for verification review
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import User from '@/models/User';
import { Types } from 'mongoose';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);

    // Find contractor profile
    const profile = await ContractorProfile.findOne({ userId });
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Please create your contractor profile first' },
        { status: 400 }
      );
    }

    // Check if already verified or pending
    if (profile.verificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'You are already verified' },
        { status: 400 }
      );
    }

    if (profile.verificationStatus === 'pending') {
      return NextResponse.json(
        { error: 'Your verification is already pending review' },
        { status: 400 }
      );
    }

    // Validate profile has minimum required fields
    if (!profile.businessName || !profile.businessDescription || !profile.services?.length) {
      return NextResponse.json(
        { error: 'Please complete your profile before applying for verification' },
        { status: 400 }
      );
    }

    // Update profile status to pending
    profile.verificationStatus = 'pending';
    await profile.save();

    // Update user's contractor verification status
    await User.findByIdAndUpdate(userId, {
      contractorVerificationStatus: 'pending-admin',
    });

    // TODO: Send notification to admin for review
    // TODO: Trigger AI verification if implemented

    return NextResponse.json({
      success: true,
      message: 'Verification request submitted successfully',
      status: 'pending',
    });
  } catch (error) {
    console.error('Error submitting contractor verification:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification request' },
      { status: 500 }
    );
  }
}
