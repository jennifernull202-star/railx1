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
import { ADD_ON_TYPES, calculateExpirationDate, type AddOnType } from '@/config/addons';

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
  const { purchaseType, purchaseId, addonType, listingId, contractorId, userId, subscriptionType, tier } = session.metadata || {};

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

  // Update user's subscription info
  if (subscriptionType === 'seller') {
    user.sellerTier = tier as SellerTierType;
    user.sellerSubscriptionStatus = 'active';
    user.sellerSubscriptionId = session.subscription as string;
    
    // Update role if they were a buyer
    if (user.role === 'buyer') {
      user.role = 'seller';
    }
  } else if (subscriptionType === 'contractor') {
    user.contractorTier = tier as ContractorTierType;
    user.contractorSubscriptionStatus = 'active';
    user.contractorSubscriptionId = session.subscription as string;
    
    // Update role if needed
    if (user.role === 'buyer') {
      user.role = 'contractor';
    }
  }

  user.stripeCustomerId = session.customer as string;
  await user.save();

  console.log(`Subscription activated for user ${userId}: ${subscriptionType} - ${tier}`);
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

  // Update listing with add-on flags if applicable
  const targetListingId = listingId || purchase.listingId?.toString();
  if (targetListingId) {
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
  const { userId, subscriptionType, tier } = subscription.metadata || {};

  // Try to find user by subscription ID if no metadata
  let user;
  if (userId) {
    user = await User.findById(userId);
  } else {
    // Find by subscription ID
    user = await User.findOne({
      $or: [
        { sellerSubscriptionId: subscription.id },
        { contractorSubscriptionId: subscription.id },
      ],
    });
  }

  if (!user) {
    console.error(`User not found for subscription: ${subscription.id}`);
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
  // Find user by subscription ID
  const user = await User.findOne({
    $or: [
      { sellerSubscriptionId: subscription.id },
      { contractorSubscriptionId: subscription.id },
    ],
  });

  if (!user) {
    console.error(`User not found for canceled subscription: ${subscription.id}`);
    return;
  }

  // Determine which subscription was canceled
  if (user.sellerSubscriptionId === subscription.id) {
    user.sellerTier = 'buyer';
    user.sellerSubscriptionStatus = 'canceled';
    user.sellerSubscriptionId = null;
    
    // Downgrade role if they have no active contractor subscription
    if (user.role === 'seller' && !user.contractorSubscriptionId) {
      user.role = 'buyer';
    }
  } else if (user.contractorSubscriptionId === subscription.id) {
    user.contractorTier = 'free';
    user.contractorSubscriptionStatus = 'canceled';
    user.contractorSubscriptionId = null;
    
    // Downgrade role if they have no active seller subscription
    if (user.role === 'contractor' && !user.sellerSubscriptionId) {
      user.role = 'buyer';
    }
  }

  user.subscriptionCancelAtPeriodEnd = false;
  await user.save();

  console.log(`Subscription canceled for user ${user._id}`);
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