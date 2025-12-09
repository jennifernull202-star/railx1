/**
 * Debug endpoint to test contractor creation
 * DELETE THIS AFTER DEBUGGING
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not logged in'
      });
    }

    await connectDB();

    // Check if user exists
    const user = await User.findById(session.user.id).lean();
    
    // Check for existing contractor profile
    const existingProfile = await ContractorProfile.findOne({ userId: session.user.id }).lean();

    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      userExists: !!user,
      userDbRole: user?.role,
      hasContractorProfile: !!existingProfile,
      profileId: existingProfile?._id?.toString(),
      profileActive: existingProfile?.isActive,
      profilePublished: existingProfile?.isPublished,
    });
  } catch (error) {
    return NextResponse.json({
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
