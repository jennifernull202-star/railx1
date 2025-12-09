/**
 * THE RAIL EXCHANGE™ — Inquiries API
 * 
 * Create and list inquiries (messages) for listings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { Types } from 'mongoose';
import { sendEmail, newInquiryEmail } from '@/lib/email';

// Get inquiries for current user (as buyer or seller)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'seller'; // 'seller' or 'buyer'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const userId = new Types.ObjectId(session.user.id);

    // Build query based on role
    const query: Record<string, unknown> = {
      isArchived: false,
    };

    if (role === 'seller') {
      query.seller = userId;
    } else {
      query.buyer = userId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Get inquiries with pagination
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('listing', 'title slug images')
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(query),
    ]);

    // Get unread counts
    const unreadCount = await Inquiry.countDocuments({
      ...query,
      [role === 'seller' ? 'sellerUnreadCount' : 'buyerUnreadCount']: { $gt: 0 },
    });

    return NextResponse.json({
      inquiries,
      total,
      unreadCount,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new inquiry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { listingId, subject, message } = body;

    // Validate inputs
    if (!listingId || !message) {
      return NextResponse.json(
        { error: 'Listing ID and message are required' },
        { status: 400 }
      );
    }

    // Get the listing
    const listing = await Listing.findById(listingId).select('sellerId title');

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Can't inquire about your own listing
    if (listing.sellerId.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot inquire about your own listing' },
        { status: 400 }
      );
    }

    const buyerId = new Types.ObjectId(session.user.id);
    const sellerId = listing.sellerId;

    // Check if inquiry already exists
    let inquiry = await Inquiry.findOne({
      listing: listingId,
      buyer: buyerId,
    });

    if (inquiry) {
      // Add message to existing inquiry
      inquiry.messages.push({
        sender: buyerId,
        content: message,
        createdAt: new Date(),
      });
      inquiry.sellerUnreadCount += 1;
      inquiry.lastMessageAt = new Date();
      inquiry.status = inquiry.status === 'closed' ? 'new' : inquiry.status;
      await inquiry.save();
    } else {
      // Create new inquiry
      inquiry = await Inquiry.create({
        listing: listingId,
        buyer: buyerId,
        seller: sellerId,
        subject: subject || `Inquiry about ${listing.title}`,
        messages: [
          {
            sender: buyerId,
            content: message,
            createdAt: new Date(),
          },
        ],
        sellerUnreadCount: 1,
      });

      // Increment inquiry count on listing
      await Listing.findByIdAndUpdate(listingId, {
        $inc: { inquiryCount: 1 },
      });

      // Send email notification to seller
      const [seller, buyer] = await Promise.all([
        User.findById(sellerId).select('name email'),
        User.findById(buyerId).select('name email'),
      ]);

      if (seller && buyer) {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await sendEmail(
          seller.email,
          newInquiryEmail({
            sellerName: seller.name,
            buyerName: buyer.name,
            buyerEmail: buyer.email,
            listingTitle: listing.title,
            listingUrl: `${baseUrl}/listings/${listingId}`,
            message,
          })
        );
      }
    }

    // Populate for response
    await inquiry.populate('listing', 'title slug');
    await inquiry.populate('buyer', 'name email');
    await inquiry.populate('seller', 'name email');

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error('Create inquiry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
