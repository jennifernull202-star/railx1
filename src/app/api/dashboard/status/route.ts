/**
 * THE RAIL EXCHANGE™ — Dashboard Status API
 * 
 * Returns comprehensive dashboard state in a single request:
 * - Subscription status (tier, status, trial info)
 * - Purchased add-ons
 * - Available add-ons
 * - Expiration dates
 * - Renewal state
 * 
 * GET /api/dashboard/status
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AddOnPurchase from '@/models/AddOnPurchase';
import Listing from '@/models/Listing';
import {
  SELLER_TIER_CONFIG,
  SELLER_TIERS,
  SellerTier,
} from '@/config/pricing';
import { ADD_ON_METADATA, getAllAddOnsInfo } from '@/config/addons';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get active listings count
    const activeListingsCount = await Listing.countDocuments({
      sellerId: session.user.id,
      status: { $in: ['active', 'pending'] },
    });

    // Get purchased add-ons
    const purchasedAddOns = await AddOnPurchase.find({
      userId: session.user.id,
      status: 'active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).lean();

    // Calculate trial info
    const sellerTier = (user.sellerTier as SellerTier) || SELLER_TIERS.BUYER;
    const subscriptionStatus = user.sellerSubscriptionStatus || null;
    const currentPeriodEnd = user.subscriptionCurrentPeriodEnd 
      ? new Date(user.subscriptionCurrentPeriodEnd) 
      : null;
    
    const isTrialing = subscriptionStatus === 'trialing';
    const isActive = subscriptionStatus === 'active';
    const isPastDue = subscriptionStatus === 'past_due';
    const isCanceled = subscriptionStatus === 'canceled';
    
    // Calculate days remaining in trial or subscription
    let daysRemaining: number | null = null;
    if (currentPeriodEnd) {
      const now = new Date();
      const diff = currentPeriodEnd.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Get tier configuration
    const tierConfig = SELLER_TIER_CONFIG[sellerTier] || SELLER_TIER_CONFIG[SELLER_TIERS.BUYER];

    // Build available add-ons (those not purchased)
    const purchasedAddonTypes = purchasedAddOns.map(p => p.type);
    const allAddOns = getAllAddOnsInfo();
    const availableAddOns = allAddOns.filter(
      addon => !purchasedAddonTypes.includes(addon.type)
    );

    const dashboardStatus = {
      // User info
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,

      // Subscription status
      subscription: {
        tier: sellerTier,
        tierName: tierConfig.name,
        status: subscriptionStatus,
        isTrialing,
        isActive: isActive || isTrialing,
        isPastDue,
        isCanceled,
        currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
        daysRemaining,
        cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd || false,
        stripeSubscriptionId: user.sellerSubscriptionId || null,
      },

      // Tier limits
      limits: {
        maxListings: tierConfig.listingLimit,
        currentListings: activeListingsCount,
        canCreateListing: tierConfig.listingLimit === -1 || activeListingsCount < tierConfig.listingLimit,
        features: tierConfig.features || [],
      },

      // Add-ons
      addons: {
        purchased: purchasedAddOns.map(addon => ({
          id: addon._id?.toString(),
          type: addon.type,
          name: addon.addonName || ADD_ON_METADATA[addon.type as keyof typeof ADD_ON_METADATA]?.name || addon.type,
          purchasedAt: addon.purchasedAt,
          expiresAt: addon.expiresAt,
          usageCount: addon.usageCount || 0,
          usageLimit: addon.usageLimit,
        })),
        available: availableAddOns.map(addon => ({
          type: addon.type,
          name: addon.name,
          description: addon.description,
          price: addon.price,
          priceId: addon.stripePriceId,
        })),
      },

      // Promo codes used
      usedPromoCodes: user.usedPromoCodes || [],

      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(dashboardStatus);
  } catch (error) {
    console.error('Dashboard status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard status' },
      { status: 500 }
    );
  }
}
