/**
 * THE RAIL EXCHANGE™ — Admin Seller Verifications API
 * 
 * GET /api/admin/seller-verifications
 * 
 * Returns list of all sellers with verification status for admin report.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Check if admin
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users who have ever had any verification activity
    const sellers = await User.find({
      $or: [
        { isVerifiedSeller: true },
        { verifiedSellerStatus: { $ne: 'none' } },
        { verifiedSellerTier: { $ne: null } },
      ],
    })
      .select([
        '_id',
        'name',
        'email',
        'isVerifiedSeller',
        'verifiedSellerStatus',
        'verifiedSellerTier',
        'verifiedSellerApprovedAt',
        'verifiedSellerExpiresAt',
        'createdAt',
      ])
      .sort({ verifiedSellerApprovedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      sellers: sellers.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        email: s.email,
        isVerifiedSeller: s.isVerifiedSeller || false,
        verifiedSellerStatus: s.verifiedSellerStatus || 'none',
        verifiedSellerTier: s.verifiedSellerTier || null,
        verifiedSellerApprovedAt: s.verifiedSellerApprovedAt?.toISOString() || null,
        verifiedSellerExpiresAt: s.verifiedSellerExpiresAt?.toISOString() || null,
        createdAt: s.createdAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching seller verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller verifications' },
      { status: 500 }
    );
  }
}
