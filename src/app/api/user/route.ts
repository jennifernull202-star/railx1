/**
 * THE RAIL EXCHANGE™ — User API
 * 
 * Get current user data.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

// GET /api/user - Get current user data
export async function GET() {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      console.error('Session fetch error in user GET:', error);
      return NextResponse.json({ success: false, user: null });
    }

    if (!session?.user?.id) {
      // Return empty user for unauthenticated requests
      return NextResponse.json({ success: true, user: null });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isAdmin: user.isAdmin,
        isSeller: user.isSeller,
        isContractor: user.isContractor,
        sellerTier: user.sellerTier,
        contractorTier: user.contractorTier,
        verifiedSeller: user.verifiedSeller,
        company: user.company,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ success: false, user: null });
  }
}
