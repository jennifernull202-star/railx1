import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import ContractorProfile from '@/models/ContractorProfile';
import Inquiry from '@/models/Inquiry';
import AddOnPurchase from '@/models/AddOnPurchase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch overview stats
    const [
      totalUsers,
      totalListings,
      totalContractors,
      totalInquiries,
      addOnPurchases,
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      ContractorProfile.countDocuments(),
      Inquiry.countDocuments(),
      AddOnPurchase.find({ status: 'active' }).lean(),
    ]);

    // Calculate revenue from add-on purchases
    const totalRevenue = addOnPurchases.reduce((sum, purchase) => {
      return sum + (purchase.price || 0);
    }, 0);

    // Listings by category
    const listingsByCategory = await Listing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    // Listings by status
    const listingsByStatus = await Listing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Top locations
    const topLocations = await Listing.aggregate([
      { $match: { 'location.state': { $exists: true, $ne: null } } },
      { $group: { _id: '$location.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { location: '$_id', count: 1, _id: 0 } },
    ]);

    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Recent activity (last 20 items)
    const recentListings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title createdAt')
      .lean();

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name createdAt')
      .lean();

    const recentActivity = [
      ...recentListings.map((l) => ({
        type: 'listing',
        description: `New listing: "${l.title}"`,
        timestamp: l.createdAt,
      })),
      ...recentUsers.map((u) => ({
        type: 'user',
        description: `New user registered: ${u.name}`,
        timestamp: u.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({
      overview: {
        totalUsers,
        totalListings,
        totalContractors,
        totalInquiries,
        totalRevenue,
      },
      userGrowth,
      listingsByCategory,
      listingsByStatus,
      topLocations,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
