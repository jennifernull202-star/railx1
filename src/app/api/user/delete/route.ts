/**
 * THE RAIL EXCHANGE™ — Account Deletion API
 * 
 * Permanently delete user account and associated data.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import ContractorProfile from '@/models/ContractorProfile';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // Delete all user's listings
    await Listing.deleteMany({ seller: userId });

    // Delete contractor profile if exists
    await ContractorProfile.deleteOne({ user: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
