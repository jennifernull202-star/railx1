/**
 * THE RAIL EXCHANGE™ — Admin Abuse Monitoring API
 * 
 * S-1.8: Dashboard indicators for abuse signals
 * 
 * GET /api/admin/abuse-signals
 * Returns abuse metrics for admin monitoring (flagging only, no automation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import ListingReport from '@/models/ListingReport';
import Inquiry from '@/models/Inquiry';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Admin only
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Gather abuse signals in parallel
    const [
      // Spam-suspended users
      spamSuspendedUsers,
      
      // Serial reporters flagged
      serialReporters,
      
      // False report rate-limited users
      reportRateLimitedUsers,
      
      // High spam warning users (2+ warnings)
      highSpamWarningUsers,
      
      // Flagged listings
      flaggedListings,
      
      // Auto-flagged listings (from duplicate images, etc.)
      autoFlaggedListings,
      
      // Listings with high report count
      highReportListings,
      
      // Pending reports
      pendingReports,
      
      // Recent reports (24h)
      recentReports24h,
      
      // Recent reports (7d)
      recentReports7d,
      
      // New accounts with high inquiry volume (potential spam)
      newAccountHighInquiry,
      
      // Users with rejected inquiries marked as spam
      usersWithSpammedInquiries,
    ] = await Promise.all([
      // Spam-suspended users
      User.countDocuments({
        spamSuspendedUntil: { $gt: now },
      }),
      
      // Serial reporters
      User.countDocuments({
        isSerialReporterFlagged: true,
      }),
      
      // Report rate-limited users
      User.countDocuments({
        reportRateLimitedUntil: { $gt: now },
      }),
      
      // High spam warning users
      User.countDocuments({
        spamWarnings: { $gte: 2 },
      }),
      
      // Manually flagged listings
      Listing.countDocuments({
        isFlagged: true,
        isActive: true,
      }),
      
      // Auto-flagged listings (S-1.3 duplicate detection, etc.)
      Listing.countDocuments({
        isFlagged: true,
        flagReason: { $regex: /auto|duplicate/i },
      }),
      
      // Listings with 3+ reports
      Listing.countDocuments({
        reportCount: { $gte: 3 },
        isActive: true,
      }),
      
      // Pending reports awaiting review
      ListingReport.countDocuments({
        status: 'pending',
      }),
      
      // Reports in last 24h
      ListingReport.countDocuments({
        createdAt: { $gte: twentyFourHoursAgo },
      }),
      
      // Reports in last 7d
      ListingReport.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
      
      // New accounts (< 7 days) with high inquiry count
      User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        inquirySpamMarkedCount: { $gte: 2 },
      }),
      
      // Users whose inquiries were marked spam
      User.countDocuments({
        inquirySpamMarkedCount: { $gte: 1 },
      }),
    ]);

    // Get top flagged listings for quick review
    const topFlaggedListings = await Listing.find({
      $or: [
        { isFlagged: true },
        { reportCount: { $gte: 3 } },
      ],
      isActive: true,
    })
      .select('title reportCount uniqueReporterCount isFlagged flagReason lastReportAt sellerId')
      .populate('sellerId', 'name email')
      .sort({ reportCount: -1, lastReportAt: -1 })
      .limit(10)
      .lean();

    // Get serial reporters for review
    const topSerialReporters = await User.find({
      isSerialReporterFlagged: true,
    })
      .select('name email reportCount serialReporterFlaggedAt createdAt')
      .sort({ serialReporterFlaggedAt: -1 })
      .limit(10)
      .lean();

    // Get recent pending reports
    const recentPendingReports = await ListingReport.find({
      status: 'pending',
    })
      .select('reason description createdAt listingId reporterId')
      .populate('listingId', 'title')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate severity score (simple heuristic)
    const severityScore = Math.min(100,
      (spamSuspendedUsers * 5) +
      (serialReporters * 10) +
      (flaggedListings * 3) +
      (pendingReports * 2) +
      (highSpamWarningUsers * 5)
    );

    const severityLevel = severityScore >= 50 ? 'high' : severityScore >= 20 ? 'medium' : 'low';

    return NextResponse.json({
      success: true,
      data: {
        // Summary metrics
        summary: {
          severityScore,
          severityLevel,
          requiresAttention: severityScore >= 20,
        },
        
        // User abuse signals
        users: {
          spamSuspended: spamSuspendedUsers,
          serialReporters,
          reportRateLimited: reportRateLimitedUsers,
          highSpamWarnings: highSpamWarningUsers,
          newAccountSpam: newAccountHighInquiry,
          inquiriesMarkedSpam: usersWithSpammedInquiries,
        },
        
        // Listing abuse signals
        listings: {
          flagged: flaggedListings,
          autoFlagged: autoFlaggedListings,
          highReportCount: highReportListings,
        },
        
        // Report metrics
        reports: {
          pending: pendingReports,
          last24h: recentReports24h,
          last7d: recentReports7d,
        },
        
        // Items for quick review
        reviewQueue: {
          flaggedListings: topFlaggedListings,
          serialReporters: topSerialReporters,
          pendingReports: recentPendingReports,
        },
      },
    });
  } catch (error) {
    console.error('Admin abuse signals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abuse signals' },
      { status: 500 }
    );
  }
}
