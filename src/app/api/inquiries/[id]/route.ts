/**
 * THE RAIL EXCHANGE™ — Single Inquiry API
 * 
 * Get, update, and reply to a specific inquiry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import User from '@/models/User';
import Listing from '@/models/Listing';
import { Types } from 'mongoose';
import { sendEmail, inquiryReplyEmail } from '@/lib/email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get a single inquiry with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 });
    }

    await connectDB();

    const inquiry = await Inquiry.findById(id)
      .populate('listing', 'title slug images price')
      .populate('buyer', 'name email image')
      .populate('seller', 'name email image')
      .populate('messages.sender', 'name email image');

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Check if user is authorized to view this inquiry
    const userId = session.user.id;
    const isBuyer = inquiry.buyer._id.toString() === userId;
    const isSeller = inquiry.seller._id.toString() === userId;
    const isAdmin = session.user.isAdmin;

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to view this inquiry' },
        { status: 403 }
      );
    }

    // Mark messages as read and reset unread count
    if (isBuyer && inquiry.buyerUnreadCount > 0) {
      inquiry.buyerUnreadCount = 0;
      // Mark all messages from seller as read
      inquiry.messages.forEach((msg) => {
        if (msg.sender._id.toString() !== userId && !msg.readAt) {
          msg.readAt = new Date();
        }
      });
      await inquiry.save();
    } else if (isSeller && inquiry.sellerUnreadCount > 0) {
      inquiry.sellerUnreadCount = 0;
      if (inquiry.status === 'new') {
        inquiry.status = 'read';
      }
      // Mark all messages from buyer as read
      inquiry.messages.forEach((msg) => {
        if (msg.sender._id.toString() !== userId && !msg.readAt) {
          msg.readAt = new Date();
        }
      });
      await inquiry.save();
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Get inquiry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a reply to an inquiry
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { message, attachments } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Check if user is authorized
    const userId = session.user.id;
    const isBuyer = inquiry.buyer.toString() === userId;
    const isSeller = inquiry.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Not authorized to reply to this inquiry' },
        { status: 403 }
      );
    }

    // Add the message
    const newMessage = {
      sender: new Types.ObjectId(userId),
      content: message.trim(),
      attachments: attachments || [],
      createdAt: new Date(),
    };

    inquiry.messages.push(newMessage);
    inquiry.lastMessageAt = new Date();

    // Update unread counts
    if (isBuyer) {
      inquiry.sellerUnreadCount += 1;
    } else {
      inquiry.buyerUnreadCount += 1;
      inquiry.status = 'replied';
    }

    await inquiry.save();

    // Populate for response
    await inquiry.populate('listing', 'title slug');
    await inquiry.populate('buyer', 'name email');
    await inquiry.populate('seller', 'name email');
    await inquiry.populate('messages.sender', 'name email image');

    // Send email notification to the other party
    try {
      const listing = await Listing.findById(inquiry.listing._id);
      const recipientId = isBuyer ? inquiry.seller._id : inquiry.buyer._id;
      const recipient = await User.findById(recipientId);
      
      if (recipient?.email && listing) {
        const senderName = session.user.name || 'Someone';
        const template = inquiryReplyEmail({
          recipientName: recipient.name || 'there',
          senderName,
          listingTitle: listing.title,
          message: message.trim(),
        });
        
        await sendEmail(recipient.email, template);
      }
    } catch (emailError) {
      // Log but don't fail the request
      console.error('Failed to send reply notification email:', emailError);
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Reply to inquiry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update inquiry status (archive, close, etc.)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { status, isArchived } = body;

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Check if user is authorized
    const userId = session.user.id;
    const isBuyer = inquiry.buyer.toString() === userId;
    const isSeller = inquiry.seller.toString() === userId;
    const isAdmin = session.user.isAdmin;

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update this inquiry' },
        { status: 403 }
      );
    }

    // Update allowed fields
    if (status && isSeller) {
      inquiry.status = status;
    }

    if (typeof isArchived === 'boolean') {
      inquiry.isArchived = isArchived;
      inquiry.archivedBy = new Types.ObjectId(userId);
    }

    await inquiry.save();

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Update inquiry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
