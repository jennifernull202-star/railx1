/**
 * THE RAIL EXCHANGE™ — Messages API
 * 
 * GET /api/messages - Get user's message threads
 * POST /api/messages - Send a new message
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Message, Thread } from '@/models/Message';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (threadId) {
      // Get messages for a specific thread
      const thread = await Thread.findById(threadId);
      
      if (!thread) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }

      // Verify user is a participant
      const userId = new mongoose.Types.ObjectId(session.user.id);
      if (!thread.participants.some((p: mongoose.Types.ObjectId) => p.equals(userId))) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get messages and mark as read
      const messages = await Message.findByThread(threadId);
      await Message.markThreadAsRead(threadId, session.user.id);

      return NextResponse.json({ messages, thread });
    }

    // Get all threads for user
    const threads = await Thread.findUserThreads(session.user.id);
    const unreadCount = await Message.getUnreadCount(session.user.id);

    return NextResponse.json({ threads, unreadCount });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { recipientId, content, listingId, threadId: existingThreadId, attachments } = body;

    // Validation
    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Message cannot exceed 5000 characters' },
        { status: 400 }
      );
    }

    // Can't message yourself
    if (recipientId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    // Get or create thread
    let thread;
    if (existingThreadId) {
      thread = await Thread.findById(existingThreadId);
      if (!thread) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      // Verify user is a participant
      const userId = new mongoose.Types.ObjectId(session.user.id);
      if (!thread.participants.some((p: mongoose.Types.ObjectId) => p.equals(userId))) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else {
      thread = await Thread.findOrCreateThread(
        session.user.id,
        recipientId,
        listingId
      );
    }

    // Create message
    const message = await Message.create({
      senderId: session.user.id,
      recipientId,
      threadId: thread._id,
      content: content.trim(),
      attachments: attachments || [],
      listingId,
    });

    // Populate sender info
    await message.populate('senderId', 'name email image');

    return NextResponse.json({ message, thread }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
