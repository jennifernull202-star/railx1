/**
 * THE RAIL EXCHANGE™ — Pricing Page
 * 
 * Displays all subscription tiers and add-on options.
 * Allows users to subscribe or upgrade their plans.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import {
  SELLER_TIER_CONFIG,
  CONTRACTOR_TIER_CONFIG,
  ADD_ON_METADATA,
  ADD_ON_PRICING,
  SELLER_TIERS,
  CONTRACTOR_TIERS,
  ADD_ON_TYPES,
  formatPrice,
  formatAddOnDuration,
} from '@/config/pricing';
import PricingCheckoutButton from '@/components/PricingCheckoutButton';

export const metadata: Metadata = {
  title: 'Pricing | The Rail Exchange',
  description: 'Simple, transparent pricing for sellers and contractors. Choose the plan that fits your needs.',
};

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  const sellerTiers = [
    SELLER_TIER_CONFIG[SELLER_TIERS.BASIC],
    SELLER_TIER_CONFIG[SELLER_TIERS.PLUS],
    SELLER_TIER_CONFIG[SELLER_TIERS.PRO],
  ];

  const contractorTiers = [
    CONTRACTOR_TIER_CONFIG[CONTRACTOR_TIERS.FREE],
    CONTRACTOR_TIER_CONFIG[CONTRACTOR_TIERS.VERIFIED],
  ];

  const addons = [
    { type: ADD_ON_TYPES.FEATURED, ...ADD_ON_METADATA[ADD_ON_TYPES.FEATURED], price: ADD_ON_PRICING[ADD_ON_TYPES.FEATURED] },
    { type: ADD_ON_TYPES.PREMIUM, ...ADD_ON_METADATA[ADD_ON_TYPES.PREMIUM], price: ADD_ON_PRICING[ADD_ON_TYPES.PREMIUM] },
    { type: ADD_ON_TYPES.ELITE, ...ADD_ON_METADATA[ADD_ON_TYPES.ELITE], price: ADD_ON_PRICING[ADD_ON_TYPES.ELITE] },
    { type: ADD_ON_TYPES.AI_ENHANCEMENT, ...ADD_ON_METADATA[ADD_ON_TYPES.AI_ENHANCEMENT], price: ADD_ON_PRICING[ADD_ON_TYPES.AI_ENHANCEMENT] },
    { type: ADD_ON_TYPES.SPEC_SHEET, ...ADD_ON_METADATA[ADD_ON_TYPES.SPEC_SHEET], price: ADD_ON_PRICING[ADD_ON_TYPES.SPEC_SHEET] },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="heading-xl mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-body-lg text-text-secondary mb-8">
              Whether you&apos;re an occasional seller or running a business, we have a plan that fits.
              No hidden fees, cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Seller Subscriptions */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Seller Plans</h2>
            <p className="text-body-md text-text-secondary max-w-2xl mx-auto">
              Start selling on The Rail Exchange. All plans include access to our marketplace and basic analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {sellerTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-surface-secondary rounded-2xl overflow-hidden ${
                  tier.isPopular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute top-0 inset-x-0 bg-primary text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${tier.isPopular ? 'pt-12' : ''}`}>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-6">
                    {tier.description}
                  </p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-text-primary">
                      {formatPrice(tier.priceMonthly)}
                    </span>
                    {tier.priceMonthly > 0 && (
                      <span className="text-text-secondary">/mo</span>
                    )}
                  </div>

                  <div className="mb-6 pb-6 border-b border-border">
                    <span className="text-sm text-text-secondary">
                      {tier.listingLimit === -1 
                        ? 'Unlimited listings' 
                        : `Up to ${tier.listingLimit} active listings`}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isLoggedIn ? (
                    <PricingCheckoutButton
                      tier={tier.id}
                      type="seller"
                      className={`w-full ${tier.isPopular ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {tier.priceMonthly === 0 ? 'Current Plan' : 'Get Started'}
                    </PricingCheckoutButton>
                  ) : (
                    <Link
                      href="/auth/register?plan=seller"
                      className={`block text-center w-full py-3 px-4 rounded-lg font-medium ${
                        tier.isPopular 
                          ? 'bg-primary text-white hover:bg-primary-hover' 
                          : 'bg-surface-tertiary text-text-primary hover:bg-surface-tertiary/80'
                      }`}
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <p className="text-text-secondary mb-4">
              Need a custom solution for your business?
            </p>
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Contact us for Enterprise pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Contractor Subscriptions */}
      <section className="py-16 bg-surface-secondary/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Contractor Plans</h2>
            <p className="text-body-md text-text-secondary max-w-2xl mx-auto">
              Showcase your services and build trust with verified credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {contractorTiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-surface-secondary rounded-2xl p-8 ${
                  tier.id === CONTRACTOR_TIERS.VERIFIED ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {tier.name}
                  </h3>
                  {tier.id === CONTRACTOR_TIERS.VERIFIED && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-6">
                  {tier.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary">
                    {formatPrice(tier.priceMonthly)}
                  </span>
                  {tier.priceMonthly > 0 && (
                    <span className="text-text-secondary">/mo</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isLoggedIn ? (
                  <PricingCheckoutButton
                    tier={tier.id}
                    type="contractor"
                    className={`w-full ${tier.id === CONTRACTOR_TIERS.VERIFIED ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {tier.priceMonthly === 0 ? 'Current Plan' : 'Get Verified'}
                  </PricingCheckoutButton>
                ) : (
                  <Link
                    href="/auth/register?plan=contractor"
                    className={`block text-center w-full py-3 px-4 rounded-lg font-medium ${
                      tier.id === CONTRACTOR_TIERS.VERIFIED
                        ? 'bg-primary text-white hover:bg-primary-hover' 
                        : 'bg-surface-tertiary text-text-primary hover:bg-surface-tertiary/80'
                    }`}
                  >
                    {tier.priceMonthly === 0 ? 'Sign Up Free' : 'Get Verified'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Add-ons */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Marketplace Add-ons</h2>
            <p className="text-body-md text-text-secondary max-w-2xl mx-auto">
              Boost individual listings with premium visibility options. Purchase as needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {addons.map((addon) => (
              <div
                key={addon.type}
                className="bg-surface-secondary rounded-xl p-6 flex flex-col"
              >
                <div className="text-3xl mb-3">{addon.icon}</div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {addon.name}
                </h3>
                <p className="text-sm text-text-secondary mb-4 flex-grow">
                  {addon.shortDescription}
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-text-primary">
                    {formatPrice(addon.price)}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">
                  {formatAddOnDuration(addon.type)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-text-secondary">
              Add-ons can be purchased from your listing dashboard after creating a listing.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-surface-secondary/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-surface-secondary rounded-xl p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                Can I change my plan at any time?
              </h3>
              <p className="text-text-secondary">
                Yes! You can upgrade or downgrade your plan at any time. When upgrading, 
                you&apos;ll be charged the prorated difference. When downgrading, the change 
                takes effect at the end of your billing period.
              </p>
            </div>

            <div className="bg-surface-secondary rounded-xl p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                What happens to my listings if I downgrade?
              </h3>
              <p className="text-text-secondary">
                Your existing listings will remain active. However, if you exceed the 
                listing limit of your new plan, you won&apos;t be able to create new listings 
                until you&apos;re under the limit.
              </p>
            </div>

            <div className="bg-surface-secondary rounded-xl p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                How long do add-ons last?
              </h3>
              <p className="text-text-secondary">
                Featured, Premium, and Elite add-ons last 30 days. AI Enhancement and 
                Spec Sheet are one-time purchases that permanently enhance your listing.
              </p>
            </div>

            <div className="bg-surface-secondary rounded-xl p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                Is there a free trial?
              </h3>
              <p className="text-text-secondary">
                We don&apos;t currently offer free trials, but buyers can browse and contact 
                sellers completely free. Sellers need a Basic plan or higher to list equipment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of buyers and sellers on The Rail Exchange marketplace.
            </p>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
