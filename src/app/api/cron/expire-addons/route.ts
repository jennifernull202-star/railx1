/**
 * THE RAIL EXCHANGE™ — Add-On Expiration Cron Handler
 * 
 * GET /api/cron/expire-addons
 * 
 * PART 6 RULE 6: Automatic expiration handling required
 * Expired add-ons MUST be:
 * - removed from listing
 * - badges removed
 * - ranking removed
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AddOnPurchase from '@/models/AddOnPurchase';
import Listing from '@/models/Listing';
import { ADD_ON_TYPES } from '@/config/addons';

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();

    // Find all expired add-ons that are still marked as active
    const expiredPurchases = await AddOnPurchase.find({
      status: 'active',
      expiresAt: { $lt: now },
    });

    console.log(`Found ${expiredPurchases.length} expired add-ons to process`);

    let processed = 0;
    let errors = 0;

    for (const purchase of expiredPurchases) {
      try {
        // Update purchase status to expired
        purchase.status = 'expired';
        await purchase.save();

        // If purchase has a listing, remove the add-on flags
        if (purchase.listingId) {
          const updateData: Record<string, unknown> = {};
          const type = purchase.type;

          if (type === ADD_ON_TYPES.FEATURED) {
            updateData['premiumAddOns.featured.active'] = false;
          } else if (type === ADD_ON_TYPES.PREMIUM) {
            updateData['premiumAddOns.premium.active'] = false;
            // Also check if featured should be removed (if no other source)
            const otherFeaturedSource = await AddOnPurchase.findOne({
              listingId: purchase.listingId,
              type: { $in: [ADD_ON_TYPES.ELITE] }, // Elite also provides featured
              status: 'active',
              expiresAt: { $gt: now },
            });
            if (!otherFeaturedSource) {
              updateData['premiumAddOns.featured.active'] = false;
            }
          } else if (type === ADD_ON_TYPES.ELITE) {
            updateData['premiumAddOns.elite.active'] = false;
            // Also check if premium/featured should be removed
            const otherPremiumSource = await AddOnPurchase.findOne({
              listingId: purchase.listingId,
              type: ADD_ON_TYPES.PREMIUM,
              status: 'active',
              expiresAt: { $gt: now },
            });
            if (!otherPremiumSource) {
              updateData['premiumAddOns.premium.active'] = false;
            }
            const otherFeaturedSource = await AddOnPurchase.findOne({
              listingId: purchase.listingId,
              type: { $in: [ADD_ON_TYPES.FEATURED, ADD_ON_TYPES.PREMIUM] },
              status: 'active',
              expiresAt: { $gt: now },
            });
            if (!otherFeaturedSource) {
              updateData['premiumAddOns.featured.active'] = false;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await Listing.findByIdAndUpdate(purchase.listingId, { $set: updateData });
            console.log(`Removed add-on ${type} from listing ${purchase.listingId}`);
          }
        }

        processed++;
      } catch (error) {
        console.error(`Error processing expired purchase ${purchase._id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} expired add-ons (${errors} errors)`,
      processed,
      errors,
      total: expiredPurchases.length,
    });
  } catch (error) {
    console.error('Expire add-ons cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
