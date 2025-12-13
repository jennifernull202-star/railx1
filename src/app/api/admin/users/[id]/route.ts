/**
 * THE RAIL EXCHANGE™ — Admin Single User API
 * 
 * Get and update individual user (admin only).
 * 
 * AUDIT LOGGING:
 * - User suspension/activation and role changes are logged
 * - Enterprise compliance requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AdminAuditLog from '@/models/AdminAuditLog';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { role, isActive, name } = body;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-demotion from admin
    if (id === session.user.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    // Update capability flags based on role selection
    // Legacy role field kept for admin filtering UI
    if (role && ['buyer', 'seller', 'contractor', 'admin'].includes(role)) {
      user.role = role;
      // Set capability flags
      user.isAdmin = role === 'admin';
      user.isContractor = role === 'contractor' || user.isContractor;
      // isSeller remains true by default
    }

    if (typeof isActive === 'boolean') {
      // Prevent self-deactivation
      if (id === session.user.id && !isActive) {
        return NextResponse.json(
          { error: 'Cannot deactivate your own account' },
          { status: 400 }
        );
      }
      user.isActive = isActive;
    }

    if (name) {
      user.name = name;
    }

    const wasActivated = typeof isActive === 'boolean' && isActive !== user.isActive;
    const previousIsActive = user.isActive;

    await user.save();

    // AUDIT LOG: User status/role changes
    if (wasActivated || role) {
      const admin = await User.findById(session.user.id).select('email');
      await AdminAuditLog.logAction({
        adminId: session.user.id,
        adminEmail: admin?.email || session.user.email || 'unknown',
        action: wasActivated 
          ? (isActive ? 'activate_user' : 'suspend_user')
          : 'role_change',
        targetType: 'user',
        targetId: user._id,
        targetTitle: user.email,
        details: { 
          userName: user.name,
          userEmail: user.email,
          previousRole: role ? user.role : undefined,
          newRole: role,
          previousIsActive: wasActivated ? previousIsActive : undefined,
          newIsActive: wasActivated ? isActive : undefined,
        },
        reason: wasActivated 
          ? `User ${isActive ? 'activated' : 'suspended'} by admin`
          : `User role changed to ${role}`,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account from admin panel' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
