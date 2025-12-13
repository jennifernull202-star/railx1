/**
 * THE RAIL EXCHANGE™ — Stripe Verification Utility
 * 
 * SECURITY: Stripe is the source of truth for payment status.
 * Do not trust DB alone for subscription access.
 * 
 * RULES:
 * 1. Verify active subscriptions via Stripe when possible
 * 2. Check subscription status before granting access
 * 3. Cache results briefly to reduce API calls
 * 4. Fail closed - if Stripe check fails, deny access
 */

import Stripe from 'stripe';

// In-memory cache for subscription status
// Key: subscriptionId, Value: { status, cachedAt }
const subscriptionCache = new Map<string, { status: string; currentPeriodEnd: Date | null; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Initialize Stripe client
const getStripe = (): Stripe | null => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('STRIPE_SECRET_KEY not configured');
    return null;
  }
  return new Stripe(key);
};

/**
 * Subscription verification result
 */
export interface SubscriptionVerification {
  valid: boolean;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  error?: string;
  source: 'stripe' | 'cache' | 'db-fallback';
}

/**
 * Verify subscription status directly with Stripe
 */
export async function verifySubscriptionWithStripe(
  subscriptionId: string | null
): Promise<SubscriptionVerification> {
  // No subscription ID = not subscribed
  if (!subscriptionId) {
    return {
      valid: false,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      source: 'stripe',
    };
  }

  // Check cache first
  const cached = subscriptionCache.get(subscriptionId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      valid: cached.status === 'active' || cached.status === 'trialing',
      status: cached.status,
      currentPeriodEnd: cached.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      source: 'cache',
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    // SECURITY: Fail closed - if no Stripe client, can't verify
    return {
      valid: false,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      error: 'Payment verification unavailable',
      source: 'stripe',
    };
  }

  try {
    // Stripe SDK returns the subscription object directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

    const result: SubscriptionVerification = {
      valid: subscription.status === 'active' || subscription.status === 'trialing',
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      source: 'stripe',
    };

    // Update cache
    subscriptionCache.set(subscriptionId, {
      status: subscription.status,
      currentPeriodEnd: result.currentPeriodEnd,
      cachedAt: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Stripe subscription verification failed:', error);

    // SECURITY: Fail closed - if Stripe check fails, deny access
    return {
      valid: false,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      error: 'Failed to verify subscription status',
      source: 'stripe',
    };
  }
}

/**
 * Verify seller subscription is active
 */
export async function verifySellerSubscription(
  subscriptionId: string | null,
  dbStatus: string | null
): Promise<SubscriptionVerification> {
  // If DB says inactive, trust it (conservative)
  if (dbStatus === 'canceled' || dbStatus === 'expired') {
    return {
      valid: false,
      status: dbStatus,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      source: 'db-fallback',
    };
  }

  // Verify with Stripe
  return verifySubscriptionWithStripe(subscriptionId);
}

/**
 * Verify contractor subscription is active
 */
export async function verifyContractorSubscription(
  subscriptionId: string | null,
  dbStatus: string | null
): Promise<SubscriptionVerification> {
  // If DB says inactive, trust it (conservative)
  if (dbStatus === 'canceled' || dbStatus === 'expired') {
    return {
      valid: false,
      status: dbStatus,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      source: 'db-fallback',
    };
  }

  // Verify with Stripe
  return verifySubscriptionWithStripe(subscriptionId);
}

/**
 * Verify add-on purchase is active
 */
export async function verifyAddOnPurchase(
  paymentIntentId: string | null
): Promise<{ valid: boolean; error?: string }> {
  if (!paymentIntentId) {
    return { valid: false };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { valid: false, error: 'Payment verification unavailable' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { valid: paymentIntent.status === 'succeeded' };
  } catch (error) {
    console.error('Payment intent verification failed:', error);
    return { valid: false, error: 'Failed to verify payment' };
  }
}

/**
 * Check if user has active seller verification
 * Combines DB status with Stripe verification
 */
export async function hasActiveSellerVerification(user: {
  isVerifiedSeller?: boolean;
  verifiedSellerStatus?: string;
  verifiedSellerExpiresAt?: Date | null;
  verifiedSellerSubscriptionId?: string | null;
}): Promise<{ active: boolean; reason?: string }> {
  // Check expiration first
  if (user.verifiedSellerExpiresAt && new Date(user.verifiedSellerExpiresAt) < new Date()) {
    return { active: false, reason: 'Verification expired' };
  }

  // Check DB status
  if (user.verifiedSellerStatus !== 'active') {
    return { active: false, reason: 'Verification not active' };
  }

  // Verify subscription with Stripe if we have an ID
  if (user.verifiedSellerSubscriptionId) {
    const verification = await verifySubscriptionWithStripe(user.verifiedSellerSubscriptionId);
    if (!verification.valid) {
      return { active: false, reason: verification.error || 'Subscription not active' };
    }
  }

  return { active: true };
}

/**
 * Check if user has active contractor visibility
 */
export async function hasActiveContractorVisibility(user: {
  contractorSubscriptionStatus?: string | null;
  contractorSubscriptionId?: string | null;
  contractorCurrentPeriodEnd?: Date | null;
}): Promise<{ active: boolean; reason?: string }> {
  // Check period end
  if (user.contractorCurrentPeriodEnd && new Date(user.contractorCurrentPeriodEnd) < new Date()) {
    return { active: false, reason: 'Subscription period ended' };
  }

  // Check DB status
  if (user.contractorSubscriptionStatus !== 'active' && user.contractorSubscriptionStatus !== 'trialing') {
    return { active: false, reason: 'Subscription not active' };
  }

  // Verify with Stripe
  if (user.contractorSubscriptionId) {
    const verification = await verifySubscriptionWithStripe(user.contractorSubscriptionId);
    if (!verification.valid) {
      return { active: false, reason: verification.error || 'Subscription not active' };
    }
  }

  return { active: true };
}

/**
 * Clear subscription cache (for testing or forced refresh)
 */
export function clearSubscriptionCache(subscriptionId?: string): void {
  if (subscriptionId) {
    subscriptionCache.delete(subscriptionId);
  } else {
    subscriptionCache.clear();
  }
}
