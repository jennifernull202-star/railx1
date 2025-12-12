/**
 * THE RAIL EXCHANGE™ — Subscription Tier Display Component
 * 
 * Shows current subscription tier, benefits, and usage (listing counts).
 * Used on seller and contractor dashboards.
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  SellerTier,
  ContractorTier,
  SELLER_TIER_CONFIG,
  CONTRACTOR_TIER_CONFIG,
  SELLER_TIERS,
  CONTRACTOR_TIERS,
  LISTING_LIMITS,
  formatSubscriptionPrice,
} from '@/config/pricing';

interface SubscriptionInfo {
  sellerTier: SellerTier;
  sellerStatus: string | null;
  contractorTier: ContractorTier;
  contractorStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  activeListingCount: number;
}

interface SubscriptionTierCardProps {
  type: 'seller' | 'contractor';
  variant?: 'compact' | 'detailed';
  className?: string;
}

export default function SubscriptionTierCard({
  type,
  variant = 'detailed',
  className = '',
}: SubscriptionTierCardProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions');
        if (!response.ok) throw new Error('Failed to fetch subscription');
        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className={`bg-surface-secondary rounded-xl p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-surface-tertiary rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-surface-tertiary rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className={`bg-surface-secondary rounded-xl p-6 ${className}`}>
        <p className="text-text-secondary">Unable to load subscription info</p>
      </div>
    );
  }

  // Seller tier display
  if (type === 'seller') {
    const tier = subscription.sellerTier || SELLER_TIERS.BUYER;
    const config = SELLER_TIER_CONFIG[tier];
    const limit = LISTING_LIMITS[tier];
    const current = subscription.activeListingCount || 0;
    const isUnlimited = limit === -1;
    const usage = isUnlimited ? null : Math.min((current / limit) * 100, 100);
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - current);
    const isAtLimit = !isUnlimited && current >= limit;

    if (variant === 'compact') {
      return (
        <div className={`bg-surface-secondary rounded-lg p-4 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{config.name}</span>
              {tier !== SELLER_TIERS.BUYER && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  subscription.sellerStatus === 'active' 
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {subscription.sellerStatus === 'active' ? 'Active' : subscription.sellerStatus || 'Free'}
                </span>
              )}
            </div>
            <div className="text-sm text-text-secondary">
              {isUnlimited ? (
                <span>Unlimited listings</span>
              ) : (
                <span>{current}/{limit} listings</span>
              )}
            </div>
          </div>
          {!isUnlimited && usage !== null && (
            <div className="mt-2">
              <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    isAtLimit ? 'bg-red-500' : usage > 70 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${usage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Detailed variant
    return (
      <div className={`bg-surface-secondary rounded-xl overflow-hidden ${className}`}>
        {/* Header */}
        <div className={`px-6 py-4 ${
          tier === SELLER_TIERS.PRO 
            ? 'bg-gradient-to-r from-primary to-primary-hover'
            : tier === SELLER_TIERS.PLUS
            ? 'bg-gradient-to-r from-purple-600 to-purple-700'
            : tier === SELLER_TIERS.BASIC
            ? 'bg-gradient-to-r from-blue-600 to-blue-700'
            : 'bg-surface-tertiary'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{config.name}</h3>
              <p className="text-sm text-white/80">
                {config.priceMonthly > 0 
                  ? formatSubscriptionPrice(config.priceMonthly)
                  : 'Free tier'
                }
              </p>
            </div>
            {tier !== SELLER_TIERS.BUYER && subscription.sellerStatus && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                subscription.sellerStatus === 'active' 
                  ? 'bg-green-500/30 text-white'
                  : subscription.sellerStatus === 'past_due'
                  ? 'bg-red-500/30 text-white'
                  : 'bg-white/20 text-white'
              }`}>
                {subscription.sellerStatus === 'active' 
                  ? subscription.cancelAtPeriodEnd ? 'Canceling' : 'Active'
                  : subscription.sellerStatus.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Listing usage */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Listing usage</span>
              <span className="text-sm font-medium text-text-primary">
                {isUnlimited ? (
                  <span className="text-green-400">Unlimited</span>
                ) : (
                  <>{current} / {limit}</>
                )}
              </span>
            </div>
            {!isUnlimited && usage !== null && (
              <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all rounded-full ${
                    isAtLimit ? 'bg-red-500' : usage > 70 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${usage}%` }}
                />
              </div>
            )}
            {isAtLimit && (
              <p className="text-sm text-red-400 mt-2">
                You&apos;ve reached your listing limit. Upgrade to create more listings.
              </p>
            )}
            {!isUnlimited && remaining <= 2 && remaining > 0 && (
              <p className="text-sm text-amber-400 mt-2">
                Only {remaining} listing slot{remaining > 1 ? 's' : ''} remaining.
              </p>
            )}
          </div>

          {/* Features */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-text-primary mb-3">Plan features</h4>
            <ul className="space-y-2">
              {config.features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Renewal info */}
          {subscription.currentPeriodEnd && tier !== SELLER_TIERS.BUYER && (
            <div className="text-sm text-text-secondary mb-4">
              {subscription.cancelAtPeriodEnd ? (
                <span className="text-amber-400">
                  Access ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              ) : (
                <span>
                  Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {tier === SELLER_TIERS.BUYER || tier === SELLER_TIERS.BASIC ? (
              <Link
                href="/pricing"
                className="btn-primary text-sm px-4 py-2"
              >
                Upgrade Plan
              </Link>
            ) : (
              <Link
                href="/dashboard/billing"
                className="btn-secondary text-sm px-4 py-2"
              >
                Manage Subscription
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Contractor tier display
  const contractorTier = subscription.contractorTier || CONTRACTOR_TIERS.NONE;
  const contractorConfig = CONTRACTOR_TIER_CONFIG[contractorTier];

  if (variant === 'compact') {
    return (
      <div className={`bg-surface-secondary rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{contractorConfig.name}</span>
            {contractorTier === CONTRACTOR_TIERS.VERIFIED && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                Verified
              </span>
            )}
          </div>
          {contractorTier === CONTRACTOR_TIERS.NONE && (
            <Link href="/pricing" className="text-sm text-primary hover:underline">
              Get Verified
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Detailed contractor view
  return (
    <div className={`bg-surface-secondary rounded-xl overflow-hidden ${className}`}>
      <div className={`px-6 py-4 ${
        contractorTier === CONTRACTOR_TIERS.VERIFIED
          ? 'bg-gradient-to-r from-green-600 to-green-700'
          : 'bg-surface-tertiary'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{contractorConfig.name}</h3>
            <p className="text-sm text-white/80">
              {contractorConfig.priceMonthly > 0 
                ? formatSubscriptionPrice(contractorConfig.priceMonthly)
                : 'Free tier'
              }
            </p>
          </div>
          {contractorTier === CONTRACTOR_TIERS.VERIFIED && (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-primary mb-3">Your benefits</h4>
          <ul className="space-y-2">
            {contractorConfig.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          {contractorTier === CONTRACTOR_TIERS.NONE ? (
            <Link
              href="/pricing"
              className="btn-primary text-sm px-4 py-2"
            >
              Get Verified - $24/mo
            </Link>
          ) : (
            <Link
              href="/dashboard/billing"
              className="btn-secondary text-sm px-4 py-2"
            >
              Manage Subscription
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
