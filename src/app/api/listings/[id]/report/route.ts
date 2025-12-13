/**
 * THE RAIL EXCHANGE™ — Report Listing API
 * 
 * POST /api/listings/[id]/report
 * 
 * SECURITY: User-facing reporting mechanism for suspicious listings.
 * Rate limited to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import ListingReport, { REPORT_REASONS, type ReportReason } from '@/models/ListingReport';
import User from '@/models/User';
import { Types } from 'mongoose';
import { checkRateLimit } from '@/lib/rate-limit';
import { rateLimitRequest } from '@/lib/redis-rate-limit';
import { sanitizeString, validateEnum } from '@/lib/sanitize';
import { canUserSubmitReport, REPORT_ABUSE_LIMITS } from '@/lib/abuse-prevention';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // Must be authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to report listings' },
        { status: 401 }
      );
    }

    // S-1.7: Redis-backed rate limiting for reports
    const redisRateLimit = await rateLimitRequest('report', request, {
      userId: session.user.id,
      isVerified: session.user.isVerifiedContractor || session.user.isSeller || false,
    });
    if (redisRateLimit) {
      return redisRateLimit;
    }

    // Additional in-memory rate limit check
    const rateLimitResult = await checkRateLimit(request, {
      userId: session.user.id,
      isVerified: session.user.isVerifiedContractor || session.user.isSeller || false,
    });

    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // SECURITY: Email verification required (BATCH E-3)
    const user = await User.findById(session.user.id).select(
      'emailVerified createdAt rejectedReportCount reportRateLimitedUntil'
    );
    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required to report listings' },
        { status: 403 }
      );
    }
    
    // S-1.4: Check minimum account age to submit reports (24 hours)
    const accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
    if (accountAgeHours < REPORT_ABUSE_LIMITS.MIN_ACCOUNT_AGE_HOURS) {
      return NextResponse.json(
        { error: 'Your account must be at least 24 hours old to submit reports.' },
        { status: 403 }
      );
    }
    
    // S-1.4: Check if user is rate-limited for false reports
    const reportCheck = canUserSubmitReport(
      user.rejectedReportCount || 0,
      user.reportRateLimitedUntil
    );
    if (!reportCheck.canReport) {
      return NextResponse.json(
        { error: reportCheck.reason || 'Report submission is temporarily unavailable.' },
        { status: 403 }
      );
    }

    // Verify listing exists
    const listing = await Listing.findById(id).select('sellerId title');
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Can't report own listing
    if (listing.sellerId.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot report your own listing' },
        { status: 400 }
      );
    }

    // Check if user already reported this listing
    const alreadyReported = await ListingReport.hasUserReported(id, session.user.id);
    if (alreadyReported) {
      return NextResponse.json(
        { error: 'You have already reported this listing' },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate reason
    const reason = validateEnum(body.reason, REPORT_REASONS);
    if (!reason) {
      return NextResponse.json(
        { error: 'Valid report reason is required' },
        { status: 400 }
      );
    }

    // Sanitize description
    const description = sanitizeString(body.description, {
      maxLength: 2000,
      minLength: 10,
      stripHTML: true,
    });
    if (!description) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 2000 characters' },
        { status: 400 }
      );
    }

    // Validate evidence URLs (optional)
    let evidence: string[] = [];
    if (body.evidence && Array.isArray(body.evidence)) {
      evidence = body.evidence
        .filter((url: unknown) => typeof url === 'string')
        .slice(0, 5) // Max 5 evidence items
        .map((url: string) => url.trim().substring(0, 500));
    }

    // Create report
    const report = await ListingReport.create({
      listingId: new Types.ObjectId(id),
      reporterId: new Types.ObjectId(session.user.id),
      reason: reason as ReportReason,
      description,
      evidence,
      status: 'pending',
    });

    // BATCH E-3: Check for serial reporter behavior (internal flagging only)
    try {
      const serialCheck = await ListingReport.checkSerialReporter(session.user.id);
      if (serialCheck.isSerialReporter) {
        // Flag user internally - no user-facing action
        await User.updateOne(
          { _id: session.user.id },
          {
            $set: {
              isSerialReporterFlagged: true,
              serialReporterFlaggedAt: new Date(),
            },
          }
        );
        console.warn(`Serial reporter flagged: userId=${session.user.id}, 24h=${serialCheck.reportCountLast24h}, 7d=${serialCheck.reportCountLast7d}`);
      }
    } catch (serialError) {
      // Log but don't fail the request
      console.error('Serial reporter check failed:', serialError);
    }

    // Get report count for response
    const reportCount = await ListingReport.getReportCount(id);

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: {
        reportId: report._id,
        listingId: id,
        reason,
        status: 'pending',
        totalReports: reportCount,
      },
    });
  } catch (error) {
    console.error('Report listing error:', error);

    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'You have already reported this listing' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET - Check if user has reported this listing
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ hasReported: false });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const hasReported = await ListingReport.hasUserReported(id, session.user.id);

    return NextResponse.json({
      success: true,
      hasReported,
    });
  } catch (error) {
    console.error('Check report status error:', error);
    return NextResponse.json(
      { error: 'Failed to check report status' },
      { status: 500 }
    );
  }
}
