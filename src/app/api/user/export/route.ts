/**
 * THE RAIL EXCHANGE™ — User Data Export API
 * 
 * GDPR Article 20 Compliance: Right to Data Portability
 * 
 * Exports all user-generated content in machine-readable JSON format.
 * - Profile data
 * - Listings
 * - Messages
 * - Inquiries
 * - Saved searches
 * - Watchlists
 * 
 * Auth required - users can only export their own data.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import ContractorProfile from '@/models/ContractorProfile';
import Message from '@/models/Message';
import Inquiry from '@/models/Inquiry';
import SavedSearch from '@/models/SavedSearch';
import WatchlistItem from '@/models/WatchlistItem';
import Notification from '@/models/Notification';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // ================================================================
    // GDPR Article 20: Collect all user data for export
    // ================================================================

    // 1. User profile data
    const user = await User.findById(userId)
      .select('-password -resetToken -resetTokenExpiry')
      .lean();

    // 2. All user's listings
    const listings = await Listing.find({ sellerId: userId })
      .select('-__v')
      .lean();

    // 3. Contractor profile if exists
    const contractorProfile = await ContractorProfile.findOne({ userId: userId })
      .select('-__v')
      .lean();

    // 4. Messages where user is sender or recipient
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    })
      .select('-__v')
      .lean();

    // 5. Inquiries where user is buyer or seller
    const inquiries = await Inquiry.find({
      $or: [
        { buyer: userId },
        { seller: userId }
      ]
    })
      .select('-__v')
      .lean();

    // 6. Saved searches
    const savedSearches = await SavedSearch.find({ userId: userId })
      .select('-__v')
      .lean();

    // 7. Watchlist items
    const watchlistItems = await WatchlistItem.find({ userId: userId })
      .select('-__v')
      .lean();

    // 8. Notifications
    const notifications = await Notification.find({ userId: userId })
      .select('-__v')
      .lean();

    // Compile export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportFormat: 'JSON',
      gdprCompliance: 'Article 20 - Right to Data Portability',
      user: {
        profile: user,
        contractorProfile: contractorProfile || null,
      },
      content: {
        listings: listings,
        messages: messages,
        inquiries: inquiries,
      },
      activity: {
        savedSearches: savedSearches,
        watchlistItems: watchlistItems,
        notifications: notifications,
      },
      metadata: {
        totalListings: listings.length,
        totalMessages: messages.length,
        totalInquiries: inquiries.length,
        totalSavedSearches: savedSearches.length,
        totalWatchlistItems: watchlistItems.length,
        totalNotifications: notifications.length,
      },
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="railexchange-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
