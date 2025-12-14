/**
 * THE RAIL EXCHANGE™ — Admin Settings
 * 
 * Platform configuration only.
 * ADMIN IA GOVERNANCE: Pricing moved to /admin/monetization (reference)
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Settings, Info } from 'lucide-react';

export default async function AdminSettingsPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null; // STABILIZATION: Never throw
  }

  if (!session?.user || !session.user.isAdmin) {
    return null; // STABILIZATION: No redirect from RSC
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display-sm font-bold text-navy-900">Settings</h1>
        <p className="text-body-md text-text-secondary mt-1">
          Platform configuration and environment status
        </p>
      </div>

      <div className="grid gap-8">
        {/* Environment Info */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="text-body-sm text-text-secondary">Stripe Mode</p>
              <p className="font-medium text-lg">
                {process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? '🟢 Live' : '🟡 Test'}
              </p>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="text-body-sm text-text-secondary">Database</p>
              <p className="font-medium text-lg">MongoDB Atlas</p>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="text-body-sm text-text-secondary">Environment</p>
              <p className="font-medium text-lg">
                {process.env.NODE_ENV === 'production' ? '🟢 Production' : '🟡 Development'}
              </p>
            </div>
          </div>
        </div>

        {/* Platform Limits - Placeholder */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-4">Platform Limits</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-body-sm text-blue-800">
                Platform limits and configuration flags are managed via environment variables and code constants.
              </p>
              <p className="text-body-sm text-blue-700 mt-1">
                For pricing reference, see <strong>Admin → Monetization (Reference)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Flags - Placeholder */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="text-heading-md font-bold text-navy-900 mb-4">Feature Configuration</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-text-secondary">
              No configurable feature flags available.
            </p>
            <p className="text-body-sm text-text-tertiary mt-1">
              Feature toggles are managed via deployment configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
