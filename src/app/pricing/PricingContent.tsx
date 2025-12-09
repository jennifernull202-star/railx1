'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
import SiteHeader from '@/components/SiteHeader';
import { Check, Zap, Shield, TrendingUp, Crown, Star, Sparkles, FileText } from 'lucide-react';

export default function PricingContent() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

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
    { type: ADD_ON_TYPES.FEATURED, ...ADD_ON_METADATA[ADD_ON_TYPES.FEATURED], price: ADD_ON_PRICING[ADD_ON_TYPES.FEATURED], icon: Star },
    { type: ADD_ON_TYPES.PREMIUM, ...ADD_ON_METADATA[ADD_ON_TYPES.PREMIUM], price: ADD_ON_PRICING[ADD_ON_TYPES.PREMIUM], icon: TrendingUp },
    { type: ADD_ON_TYPES.ELITE, ...ADD_ON_METADATA[ADD_ON_TYPES.ELITE], price: ADD_ON_PRICING[ADD_ON_TYPES.ELITE], icon: Crown },
    { type: ADD_ON_TYPES.AI_ENHANCEMENT, ...ADD_ON_METADATA[ADD_ON_TYPES.AI_ENHANCEMENT], price: ADD_ON_PRICING[ADD_ON_TYPES.AI_ENHANCEMENT], icon: Sparkles },
    { type: ADD_ON_TYPES.SPEC_SHEET, ...ADD_ON_METADATA[ADD_ON_TYPES.SPEC_SHEET], price: ADD_ON_PRICING[ADD_ON_TYPES.SPEC_SHEET], icon: FileText },
  ];

  const getPrice = (tier: { priceMonthly: number; priceYearly?: number }) => {
    if (billingPeriod === 'yearly' && tier.priceYearly) {
      return tier.priceYearly / 12; // Show monthly equivalent
    }
    return tier.priceMonthly;
  };

  const getTotalPrice = (tier: { priceMonthly: number; priceYearly?: number }) => {
    if (billingPeriod === 'yearly' && tier.priceYearly) {
      return tier.priceYearly;
    }
    return tier.priceMonthly;
  };

  const getSavings = (tier: { priceMonthly: number; priceYearly?: number }) => {
    if (!tier.priceYearly || tier.priceMonthly === 0) return 0;
    const yearlyTotal = tier.priceYearly;
    const monthlyTotal = tier.priceMonthly * 12;
    return monthlyTotal - yearlyTotal;
  };

  // Comparison table features
  const comparisonFeatures = [
    { name: 'Active Listings', basic: '3', plus: '10', pro: 'Unlimited' },
    { name: 'Listing Analytics', basic: 'Basic', plus: 'Full', pro: 'Full + Export' },
    { name: 'Search Ranking Boost', basic: '—', plus: '+10%', pro: '+25%' },
    { name: 'Priority Support', basic: '—', plus: '✓', pro: '24/7' },
    { name: 'Bulk Listing Tools', basic: '—', plus: '✓', pro: '✓' },
    { name: 'Featured Seller Badge', basic: '—', plus: '✓', pro: '✓' },
    { name: 'Homepage Rotation', basic: '—', plus: '—', pro: '✓' },
    { name: 'API Access', basic: '—', plus: '—', pro: '✓' },
    { name: 'Dedicated Account Manager', basic: '—', plus: '—', pro: '✓' },
  ];

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/5 via-transparent to-rail-orange/5" />
        <div className="container-rail relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange/10 border border-rail-orange/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-rail-orange" />
              <span className="text-sm font-semibold text-rail-orange">Save up to 17% with yearly billing</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 tracking-tight mb-6">
              Simple, Transparent <span className="text-rail-orange">Pricing</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10">
              Whether you&apos;re an occasional seller or running a business, we have a plan that fits.
              No hidden fees, cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 bg-slate-100 rounded-full">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-navy-900 shadow-md'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-navy-900 shadow-md'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Yearly
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seller Plans */}
      <section className="py-16">
        <div className="container-rail">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Seller Plans</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start selling on The Rail Exchange. All plans include access to our marketplace and buyer inquiries.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {sellerTiers.map((tier) => {
              const monthlyPrice = getPrice(tier);
              const savings = getSavings(tier);
              
              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    tier.isPopular 
                      ? 'ring-2 ring-rail-orange shadow-lg scale-105' 
                      : 'border border-slate-200 shadow-md'
                  }`}
                >
                  {tier.isPopular && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-rail-orange to-orange-500 text-white text-center py-2 text-sm font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-8 ${tier.isPopular ? 'pt-14' : ''}`}>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
                      {tier.description}
                    </p>
                    
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-navy-900">
                        {formatPrice(monthlyPrice)}
                      </span>
                      {monthlyPrice > 0 && (
                        <span className="text-slate-500">/mo</span>
                      )}
                    </div>

                    {billingPeriod === 'yearly' && savings > 0 && (
                      <div className="mb-4 text-sm">
                        <span className="text-green-600 font-medium">
                          Save {formatPrice(savings)}/year
                        </span>
                        <span className="text-slate-500 ml-2">
                          ({formatPrice(getTotalPrice(tier))} billed annually)
                        </span>
                      </div>
                    )}

                    {billingPeriod === 'monthly' && (
                      <div className="mb-4 text-sm text-slate-500 min-h-[20px]">
                        Billed monthly
                      </div>
                    )}

                    <div className="mb-6 pb-6 border-b border-slate-100">
                      <span className="text-sm font-medium text-navy-900">
                        {tier.listingLimit === -1 
                          ? 'Unlimited listings' 
                          : `Up to ${tier.listingLimit} active listings`}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isLoggedIn ? (
                      <PricingCheckoutButton
                        tier={tier.id}
                        type="seller"
                        billingPeriod={billingPeriod}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          tier.isPopular 
                            ? 'bg-rail-orange text-white hover:bg-[#e55f15] shadow-lg shadow-rail-orange/25' 
                            : 'bg-navy-900 text-white hover:bg-navy-800'
                        }`}
                      >
                        Get Started
                      </PricingCheckoutButton>
                    ) : (
                      <Link
                        href="/auth/register"
                        className={`block text-center w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          tier.isPopular 
                            ? 'bg-rail-orange text-white hover:bg-[#e55f15] shadow-lg shadow-rail-orange/25' 
                            : 'bg-navy-900 text-white hover:bg-navy-800'
                        }`}
                      >
                        Get Started
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-left">
                <p className="font-semibold text-navy-900">Need a custom solution?</p>
                <p className="text-sm text-slate-600">Enterprise plans with custom integrations & SLA guarantees</p>
              </div>
              <Link 
                href="/contact" 
                className="px-6 py-2.5 bg-white border border-slate-300 text-navy-900 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-slate-50">
        <div className="container-rail">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Compare Plans</h2>
            <p className="text-lg text-slate-600">See what&apos;s included in each tier</p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-4 px-6 font-semibold text-navy-900">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-navy-900">Basic</th>
                    <th className="text-center py-4 px-4 font-semibold text-rail-orange bg-rail-orange/5">Plus</th>
                    <th className="text-center py-4 px-4 font-semibold text-navy-900">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0">
                      <td className="py-4 px-6 text-slate-600">{feature.name}</td>
                      <td className="text-center py-4 px-4 text-slate-700">{feature.basic}</td>
                      <td className="text-center py-4 px-4 text-slate-700 bg-rail-orange/5 font-medium">{feature.plus}</td>
                      <td className="text-center py-4 px-4 text-slate-700">{feature.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Contractor Plans */}
      <section className="py-16">
        <div className="container-rail">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Contractor Plans</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Showcase your services and build trust with verified credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {contractorTiers.map((tier) => {
              const monthlyPrice = getPrice(tier);
              const savings = getSavings(tier);
              const isVerified = tier.id === CONTRACTOR_TIERS.VERIFIED;
              
              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-xl ${
                    isVerified 
                      ? 'ring-2 ring-green-500 shadow-lg' 
                      : 'border border-slate-200 shadow-md'
                  }`}
                >
                  {isVerified && (
                    <div className="absolute -top-3 left-8">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        <Shield className="w-3.5 h-3.5" />
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className={`p-2 rounded-lg ${isVerified ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <Shield className={`w-6 h-6 ${isVerified ? 'text-green-600' : 'text-slate-600'}`} />
                    </div>
                    <h3 className="text-xl font-bold text-navy-900">
                      {tier.name}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-6">
                    {tier.description}
                  </p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-navy-900">
                      {tier.priceMonthly === 0 ? 'Free' : formatPrice(monthlyPrice)}
                    </span>
                    {tier.priceMonthly > 0 && (
                      <span className="text-slate-500">/mo</span>
                    )}
                  </div>

                  {billingPeriod === 'yearly' && savings > 0 && (
                    <div className="mb-4 text-sm">
                      <span className="text-green-600 font-medium">
                        Save {formatPrice(savings)}/year
                      </span>
                    </div>
                  )}

                  {billingPeriod === 'monthly' && tier.priceMonthly > 0 && (
                    <div className="mb-4 text-sm text-slate-500">
                      Billed monthly
                    </div>
                  )}

                  {tier.priceMonthly === 0 && (
                    <div className="mb-4 text-sm text-slate-500">
                      No credit card required
                    </div>
                  )}

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isVerified ? 'text-green-500' : 'text-slate-400'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isLoggedIn ? (
                    <PricingCheckoutButton
                      tier={tier.id}
                      type="contractor"
                      billingPeriod={billingPeriod}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                        isVerified 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-slate-100 text-navy-900 hover:bg-slate-200'
                      }`}
                    >
                      {tier.priceMonthly === 0 ? 'Get Started Free' : 'Get Verified'}
                    </PricingCheckoutButton>
                  ) : (
                    <Link
                      href={tier.priceMonthly === 0 ? '/contractors/onboard' : '/auth/register'}
                      className={`block text-center w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                        isVerified 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-slate-100 text-navy-900 hover:bg-slate-200'
                      }`}
                    >
                      {tier.priceMonthly === 0 ? 'Get Started Free' : 'Get Verified'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 bg-slate-50">
        <div className="container-rail">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Marketplace Add-ons</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Boost individual listings with premium visibility options. Purchase as needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {addons.map((addon) => {
              const Icon = addon.icon;
              return (
                <div
                  key={addon.type}
                  className="bg-white rounded-xl p-6 shadow-md border border-slate-100 flex flex-col hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-rail-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-rail-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-1">
                    {addon.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 flex-grow">
                    {addon.shortDescription}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-navy-900">
                      {formatPrice(addon.price)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatAddOnDuration(addon.type)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Add-ons can be purchased from your listing dashboard after creating a listing.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container-rail">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Can I change my plan at any time?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the change takes effect at the end of your billing period.'
              },
              {
                q: 'What happens to my listings if I downgrade?',
                a: 'Your existing listings will remain active. However, if you exceed the listing limit of your new plan, you won\'t be able to create new listings until you\'re under the limit.'
              },
              {
                q: 'How long do add-ons last?',
                a: 'Featured, Premium, and Elite add-ons last 30 days. AI Enhancement and Spec Sheet are one-time purchases that permanently enhance your listing.'
              },
              {
                q: 'Is there a free trial?',
                a: 'We don\'t currently offer free trials, but buyers can browse and contact sellers completely free. Contractors can also list their services for free with our basic plan.'
              },
              {
                q: 'What\'s included in yearly billing?',
                a: 'Yearly billing gives you the same features as monthly, but you save the equivalent of 2 months (about 17% savings). You\'re billed once per year.'
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md border border-slate-100">
                <h3 className="font-semibold text-navy-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-slate-600">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-rail">
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
                Join thousands of buyers and sellers on The Rail Exchange marketplace.
              </p>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-rail-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#e55f15] transition-all shadow-lg shadow-rail-orange/25"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 bg-rail-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#e55f15] transition-all shadow-lg shadow-rail-orange/25"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
