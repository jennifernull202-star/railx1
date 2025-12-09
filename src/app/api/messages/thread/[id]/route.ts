/**
 * THE RAIL EXCHANGE™ — Message Thread API
 * 
 * GET /api/messages/thread/[id] - Get messages in a thread
 * PUT /api/messages/thread/[id] - Mark thread as read/archive
 * DELETE /api/messages/thread/[id] - Archive/delete thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Message, Thread } from '@/models/Message';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const thread = await Thread.findById(id)
      .populate('participants', 'name email image')
      .populate('listingId', 'title slug images');
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant
    const userId = new mongoose.Types.ObjectId(session.user.id);
    if (!thread.participants.some((p: { _id: mongoose.Types.ObjectId }) => p._id.equals(userId))) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await Message.findByThread(id);

    // Mark as read
    await Message.markThreadAsRead(id, session.user.id);

    return NextResponse.json({ thread, messages });
  } catch (error) {
    console.error('Thread GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { action } = body; // 'markRead' or 'archive'

    const thread = await Thread.findById(id);
    
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

    if (action === 'markRead') {
      await Message.markThreadAsRead(id, session.user.id);
    } else if (action === 'archive') {
      thread.isArchived.set(session.user.id, true);
      await thread.save();
    } else if (action === 'unarchive') {
      thread.isArchived.set(session.user.id, false);
      await thread.save();
    }

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error('Thread PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const thread = await Thread.findById(id);
    
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

    // Archive for this user (soft delete)
    thread.isArchived.set(session.user.id, true);
    await thread.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Thread DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}
