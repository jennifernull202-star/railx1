/**
 * THE RAIL EXCHANGE™ — Inquiries API
 * 
 * Create and list inquiries (messages) for listings.
 * 
 * SECURITY CONTROLS:
 * - Rate limiting per user per day (Section 9)
 * - Minimum account age requirement
 * - Input sanitization
 * - Self-inquiry prevention
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
import { checkRateLimit } from '@/lib/rate-limit';
import { rateLimitRequest } from '@/lib/redis-rate-limit';
import { sanitizeHTML, sanitizeString } from '@/lib/sanitize';
import { 
  INQUIRY_LIMITS, 
  getInquiryLimit, 
  validateInquiryContent 
} from '@/lib/abuse-prevention';

// Minimum account age in hours to send inquiries (anti-spam)
const MIN_ACCOUNT_AGE_HOURS = 1;

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
        .populate('buyer', 'name email verifiedSeller verifiedSellerExpiresAt')
        .populate('seller', 'name email verifiedSeller verifiedSellerExpiresAt')
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

    // S-1.7: Redis-backed rate limiting for inquiries
    const redisRateLimit = await rateLimitRequest('inquiry', request, {
      userId: session.user.id,
      isVerified: !!session.user.isSeller || !!session.user.isVerifiedContractor,
    });
    if (redisRateLimit) {
      return redisRateLimit;
    }

    // SECURITY: Additional in-memory rate limiting (Section 9)
    const rateLimitResponse = await checkRateLimit(request, {
      userId: session.user.id,
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await connectDB();

    // SECURITY: S-1.2 Check account status, spam suspension, and daily limits
    const user = await User.findById(session.user.id).select(
      'createdAt emailVerified spamSuspendedUntil spamWarnings inquirySpamMarkedCount'
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // SECURITY: Email verification required before sending inquiries (S-1.1)
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address to send inquiries.' },
        { status: 403 }
      );
    }
    
    // SECURITY: S-1.2 Check if user is spam suspended (cooldown escalation)
    if (user.spamSuspendedUntil && new Date(user.spamSuspendedUntil) > new Date()) {
      return NextResponse.json(
        { error: 'Inquiry access is temporarily suspended. Please try again later.' },
        { status: 403 }
      );
    }
    
    // SECURITY: S-1.2 Check cooldown escalation - 3 spam-flagged inquiries → 24-hour lock
    if (user.inquirySpamMarkedCount >= INQUIRY_LIMITS.SPAM_FLAG_THRESHOLD) {
      // Apply automatic 24-hour lockout
      const lockoutUntil = new Date(Date.now() + INQUIRY_LIMITS.LOCKOUT_HOURS * 60 * 60 * 1000);
      await User.findByIdAndUpdate(user._id, {
        spamSuspendedUntil: lockoutUntil,
        inquirySpamMarkedCount: 0, // Reset counter after applying lockout
      });
      return NextResponse.json(
        { error: 'Inquiry access is temporarily suspended. Please try again later.' },
        { status: 403 }
      );
    }
    
    // SECURITY: Check minimum account age
    const accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
    if (accountAgeHours < MIN_ACCOUNT_AGE_HOURS) {
      return NextResponse.json(
        { error: 'Please wait before sending inquiries. New accounts have a brief waiting period.' },
        { status: 403 }
      );
    }

    // SECURITY: S-1.2 Calculate tiered daily limit based on account age
    const dailyLimit = getInquiryLimit(user.createdAt, !!user.emailVerified);
    
    // SECURITY: Check daily inquiry limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyInquiryCount = await Inquiry.countDocuments({
      buyer: new Types.ObjectId(session.user.id),
      createdAt: { $gte: today },
    });

    if (dailyInquiryCount >= dailyLimit) {
      return NextResponse.json(
        { error: 'Inquiry limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { listingId, subject, message, buyerIntent, _honeypot } = body;

    // SECURITY: Honeypot field check (Section 9 - anti-bot)
    // If this hidden field is filled, it's likely a bot
    if (_honeypot) {
      // Silently reject but return success to fool bots
      console.warn(`Honeypot triggered for user ${session.user.id}`);
      return NextResponse.json({ success: true, id: 'blocked' }, { status: 201 });
    }

    // Validate inputs
    if (!listingId || !message) {
      return NextResponse.json(
        { error: 'Listing ID and message are required' },
        { status: 400 }
      );
    }

    // SECURITY: Sanitize inputs
    const sanitizedSubject = subject ? sanitizeString(subject, { maxLength: 200 }) : undefined;
    const sanitizedMessage = sanitizeHTML(message) || '';

    if (!sanitizedMessage || sanitizedMessage.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    // SECURITY: S-1.2 Block inquiries with external links or promotional phrases
    const contentError = validateInquiryContent(sanitizedMessage);
    if (contentError) {
      return NextResponse.json(
        { error: contentError },
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
        content: sanitizedMessage,
        createdAt: new Date(),
      });
      inquiry.sellerUnreadCount += 1;
      inquiry.lastMessageAt = new Date();
      inquiry.status = inquiry.status === 'closed' ? 'new' : inquiry.status;
      // Update buyer intent if provided (they may update their needs)
      if (buyerIntent) {
        inquiry.buyerIntent = {
          quantity: buyerIntent.quantity || inquiry.buyerIntent?.quantity,
          timeline: buyerIntent.timeline || inquiry.buyerIntent?.timeline,
          purpose: buyerIntent.purpose || inquiry.buyerIntent?.purpose,
        };
      }
      await inquiry.save();
    } else {
      // Create new inquiry with buyer intent
      inquiry = await Inquiry.create({
        listing: listingId,
        buyer: buyerId,
        seller: sellerId,
        subject: sanitizedSubject || `Inquiry about ${listing.title}`,
        messages: [
          {
            sender: buyerId,
            content: sanitizedMessage,
            createdAt: new Date(),
          },
        ],
        sellerUnreadCount: 1,
        buyerIntent: buyerIntent || undefined,
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
