/**
 * THE RAIL EXCHANGE™ — Add-On Stats API
 * 
 * GET /api/addons/stats
 * 
 * Returns summary statistics for the current user's add-ons:
 * - Total purchases
 * - Active add-ons
 * - Pending add-ons
 * - Expiring soon (within 7 days)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AddOnPurchase from '@/models/AddOnPurchase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all add-on counts in a single aggregation
    const [stats] = await AddOnPurchase.aggregate([
      { $match: { userId: session.user.id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'active'] },
                1,
                0
              ]
            }
          },
          pending: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                1,
                0
              ]
            }
          },
          expiringSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$expiresAt', null] },
                    { $lte: ['$expiresAt', sevenDaysFromNow] },
                    { $gt: ['$expiresAt', now] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return NextResponse.json({
      total: stats?.total || 0,
      active: stats?.active || 0,
      pending: stats?.pending || 0,
      expiringSoon: stats?.expiringSoon || 0,
    });
  } catch (error) {
    console.error('Add-on stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
