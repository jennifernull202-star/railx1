/**
 * THE RAIL EXCHANGE™ — Admin Monetization Reference
 * 
 * Read-only reference for pricing tiers and add-ons.
 * ADMIN IA GOVERNANCE: Reference only — enforcement handled elsewhere.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  SELLER_TIER_CONFIG, 
  CONTRACTOR_TIER_CONFIG,
  ADD_ON_PRICING,
  ADD_ON_METADATA,
  ADD_ON_DURATION,
  SELLER_TIERS,
  formatPrice 
} from '@/config/pricing';
import { AlertTriangle, BookOpen, Info } from 'lucide-react';

// Helper to format add-on scope/duration
function formatAddOnScope(duration: number | null): string {
  if (duration === null) {
    return 'One-time (permanent)';
  }
  return `Per-listing • ${duration} days`;
}

// Helper to display price for special tiers
function displayTierPrice(config: { priceMonthly: number; isEnterprise?: boolean }): string {
  if (config.isEnterprise) {
    return 'Custom / Contracted';
  }
  if (config.priceMonthly === 0) {
    return 'Free';
  }
  return `${formatPrice(config.priceMonthly)}/mo`;
}

export default async function AdminMonetizationPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null; // STABILIZATION: Never throw
  }

  if (!session?.user || !session.user.isAdmin) {
    return null; // STABILIZATION: No redirect from RSC
  }

  // Filter out 'buyer' from seller subscription tiers (not a subscription)
  const sellerSubscriptionTiers = Object.entries(SELLER_TIER_CONFIG)
    .filter(([tier]) => tier !== SELLER_TIERS.BUYER);

  // Filter out hidden contractor tiers
  const visibleContractorTiers = Object.entries(CONTRACTOR_TIER_CONFIG)
    .filter(([, config]) => !config.isHidden);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-purple-600" />
          <h1 className="text-display-sm font-bold text-navy-900">Monetization Reference</h1>
        </div>
        <p className="text-body-md text-text-secondary">
          Pricing configuration reference from <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/config/pricing.ts</code>
        </p>
      </div>

      {/* Reference Disclaimer */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-body-sm font-semibold text-amber-800">Reference Only</p>
          <p className="text-body-sm text-amber-700">
            These values are read-only. Pricing enforcement is handled by Stripe integration and backend logic. 
            Changes require code deployment.
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Buyer Role Info */}
        <div className="bg-blue-50 rounded-2xl shadow-card border border-blue-200 p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-2 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Role: Buyer
          </h2>
          <p className="text-body-md text-text-secondary">
            <strong>No subscription required.</strong> Buyers can browse listings, contact sellers, 
            and use the platform for free. Seller verification is required only to list equipment for sale.
          </p>
        </div>

        {/* Seller Subscription Tiers */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-2">Seller Subscription Tiers</h2>
          <p className="text-body-sm text-text-secondary mb-4">
            Subscription tiers for verified sellers. All tiers require one-time seller verification.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Tier</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Listing Limit</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Key Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {sellerSubscriptionTiers.map(([tier, config]) => (
                  <tr key={tier} className={config.isEnterprise ? 'bg-amber-50' : ''}>
                    <td className="px-4 py-3 font-medium">
                      {config.name}
                      {config.isEnterprise && (
                        <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                          Contact Sales
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {displayTierPrice(config)}
                    </td>
                    <td className="px-4 py-3">
                      {config.listingLimit === -1 ? 'Unlimited' : config.listingLimit}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {config.features.slice(0, 2).join(', ')}
                      {config.features.length > 2 && '...'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contractor Visibility Tiers */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-2">Contractor Visibility Tiers</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-body-sm text-text-secondary">
              Visibility options for verified contractors.
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
              Free (Launch Phase)
            </span>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
            ⚠️ Pricing subject to change. Contractor tiers are free during launch phase.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Tier</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Listed Price</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Key Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {visibleContractorTiers.map(([tier, config]) => (
                  <tr key={tier}>
                    <td className="px-4 py-3 font-medium">
                      {config.name}
                      {config.badge && (
                        <span className="ml-2 text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded">
                          {config.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {config.priceMonthly === 0 ? (
                        <span className="text-green-700 font-medium">Free</span>
                      ) : (
                        <span className="text-text-secondary line-through">{formatPrice(config.priceMonthly)}/mo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {config.features.slice(0, 3).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add-On Pricing */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-2">Add-On Pricing</h2>
          <p className="text-body-sm text-text-secondary mb-4">
            Per-listing add-ons. Not stackable (only one visibility tier per listing at a time).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Add-On</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Scope</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {Object.entries(ADD_ON_PRICING).map(([type, price]) => {
                  const metadata = ADD_ON_METADATA[type as keyof typeof ADD_ON_METADATA];
                  const duration = ADD_ON_DURATION[type as keyof typeof ADD_ON_DURATION];
                  return (
                    <tr key={type}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{metadata?.icon}</span>
                          <span className="font-medium">{metadata?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatPrice(price as number)}</td>
                      <td className="px-4 py-3 text-body-sm">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {formatAddOnScope(duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-text-secondary">
                        {metadata?.shortDescription}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            Visibility add-ons (Featured, Premium, Elite) are mutually exclusive — only the highest active tier applies.
          </p>
        </div>
      </div>
    </div>
  );
}
