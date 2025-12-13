/**
 * THE RAIL EXCHANGE™ — Account Deletion API
 * 
 * Permanently delete user account and associated data.
 * 
 * GDPR/Enterprise Compliance:
 * - Deletes all user-generated content
 * - Anonymizes audit logs (retains for compliance)
 * - Cleans up all related data
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
import AdminAuditLog from '@/models/AdminAuditLog';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // ================================================================
    // GDPR/Enterprise Data Cleanup
    // Delete or anonymize all user-associated data
    // ================================================================

    // 1. Delete all user's listings
    await Listing.deleteMany({ sellerId: userId });

    // 2. Delete contractor profile if exists
    await ContractorProfile.deleteOne({ userId: userId });

    // 3. Delete message threads where user is sender or recipient
    await Message.deleteMany({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    });

    // 4. Delete inquiries where user is buyer or seller
    await Inquiry.deleteMany({
      $or: [
        { buyer: userId },
        { seller: userId }
      ]
    });

    // 5. Delete saved searches
    await SavedSearch.deleteMany({ userId: userId });

    // 6. Delete watchlist items
    await WatchlistItem.deleteMany({ userId: userId });

    // 7. Delete notifications
    await Notification.deleteMany({ userId: userId });

    // 8. Anonymize admin audit logs (keep for compliance, remove PII)
    await AdminAuditLog.updateMany(
      { targetId: userId, targetType: 'user' },
      { 
        $set: { 
          targetTitle: '[DELETED USER]',
          'details.userName': '[DELETED]',
          'details.userEmail': '[DELETED]'
        }
      }
    );

    // 9. Delete user account (last step)
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
