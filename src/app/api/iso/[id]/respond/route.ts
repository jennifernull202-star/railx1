/**
 * THE RAIL EXCHANGE™ — ISO Request Respond API
 * 
 * Creates a message thread when responding to an ISO request.
 * Notifies the original requester.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ISORequest from '@/models/ISORequest';
import { Thread, Message } from '@/models/Message';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/iso/[id]/respond
 * Respond to an ISO request - creates a message thread
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const isoRequest = await ISORequest.findById(id)
      .populate('userId', 'name email');

    if (!isoRequest || isoRequest.status === 'deleted') {
      return NextResponse.json(
        { error: 'ISO request not found' },
        { status: 404 }
      );
    }

    if (!isoRequest.allowMessaging) {
      return NextResponse.json(
        { error: 'This requester has disabled messaging' },
        { status: 403 }
      );
    }

    // Can't respond to your own request
    if (isoRequest.userId._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot respond to your own request' },
        { status: 400 }
      );
    }

    // Create or find existing thread between these users
    const thread = await Thread.findOrCreateThread(
      session.user.id,
      isoRequest.userId._id.toString()
    );

    // Create the message with ISO reference
    const newMessage = await Message.create({
      senderId: session.user.id,
      recipientId: isoRequest.userId._id,
      threadId: thread._id,
      content: `[Response to ISO Request: "${isoRequest.title}"]\n\n${message.trim()}`,
      isRead: false,
    });

    // Update thread with last message
    thread.lastMessage = {
      content: newMessage.content.substring(0, 100),
      senderId: new mongoose.Types.ObjectId(session.user.id),
      createdAt: new Date(),
    };

    // Update unread count for recipient
    const recipientId = isoRequest.userId._id.toString();
    const currentUnread = thread.unreadCount.get(recipientId) || 0;
    thread.unreadCount.set(recipientId, currentUnread + 1);

    await thread.save();

    // Increment response count on ISO request
    await ISORequest.updateOne({ _id: id }, { $inc: { responseCount: 1 } });

    // Create notification for the requester
    await Notification.create({
      userId: isoRequest.userId._id,
      type: 'message',
      title: 'New Response to Your Request',
      message: `Someone responded to your ISO request: "${isoRequest.title}"`,
      link: `/dashboard/messages/${thread._id}`,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      threadId: thread._id,
      messageId: newMessage._id,
      message: 'Response sent successfully',
    });
  } catch (error) {
    console.error('Respond to ISO request error:', error);
    return NextResponse.json(
      { error: 'Failed to send response' },
      { status: 500 }
    );
  }
}
