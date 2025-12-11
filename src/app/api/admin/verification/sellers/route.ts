/**
 * THE RAIL EXCHANGE™ — Admin Seller Verification API
 * 
 * GET /api/admin/verification/sellers
 * - List all pending and recent seller verifications
 * 
 * POST /api/admin/verification/sellers
 * - Approve or reject a seller verification
 * - On approval: Trigger Stripe subscription flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import Stripe from 'stripe';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, {});
};

// Stripe price IDs for Verified Seller
const VERIFIED_SELLER_PRICES = {
  monthly: process.env.STRIPE_PRICE_VERIFIED_SELLER_MONTHLY || 'price_1SdEFuAqLLDC50j4ZpMwfGBY',
  yearly: process.env.STRIPE_PRICE_VERIFIED_SELLER_YEARLY || 'price_1SdEGfAqLLDC50j4dQzxJksW',
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findOne({ email: session.user.email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending-admin';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: Record<string, unknown> = {};
    if (status !== 'all') {
      query.status = status;
    }

    const total = await SellerVerification.countDocuments(query);
    const verifications = await SellerVerification.find(query)
      .populate('userId', 'name email role sellerTier isVerifiedSeller verifiedSellerStatus')
      .populate('adminReview.reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      verifications: verifications.map(v => ({
        _id: v._id,
        userId: v.userId,
        status: v.status,
        documents: v.documents.map(d => ({
          type: d.type,
          fileName: d.fileName,
          uploadedAt: d.uploadedAt,
          s3Key: d.s3Key, // Admin can access
        })),
        aiVerification: v.aiVerification,
        adminReview: v.adminReview,
        subscriptionStatus: v.subscriptionStatus,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findOne({ email: session.user.email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { verificationId, action, notes, rejectionReason } = body;

    if (!verificationId) {
      return NextResponse.json(
        { error: 'Verification ID required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'revoke', 'reinstate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const verification = await SellerVerification.findById(verificationId);
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(verification.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    if (action === 'approve') {
      // Ensure user has Stripe customer ID
      if (!user.stripeCustomerId) {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString(),
          },
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      }

      // Check if subscription already exists
      if (verification.stripeSubscriptionId) {
        // Reactivate existing subscription if possible
        try {
          const existingSub = await stripe.subscriptions.retrieve(verification.stripeSubscriptionId);
          if (existingSub.status === 'canceled') {
            // Need to create new subscription
          } else {
            // Subscription exists and is valid
            verification.subscriptionStatus = 'active';
          }
        } catch {
          // Subscription doesn't exist, will create new one
        }
      }

      // Create subscription if needed (user will complete payment via checkout)
      // For now, mark as pending subscription
      verification.adminReview = {
        status: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
        notes: notes || '',
      };
      verification.subscriptionStatus = 'pending';
      verification.statusHistory.push({
        status: 'approved-pending-payment',
        changedAt: new Date(),
        changedBy: admin._id,
        reason: 'Admin approved. Awaiting subscription payment.',
      });

      await verification.save();

      // Update user status (not yet active until payment)
      user.verifiedSellerStatus = 'pending-admin'; // Keep pending until payment
      await user.save();

      // Generate checkout URL for the user
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: VERIFIED_SELLER_PRICES.monthly,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://therailexchange.com'}/dashboard/verification/seller?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://therailexchange.com'}/dashboard/verification/seller?canceled=true`,
        metadata: {
          userId: user._id.toString(),
          verificationId: verification._id.toString(),
          type: 'verified_seller',
        },
        subscription_data: {
          metadata: {
            userId: user._id.toString(),
            verificationId: verification._id.toString(),
            type: 'verified_seller',
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'approved',
        checkoutUrl: checkoutSession.url,
        message: 'Verification approved. User must complete subscription payment.',
      });
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason required' },
          { status: 400 }
        );
      }

      verification.adminReview = {
        status: 'rejected',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
        notes: notes || '',
        rejectionReason,
      };
      verification.status = 'draft'; // Allow resubmission
      verification.statusHistory.push({
        status: 'rejected',
        changedAt: new Date(),
        changedBy: admin._id,
        reason: rejectionReason,
      });

      await verification.save();

      // Update user
      user.verifiedSellerStatus = 'none';
      user.isVerifiedSeller = false;
      await user.save();

      // TODO: Send rejection email with reason
      
      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'Verification rejected',
      });
    }

    if (action === 'revoke') {
      // Cancel subscription if active
      if (verification.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(verification.stripeSubscriptionId);
        } catch (err) {
          console.error('Failed to cancel subscription:', err);
        }
      }

      verification.status = 'revoked';
      verification.subscriptionStatus = 'canceled';
      verification.statusHistory.push({
        status: 'revoked',
        changedAt: new Date(),
        changedBy: admin._id,
        reason: notes || 'Badge revoked by admin',
      });

      await verification.save();

      // Update user - badge disappears immediately
      user.isVerifiedSeller = false;
      user.verifiedSellerStatus = 'revoked';
      user.verifiedSellerExpiresAt = new Date();
      await user.save();

      return NextResponse.json({
        success: true,
        action: 'revoked',
        message: 'Verified seller badge revoked',
      });
    }

    if (action === 'reinstate') {
      // Check if subscription can be reactivated
      verification.adminReview.status = 'approved';
      verification.adminReview.notes = notes || 'Reinstated by admin';
      verification.status = 'pending-admin'; // Need new payment
      verification.statusHistory.push({
        status: 'reinstated',
        changedAt: new Date(),
        changedBy: admin._id,
        reason: notes || 'Badge reinstated by admin - pending new subscription',
      });

      await verification.save();

      user.verifiedSellerStatus = 'pending-admin';
      await user.save();

      return NextResponse.json({
        success: true,
        action: 'reinstated',
        message: 'Verification reinstated. User must complete subscription payment.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing verification action:', error);
    return NextResponse.json(
      { error: 'Failed to process verification action' },
      { status: 500 }
    );
  }
}
