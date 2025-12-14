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

// SECURITY: CRON_SECRET is REQUIRED - fail closed if not configured
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify authorization - ALWAYS require secret
    // Fail closed: If CRON_SECRET is not set, deny all access
    if (!CRON_SECRET) {
      console.error('SECURITY: CRON_SECRET not configured - blocking cron access');
      return NextResponse.json({ error: 'Service not configured' }, { status: 401 });
    }
    
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
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

          // Elite is the ONLY placement tier (no Premium/Featured tiers)
          if (type === ADD_ON_TYPES.ELITE) {
            updateData['premiumAddOns.elite.active'] = false;
            // Also remove legacy premium/featured flags since Elite was the only source
            updateData['premiumAddOns.premium.active'] = false;
            updateData['premiumAddOns.featured.active'] = false;
          } else if (type === ADD_ON_TYPES.VERIFIED_BADGE) {
            updateData['premiumAddOns.verifiedBadge.active'] = false;
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
