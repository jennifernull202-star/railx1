/**
 * THE RAIL EXCHANGE™ — Stripe Subscription Webhook Handler
 * 
 * Handles Stripe webhook events for subscription lifecycle:
 * - checkout.session.completed (new subscription)
 * - customer.subscription.updated (plan changes)
 * - customer.subscription.deleted (cancellation)
 * - invoice.payment_failed (payment issues)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import User, { SubscriptionStatusType, SellerTierType, ContractorTierType } from '@/models/User';
import AddOnPurchase from '@/models/AddOnPurchase';
import Listing from '@/models/Listing';
import SellerVerification from '@/models/SellerVerification';
import { ADD_ON_TYPES, VISIBILITY_ADDONS, calculateExpirationDate, type AddOnType } from '@/config/addons';

// Initialize Stripe lazily to avoid build-time errors
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key, {

  });
};

const getWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return secret;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    await connectDB();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      // #15 fix: Handle refunds
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled subscription event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { purchaseType, purchaseId, addonType, listingId, contractorId, userId, subscriptionType, tier, promoCode, type, verificationId } = session.metadata || {};

  // Handle seller verification (one-time payment)
  if ((type === 'seller_verification' || type === 'verified_seller') && verificationId && userId) {
    await handleVerifiedSellerCheckout(session, userId, verificationId);
    return;
  }

  // Handle add-on purchases
  if (purchaseType === 'addon' && purchaseId) {
    await handleAddonCheckoutComplete(session, purchaseId, addonType, listingId, contractorId);
    return;
  }

  // Handle subscription purchases
  if (!userId || !subscriptionType || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error(`User not found: ${userId}`);
    return;
  }

  // Get the actual subscription from Stripe to check trial status
  const stripe = getStripe();
  let subscriptionStatus: SubscriptionStatusType = 'active';
  let currentPeriodEnd: Date | null = null;
  
  if (session.subscription) {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;
      subscriptionStatus = mapStripeStatus(stripeSubscription.status);
      // Get current_period_end from the first subscription item
      if (stripeSubscription.items?.data?.[0]?.current_period_end) {
        currentPeriodEnd = new Date(stripeSubscription.items.data[0].current_period_end * 1000);
      }
      console.log(`Subscription ${session.subscription} status from Stripe: ${stripeSubscription.status} -> ${subscriptionStatus}`);
    } catch (err) {
      console.error('Failed to retrieve subscription from Stripe:', err);
    }
  }

  // Update user's subscription info
  if (subscriptionType === 'seller') {
    user.sellerTier = tier as SellerTierType;
    user.sellerSubscriptionStatus = subscriptionStatus;
    user.sellerSubscriptionId = session.subscription as string;
    if (currentPeriodEnd) {
      user.subscriptionCurrentPeriodEnd = currentPeriodEnd;
    }
    
    // isSeller is true by default - no role update needed
  } else if (subscriptionType === 'contractor') {
    user.contractorTier = tier as ContractorTierType;
    user.contractorSubscriptionStatus = subscriptionStatus;
    user.contractorSubscriptionId = session.subscription as string;
    if (currentPeriodEnd) {
      user.subscriptionCurrentPeriodEnd = currentPeriodEnd;
    }
    
    // Set isContractor capability flag
    user.isContractor = true;
    
    // CRITICAL: Set contractor verification status (UNIFIED VERIFICATION HIERARCHY)
    // Contractor verification is HIGHER than seller - automatically includes seller access
    user.contractorVerificationStatus = 'active';
    user.contractorVerificationSubscriptionId = session.subscription as string;
    
    // CRITICAL: Update ContractorProfile to activate verified badge
    if (tier === 'verified' || tier === 'featured' || tier === 'priority') {
      const ContractorProfile = (await import('@/models/ContractorProfile')).default;
      // Calculate expiration: 1 year for verification
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      await ContractorProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            verificationStatus: 'verified',
            verifiedBadgePurchased: true,
            verifiedAt: new Date(),
            verifiedBadgeExpiresAt: oneYearFromNow, // 1 year validity
            visibilityTier: tier,
            visibilitySubscriptionStatus: 'active',
          },
        }
      );
      console.log(`Contractor verified badge activated for user ${userId} - expires ${oneYearFromNow.toISOString()}`);
    }
  }

  // Record used promo code if one was applied
  if (promoCode && promoCode.trim()) {
    if (!user.usedPromoCodes) {
      user.usedPromoCodes = [];
    }
    user.usedPromoCodes.push({
      code: promoCode.toUpperCase(),
      usedAt: new Date(),
      subscriptionType: subscriptionType,
      tier: tier,
    });
    console.log(`Recorded promo code usage: ${promoCode} for user ${userId}`);
    
    // CRITICAL: Set sellerProActive for seller promo checkouts
    if (subscriptionType === 'seller') {
      user.sellerProActive = true;
      console.log(`sellerProActive set to true for user ${userId} via promo code`);
    }
  }

  user.stripeCustomerId = session.customer as string;
  await user.save();

  console.log(`Subscription activated for user ${userId}: ${subscriptionType} - ${tier}`);
}

// Handle verified seller subscription checkout
/**
 * Handle seller verification one-time payment completion
 * 
 * Two-tier system:
 * - Standard ($29): 24-hour AI approval SLA, 1-year validity
 * - Priority ($49): Instant verification, 3-day ranking boost, 1-year validity
 */
async function handleVerifiedSellerCheckout(
  session: Stripe.Checkout.Session,
  userId: string,
  verificationId: string
) {
  const { tier } = session.metadata || {};
  const verificationTier = (tier === 'priority' ? 'priority' : 'standard') as 'standard' | 'priority';

  const user = await User.findById(userId);
  if (!user) {
    console.error(`User not found for verified seller checkout: ${userId}`);
    return;
  }

  const verification = await SellerVerification.findById(verificationId);
  if (!verification) {
    console.error(`Verification not found: ${verificationId}`);
    return;
  }

  const now = new Date();
  
  // Calculate expiration: 1 year from now
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  // Priority tier gets 3-day ranking boost
  let rankingBoostExpiresAt: Date | null = null;
  if (verificationTier === 'priority') {
    rankingBoostExpiresAt = new Date(now);
    rankingBoostExpiresAt.setDate(rankingBoostExpiresAt.getDate() + 3);
  }

  // Update verification record
  verification.stripePaymentId = session.payment_intent as string;
  verification.verificationTier = verificationTier;
  verification.approvedAt = now;
  verification.expiresAt = oneYearFromNow;
  // Reset renewal reminder dates (undefined = not sent yet)
  verification.renewalRemindersSent = { thirtyDay: undefined, sevenDay: undefined, dayOf: undefined };
  
  if (rankingBoostExpiresAt) {
    verification.rankingBoostExpiresAt = rankingBoostExpiresAt;
  }
  
  // For priority tier: instant approval
  // For standard tier: set to pending-review (24h SLA for AI)
  if (verificationTier === 'priority') {
    verification.status = 'active';
    verification.statusHistory.push({
      status: 'active',
      changedAt: now,
      reason: 'Priority verification payment completed - instant activation',
    });
    
    // CRITICAL: Activate verified seller on user for priority
    user.isVerifiedSeller = true;
    user.verifiedSellerStatus = 'active';
    user.verifiedSellerTier = 'priority';
    user.verifiedSellerApprovedAt = now;
    user.verifiedSellerStartedAt = now;
    user.verifiedSellerExpiresAt = oneYearFromNow;
    user.verifiedSellerRankingBoostExpiresAt = rankingBoostExpiresAt;
    user.stripeCustomerId = session.customer as string;
    
    console.log(`Priority Verified Seller activated for user ${userId} - expires ${oneYearFromNow.toISOString()}`);
  } else {
    // Standard tier: payment received, pending AI review (24h SLA)
    verification.status = 'pending-ai';
    verification.statusHistory.push({
      status: 'pending-ai',
      changedAt: now,
      reason: 'Standard verification payment completed - pending 24h AI review',
    });
    
    // Set user status to pending-ai until AI review completes
    user.verifiedSellerStatus = 'pending-ai';
    user.verifiedSellerTier = 'standard';
    user.stripeCustomerId = session.customer as string;
    
    console.log(`Standard Verified Seller payment received for user ${userId} - pending AI review`);
  }

  await verification.save();
  await user.save();
}

// Handle add-on purchase completion
async function handleAddonCheckoutComplete(
  session: Stripe.Checkout.Session,
  purchaseId: string,
  addonType: string | undefined,
  listingId: string | undefined,
  contractorId: string | undefined
) {
  const purchase = await AddOnPurchase.findById(purchaseId);
  if (!purchase) {
    console.error(`Add-on purchase not found: ${purchaseId}`);
    return;
  }

  // Calculate expiration
  const type = (addonType || purchase.type) as AddOnType;
  const expiresAt = calculateExpirationDate(type);

  // Activate the purchase
  purchase.status = 'active';
  purchase.startedAt = new Date();
  purchase.expiresAt = expiresAt;
  purchase.stripePaymentId = session.payment_intent as string;
  await purchase.save();

  // PART 6 RULE 1: Purchasing an add-on MUST NOT auto-apply to a listing
  // The listing flags are set when user selects a listing via /api/addons/assign
  // We only update the listing if:
  // 1. A listingId was explicitly provided AND
  // 2. The purchase already has a listingId set (meaning user pre-selected during checkout)
  // For visibility add-ons (featured/premium/elite), user must select via dashboard
  const isVisibilityAddon = VISIBILITY_ADDONS.includes(type as typeof VISIBILITY_ADDONS[number]);
  const targetListingId = listingId || purchase.listingId?.toString();
  
  // Only auto-apply for non-visibility add-ons (AI enhancement, spec sheet)
  // OR if the purchase already had a listingId pre-set
  if (targetListingId && (!isVisibilityAddon || purchase.listingId)) {
    const updateData: Record<string, unknown> = {};
    
    if (type === ADD_ON_TYPES.FEATURED) {
      updateData['premiumAddOns.featured'] = {
        active: true,
        expiresAt: expiresAt,
      };
    } else if (type === ADD_ON_TYPES.PREMIUM) {
      updateData['premiumAddOns.premium'] = {
        active: true,
        expiresAt: expiresAt,
      };
      // Premium also gets featured
      updateData['premiumAddOns.featured'] = {
        active: true,
        expiresAt: expiresAt,
      };
    } else if (type === ADD_ON_TYPES.ELITE) {
      updateData['premiumAddOns.elite'] = {
        active: true,
        expiresAt: expiresAt,
      };
      // Elite gets premium and featured
      updateData['premiumAddOns.premium'] = {
        active: true,
        expiresAt: expiresAt,
      };
      updateData['premiumAddOns.featured'] = {
        active: true,
        expiresAt: expiresAt,
      };
    } else if (type === ADD_ON_TYPES.AI_ENHANCEMENT) {
      updateData['premiumAddOns.aiEnhanced'] = true;
    } else if (type === ADD_ON_TYPES.SPEC_SHEET) {
      updateData['premiumAddOns.specSheet'] = true;
    }

    if (Object.keys(updateData).length > 0) {
      await Listing.findByIdAndUpdate(targetListingId, { $set: updateData });
    }
  }

  console.log(`Add-on activated: ${type} for purchase ${purchaseId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { userId, subscriptionType, tier, type, verificationId } = subscription.metadata || {};

  // Handle verified seller subscription updates
  if (type === 'verified_seller') {
    await handleVerifiedSellerSubscriptionUpdate(subscription, userId, verificationId);
    return;
  }

  // Try to find user by subscription ID if no metadata
  let user;
  if (userId) {
    user = await User.findById(userId);
  } else {
    // Find by subscription ID (including verified seller)
    user = await User.findOne({
      $or: [
        { sellerSubscriptionId: subscription.id },
        { contractorSubscriptionId: subscription.id },
        { verifiedSellerSubscriptionId: subscription.id },
      ],
    });
  }

  if (!user) {
    console.error(`User not found for subscription: ${subscription.id}`);
    return;
  }

  // Check if this is a verified seller subscription
  if (user.verifiedSellerSubscriptionId === subscription.id) {
    const status = mapStripeStatus(subscription.status);
    if (status === 'active') {
      user.isVerifiedSeller = true;
      user.verifiedSellerStatus = 'active';
    } else if (['past_due', 'unpaid'].includes(status)) {
      // Keep badge but warn user
      user.verifiedSellerStatus = 'active'; // Still show badge
    } else if (['canceled', 'incomplete_expired'].includes(status)) {
      // Badge expires
      user.isVerifiedSeller = false;
      user.verifiedSellerStatus = 'expired';
      user.verifiedSellerExpiresAt = new Date();
    }
    await user.save();
    console.log(`Verified seller subscription updated for user ${user._id}: status=${status}`);
    return;
  }

  // Map Stripe status to our status
  const status = mapStripeStatus(subscription.status);

  // Determine which type of subscription this is
  const isSeller = user.sellerSubscriptionId === subscription.id || subscriptionType === 'seller';
  
  if (isSeller) {
    user.sellerSubscriptionStatus = status;
    if (tier) {
      user.sellerTier = tier as SellerTierType;
    }
  } else {
    user.contractorSubscriptionStatus = status;
    if (tier) {
      user.contractorTier = tier as ContractorTierType;
    }
  }

  // Update period end and cancel status
  // Use type assertion for webhook data which may have different structure
  const subscriptionData = subscription as unknown as { 
    current_period_end: number; 
    cancel_at_period_end: boolean 
  };
  user.subscriptionCurrentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
  user.subscriptionCancelAtPeriodEnd = subscriptionData.cancel_at_period_end;

  await user.save();
  console.log(`Subscription updated for user ${user._id}: status=${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find user by subscription ID (including verified seller)
  const user = await User.findOne({
    $or: [
      { sellerSubscriptionId: subscription.id },
      { contractorSubscriptionId: subscription.id },
      { verifiedSellerSubscriptionId: subscription.id },
    ],
  });

  if (!user) {
    console.error(`User not found for canceled subscription: ${subscription.id}`);
    return;
  }

  // Handle verified seller subscription cancellation
  if (user.verifiedSellerSubscriptionId === subscription.id) {
    // CRITICAL: Badge disappears immediately
    user.isVerifiedSeller = false;
    user.verifiedSellerStatus = 'expired';
    user.verifiedSellerExpiresAt = new Date();
    user.verifiedSellerSubscriptionId = null;

    // Update verification record
    const verification = await SellerVerification.findOne({ userId: user._id });
    if (verification) {
      verification.status = 'expired';
      verification.subscriptionStatus = 'canceled';
      verification.statusHistory.push({
        status: 'expired',
        changedAt: new Date(),
        reason: 'Subscription canceled',
      });
      await verification.save();
    }

    await user.save();
    console.log(`Verified Seller badge removed for user ${user._id} - subscription canceled`);
    return;
  }

  // Determine which subscription was canceled
  if (user.sellerSubscriptionId === subscription.id) {
    user.sellerTier = 'buyer';
    user.sellerSubscriptionStatus = 'canceled';
    user.sellerSubscriptionId = null;
    
    // isSeller remains true - capability based, not subscription based
  } else if (user.contractorSubscriptionId === subscription.id) {
    user.contractorTier = 'none'; // HARD GATE: Canceled = invisible
    user.contractorSubscriptionStatus = 'canceled';
    user.contractorSubscriptionId = null;
    
    // CRITICAL: Remove verified badge AND visibility from ContractorProfile
    const ContractorProfile = (await import('@/models/ContractorProfile')).default;
    await ContractorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          verificationStatus: 'expired',
          verifiedBadgePurchased: false,
          visibilityTier: 'none',
          visibilitySubscriptionStatus: 'canceled',
        },
      }
    );
    console.log(`Contractor verified badge removed for user ${user._id}`);
    
    // isContractor remains true - capability based, not subscription based
  }

  user.subscriptionCancelAtPeriodEnd = false;
  await user.save();

  console.log(`Subscription canceled for user ${user._id}`);
}

// Handle verified seller subscription updates
async function handleVerifiedSellerSubscriptionUpdate(
  subscription: Stripe.Subscription,
  userId?: string,
  verificationId?: string
) {
  const user = userId 
    ? await User.findById(userId)
    : await User.findOne({ verifiedSellerSubscriptionId: subscription.id });
  
  if (!user) return;

  const status = mapStripeStatus(subscription.status);
  const subscriptionData = subscription as unknown as { 
    current_period_end: number; 
    cancel_at_period_end: boolean 
  };

  if (status === 'active') {
    user.isVerifiedSeller = true;
    user.verifiedSellerStatus = 'active';
    user.verifiedSellerExpiresAt = new Date(subscriptionData.current_period_end * 1000);
  } else if (['past_due', 'unpaid'].includes(status)) {
    // Keep badge for grace period but mark status
    user.verifiedSellerStatus = 'active';
  } else {
    user.isVerifiedSeller = false;
    user.verifiedSellerStatus = 'expired';
    user.verifiedSellerExpiresAt = new Date();
  }

  await user.save();

  // Update verification record
  if (verificationId) {
    const verification = await SellerVerification.findById(verificationId);
    if (verification) {
      verification.subscriptionStatus = status === 'active' ? 'active' : 
        status === 'past_due' ? 'past_due' : 'canceled';
      await verification.save();
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Use type assertion for invoice data from webhook
  const invoiceData = invoice as unknown as { subscription?: string };
  const subscriptionId = invoiceData.subscription;
  if (!subscriptionId) return;

  const user = await User.findOne({
    $or: [
      { sellerSubscriptionId: subscriptionId },
      { contractorSubscriptionId: subscriptionId },
    ],
  });

  if (!user) {
    console.error(`User not found for failed payment: ${subscriptionId}`);
    return;
  }

  // Update status to past_due
  if (user.sellerSubscriptionId === subscriptionId) {
    user.sellerSubscriptionStatus = 'past_due';
  } else {
    user.contractorSubscriptionStatus = 'past_due';
  }

  await user.save();
  console.log(`Payment failed for user ${user._id}`);

  // TODO: Send email notification about failed payment
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Use type assertion for invoice data from webhook
  const invoiceData = invoice as unknown as { subscription?: string };
  const subscriptionId = invoiceData.subscription;
  if (!subscriptionId) return;

  const user = await User.findOne({
    $or: [
      { sellerSubscriptionId: subscriptionId },
      { contractorSubscriptionId: subscriptionId },
    ],
  });

  if (!user) return;

  // Restore active status if payment succeeded after being past_due
  if (user.sellerSubscriptionId === subscriptionId) {
    if (user.sellerSubscriptionStatus === 'past_due') {
      user.sellerSubscriptionStatus = 'active';
    }
  } else {
    if (user.contractorSubscriptionStatus === 'past_due') {
      user.contractorSubscriptionStatus = 'active';
    }
  }

  await user.save();
}

// #15 fix: Handle charge refunds
async function handleRefund(charge: Stripe.Charge) {
  // Get metadata from the charge or payment intent
  const metadata = charge.metadata || {};
  const { purchaseType, purchaseId, userId, subscriptionType } = metadata;

  console.log(`Processing refund for charge ${charge.id}, amount: ${charge.amount_refunded}`);

  // Handle add-on purchase refunds
  if (purchaseType === 'addon' && purchaseId) {
    const purchase = await AddOnPurchase.findById(purchaseId);
    if (purchase) {
      // Mark the add-on as cancelled
      purchase.status = 'cancelled';
      purchase.cancelledAt = new Date();
      purchase.cancelReason = 'refunded';
      await purchase.save();

      // If the add-on was applied to a listing, remove the badge
      if (purchase.listingId) {
        const listing = await Listing.findById(purchase.listingId);
        if (listing && listing.premiumAddOns) {
          const addonType = purchase.type as 'featured' | 'premium' | 'elite';
          if (listing.premiumAddOns[addonType]) {
            listing.premiumAddOns[addonType] = {
              active: false,
              expiresAt: undefined,
              purchasedAt: undefined,
            };
          }
          await listing.save();
        }
      }

      console.log(`Add-on purchase ${purchaseId} cancelled due to refund`);
    }
    return;
  }

  // Handle subscription refunds (if partial refund, may need to downgrade)
  if (userId && subscriptionType) {
    const user = await User.findById(userId);
    if (user) {
      // For full refunds, we typically rely on subscription.deleted event
      // But we can log it here for audit purposes
      console.log(`Refund processed for user ${userId}, subscription type: ${subscriptionType}`);
    }
  }

  // Also check if we can find the add-on purchase by payment intent
  if (charge.payment_intent) {
    const paymentIntentId = typeof charge.payment_intent === 'string' 
      ? charge.payment_intent 
      : charge.payment_intent.id;
    
    const purchase = await AddOnPurchase.findOne({ 
      stripePaymentIntentId: paymentIntentId 
    });
    
    if (purchase && purchase.status !== 'cancelled') {
      purchase.status = 'cancelled';
      purchase.cancelledAt = new Date();
      purchase.cancelReason = 'refunded';
      await purchase.save();

      // Remove badge from listing if applied
      if (purchase.listingId) {
        const listing = await Listing.findById(purchase.listingId);
        if (listing && listing.premiumAddOns) {
          const addonType = purchase.type as 'featured' | 'premium' | 'elite';
          if (listing.premiumAddOns[addonType]) {
            listing.premiumAddOns[addonType] = {
              active: false,
              expiresAt: undefined,
              purchasedAt: undefined,
            };
          }
          await listing.save();
        }
      }

      console.log(`Add-on purchase ${purchase._id} cancelled due to refund (found by payment intent)`);
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatusType {
  const statusMap: Record<string, SubscriptionStatusType> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    paused: 'paused',
  };

  return statusMap[stripeStatus] || 'active';
}