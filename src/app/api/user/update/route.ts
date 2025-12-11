/**
 * THE RAIL EXCHANGE™ — User Update API
 * 
 * PATCH /api/user/update
 * Updates user capability flags (isContractor, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isContractor } = body;

    // Only allow specific fields to be updated
    const allowedUpdates: Record<string, boolean | undefined> = {};

    // Allow opting into contractor capabilities
    if (typeof isContractor === 'boolean') {
      // Only allow setting to true (opting in), not opting out
      if (isContractor === true) {
        allowedUpdates.isContractor = true;
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: allowedUpdates },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      user: {
        id: user._id,
        isContractor: user.isContractor,
        isSeller: user.isSeller,
      },
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
