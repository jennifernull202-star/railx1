/**
 * THE RAIL EXCHANGE™ — Billing Dashboard
 * 
 * Manage subscriptions, view billing history, access Stripe portal.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import SubscriptionTierCard from '@/components/SubscriptionTierCard';
import BillingPortalButton from '@/components/BillingPortalButton';

export const metadata: Metadata = {
  title: 'Billing | The Rail Exchange',
  description: 'Manage your subscription and billing settings.',
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/dashboard/billing');
  }

  await connectDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    redirect('/auth/login');
  }

  const hasStripeCustomer = !!user.stripeCustomerId;
  const isSeller = user.role === 'seller';
  const isContractor = user.role === 'contractor';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-xl mb-2">Billing & Subscription</h1>
        <p className="text-body-md text-text-secondary">
          Manage your subscription plan and billing information.
        </p>
      </div>

      {/* Current Subscription */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Current Subscription
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Show seller tier for sellers */}
          {(isSeller || user.sellerTier !== 'buyer') && (
            <SubscriptionTierCard type="seller" />
          )}

          {/* Show contractor tier for contractors */}
          {isContractor && (
            <SubscriptionTierCard type="contractor" />
          )}

          {/* Show both if user has neither role but might want to upgrade */}
          {!isSeller && !isContractor && user.sellerTier === 'buyer' && (
            <div className="bg-surface-secondary rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Buyer Account
              </h3>
              <p className="text-text-secondary mb-4">
                You&apos;re currently on a free buyer account. Upgrade to start selling!
              </p>
              <Link
                href="/dashboard/upgrade"
                className="btn-primary inline-block"
              >
                View Plans
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Billing Management */}
      {hasStripeCustomer && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Billing Management
          </h2>

          <div className="bg-surface-secondary rounded-xl p-6">
            <p className="text-text-secondary mb-4">
              Access your billing portal to:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-6 space-y-1">
              <li>Update payment method</li>
              <li>View billing history</li>
              <li>Download invoices</li>
              <li>Cancel or modify subscription</li>
            </ul>
            <BillingPortalButton />
          </div>
        </section>
      )}

      {/* Upgrade Options */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Upgrade Your Plan
        </h2>

        <div className="bg-surface-secondary rounded-xl p-6">
          <p className="text-text-secondary mb-4">
            Need more listings or better visibility? Explore our plans.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="btn-secondary inline-block"
          >
            View All Plans
          </Link>
        </div>
      </section>

      {/* Help */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Need Help?
        </h2>

        <div className="bg-surface-secondary rounded-xl p-6">
          <p className="text-text-secondary mb-4">
            Have questions about billing or your subscription?
          </p>
          <Link
            href="/contact"
            className="text-primary hover:underline"
          >
            Contact Support →
          </Link>
        </div>
      </section>
    </div>
  );
}
