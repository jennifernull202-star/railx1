/**
 * THE RAIL EXCHANGE™ — Admin Users API
 * 
 * Get and manage users (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';

// GET /api/admin/users - Get all users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role isActive image createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get listing counts for sellers
    const sellerIds = users
      .filter((u) => u.role === 'seller')
      .map((u) => u._id);

    const listingCounts = await Listing.aggregate([
      { $match: { sellerId: { $in: sellerIds } } },
      { $group: { _id: '$sellerId', count: { $sum: 1 } } },
    ]);

    const listingCountMap = new Map(
      listingCounts.map((lc) => [lc._id.toString(), lc.count])
    );

    const usersWithCounts = users.map((user) => ({
      ...user,
      listingsCount: listingCountMap.get(user._id.toString()) || 0,
    }));

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
