/**
 * THE RAIL EXCHANGE™ — Notifications API
 * 
 * Get and manage user notifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { Types } from 'mongoose';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';
    const unreadOnly = searchParams.get('unreadOnly') === 'true' || searchParams.get('unread') === 'true';

    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      console.error('Session fetch error in notifications:', error);
      // Return safe default for countOnly requests
      if (countOnly) {
        return NextResponse.json({ success: true, data: { count: 0, unreadCount: 0 } });
      }
      return NextResponse.json({ error: 'Session error' }, { status: 500 });
    }

    if (!session?.user?.id) {
      // Return safe default for countOnly requests (not logged in = 0 notifications)
      if (countOnly) {
        return NextResponse.json({ success: true, data: { count: 0, unreadCount: 0 } });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Handle countOnly requests efficiently
    if (countOnly) {
      const query: Record<string, unknown> = { userId: session.user.id };
      if (unreadOnly) query.isRead = false;
      const count = await Notification.countDocuments(query);
      const unreadCount = unreadOnly ? count : await Notification.countDocuments({ userId: session.user.id, isRead: false });
      return NextResponse.json({ success: true, data: { count, unreadCount } });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const type = searchParams.get('type');

    const query: Record<string, unknown> = { userId: session.user.id };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: session.user.id, isRead: false }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all unread notifications as read
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds array or markAllRead is required' },
        { status: 400 }
      );
    }

    // Validate notification IDs
    const validIds = notificationIds.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid notification IDs provided' },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    await Notification.updateMany(
      {
        _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
        userId: session.user.id,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: `${validIds.length} notification(s) marked as read`,
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all notifications for user
      await Notification.deleteMany({ userId: session.user.id });
      return NextResponse.json({
        success: true,
        message: 'All notifications deleted',
      });
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Valid notification ID is required' },
        { status: 400 }
      );
    }

    const result = await Notification.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
