/**
 * THE RAIL EXCHANGE™ — Admin Settings
 * 
 * Platform configuration and settings.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { 
  SELLER_TIER_CONFIG, 
  CONTRACTOR_TIER_CONFIG,
  ADD_ON_PRICING,
  ADD_ON_METADATA,
  formatPrice 
} from '@/config/pricing';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display-sm font-bold text-navy-900">Settings</h1>
        <p className="text-body-md text-text-secondary mt-1">
          Platform configuration and pricing overview
        </p>
      </div>

      <div className="grid gap-8">
        {/* Seller Tiers */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-4">Seller Subscription Tiers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Tier</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Listing Limit</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {Object.entries(SELLER_TIER_CONFIG).map(([tier, config]) => (
                  <tr key={tier}>
                    <td className="px-4 py-3 font-medium">{config.name}</td>
                    <td className="px-4 py-3">{formatPrice(config.priceMonthly)}/mo</td>
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

        {/* Contractor Tiers */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-4">Contractor Subscription Tiers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Tier</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {Object.entries(CONTRACTOR_TIER_CONFIG).map(([tier, config]) => (
                  <tr key={tier}>
                    <td className="px-4 py-3 font-medium">{config.name}</td>
                    <td className="px-4 py-3">{formatPrice(config.priceMonthly)}/mo</td>
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
          <h2 className="text-heading-md font-bold text-navy-900 mb-4">Add-On Pricing</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Add-On</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {Object.entries(ADD_ON_PRICING).map(([type, price]) => {
                  const metadata = ADD_ON_METADATA[type as keyof typeof ADD_ON_METADATA];
                  return (
                    <tr key={type}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{metadata?.icon}</span>
                          <span className="font-medium">{metadata?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatPrice(price as number)}</td>
                      <td className="px-4 py-3 text-body-sm text-text-secondary">
                        {metadata?.shortDescription}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-4">Environment</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-body-sm text-text-secondary">Stripe Mode</p>
              <p className="font-medium">
                {process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? '🟢 Live' : '🟡 Test'}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Database</p>
              <p className="font-medium">MongoDB Atlas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
