/**
 * THE RAIL EXCHANGE™ — SEO Status API
 * 
 * GET /api/analytics/seo-status?targetType=xxx&targetId=xxx
 * 
 * Returns SEO visibility status for an entity.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SEO VISIBILITY TOOLING (READ-ONLY)                                      │
 * │                                                                          │
 * │ Returns:                                                                 │
 * │ • Page title and description                                            │
 * │ • Canonical URL                                                         │
 * │ • Indexing status (Indexed, Pending, Excluded)                          │
 * │ • Map/Geo visibility                                                    │
 * │ • Structured data indicators                                            │
 * │ • Sitemap inclusion status                                              │
 * │                                                                          │
 * │ NOTE: READ-ONLY. No SEO editing.                                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import ContractorProfile from '@/models/ContractorProfile';
import AddOnPurchase from '@/models/AddOnPurchase';
import mongoose from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type TargetType = 'listing' | 'contractor' | 'seller' | 'company';
type IndexingStatus = 'indexed' | 'pending' | 'excluded' | 'unknown';

interface SEOStatusResponse {
  title: string;
  description: string;
  canonicalUrl: string;
  indexingStatus: IndexingStatus;
  hasMapVisibility: boolean;
  geoLocation?: {
    city?: string;
    state?: string;
    region?: string;
  };
  structuredData: {
    organization?: boolean;
    localBusiness?: boolean;
    product?: boolean;
    review?: boolean;
  };
  inSitemap: boolean;
  lastCrawled?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Retrieve SEO status
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType') as TargetType | null;
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: 'Missing targetType or targetId' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build SEO status based on target type
    let seoStatus: SEOStatusResponse;

    switch (targetType) {
      case 'contractor': {
        const profile = await ContractorProfile.findOne({ userId: new mongoose.Types.ObjectId(targetId) }).lean();
        const user = await User.findById(targetId).lean();
        
        if (!profile || !user) {
          return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
        }

        const businessName = profile.businessName || user.name || 'Unknown';
        const contractorTypes = profile.contractorTypes || [];
        const typeLabel = contractorTypes[0] || 'Contractor';

        // Check verification status
        const isVerified = profile.verificationStatus === 'verified' || 
                          profile.verificationStatus === 'approved';

        seoStatus = {
          title: `${businessName} | ${typeLabel} | The Rail Exchange`,
          description: profile.businessDescription?.slice(0, 160) ||
            `${businessName} is a verified rail contractor offering professional services on The Rail Exchange.`,
          canonicalUrl: `https://therailexchange.com/contractors/${profile._id}`,
          indexingStatus: isVerified ? 'indexed' : 'pending',
          hasMapVisibility: true, // Contractors always have map visibility
          geoLocation: {
            city: profile.address?.city,
            state: profile.address?.state,
          },
          structuredData: {
            organization: true,
            localBusiness: true,
            product: false,
            review: false, // TODO: Add when reviews are implemented
          },
          inSitemap: isVerified,
        };
        break;
      }

      case 'company': {
        const user = await User.findById(targetId).lean();
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
        }

        const companyName = user.company || user.name || 'Unknown';
        // Companies verified through seller verification or contractor status
        const isCompanyVerified = user.isVerifiedSeller === true || 
          user.contractorVerificationStatus === 'active';

        seoStatus = {
          title: `${companyName} | Rail Equipment Company | The Rail Exchange`,
          description: `${companyName} is a verified rail equipment company on The Rail Exchange.`,
          canonicalUrl: `https://therailexchange.com/companies/${targetId}`,
          indexingStatus: isCompanyVerified ? 'indexed' : 'pending',
          hasMapVisibility: true, // Companies always have map visibility
          // Note: User model doesn't have location, would need ContractorProfile
          geoLocation: undefined,
          structuredData: {
            organization: true,
            localBusiness: true,
            product: true,
            review: false,
          },
          inSitemap: isCompanyVerified,
        };
        break;
      }

      case 'seller': {
        const user = await User.findById(targetId).lean();
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
        }

        // Check for Elite Placement add-on for map visibility
        const eliteAddOn = await AddOnPurchase.findOne({
          userId: new mongoose.Types.ObjectId(targetId),
          addonType: 'elite_placement',
          status: 'active',
          expiresAt: { $gt: new Date() },
        }).lean();
        const hasElitePlacement = !!eliteAddOn;

        const sellerName = user.company || user.name || 'Unknown';

        seoStatus = {
          title: `${sellerName} | Verified Seller | The Rail Exchange`,
          description: `${sellerName} is a verified seller on The Rail Exchange marketplace for rail equipment.`,
          canonicalUrl: `https://therailexchange.com/sellers/${targetId}`,
          indexingStatus: user.isVerifiedSeller ? 'indexed' : 'pending',
          hasMapVisibility: hasElitePlacement, // Sellers: Elite Placement only
          // Note: User model doesn't have location
          geoLocation: undefined,
          structuredData: {
            organization: false,
            localBusiness: false,
            product: true,
            review: false,
          },
          inSitemap: user.isVerifiedSeller === true,
        };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid target type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: seoStatus,
    });

  } catch (error) {
    console.error('SEO status fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEO status' },
      { status: 500 }
    );
  }
}
