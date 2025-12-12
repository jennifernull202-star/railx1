/**
 * THE RAIL EXCHANGE™ — Admin Force Expire Seller Verification API
 * 
 * POST /api/admin/seller-verifications/force-expire
 * 
 * Allows admin to force expire a seller's verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import AdminAuditLog from '@/models/AdminAuditLog';

export async function POST(request: NextRequest) {
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

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    targetUser.isVerifiedSeller = false;
    targetUser.verifiedSellerStatus = 'expired';
    await targetUser.save();

    // Update verification record
    const verification = await SellerVerification.findOne({ userId });
    if (verification) {
      verification.status = 'expired';
      verification.statusHistory.push({
        status: 'expired',
        changedAt: new Date(),
        changedBy: adminUser._id,
        reason: 'Force expired by admin',
      });
      await verification.save();
    }

    // Log admin action
    try {
      await AdminAuditLog.create({
        adminId: adminUser._id,
        action: 'force_expire_seller_verification',
        targetType: 'user',
        targetId: targetUser._id,
        details: {
          userName: targetUser.name,
          userEmail: targetUser.email,
          previousStatus: 'active',
          newStatus: 'expired',
        },
      });
    } catch (logError) {
      console.error('Failed to create audit log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Verification for ${targetUser.email} has been force expired`,
    });
  } catch (error) {
    console.error('Error force expiring verification:', error);
    return NextResponse.json(
      { error: 'Failed to force expire verification' },
      { status: 500 }
    );
  }
}
