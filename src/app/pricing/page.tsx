/**
 * THE RAIL EXCHANGE™ — Pricing Page
 * 
 * Premium pricing page with monthly/yearly toggle.
 * Displays subscription tiers, contractor plans, and marketplace add-ons.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing | The Rail Exchange',
  description: 'Simple, transparent pricing for sellers and contractors. Choose monthly or yearly billing with savings up to 17%.',
};

// Loading skeleton for pricing page
function PricingLoading() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-secondary rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-surface-secondary rounded w-96 mx-auto mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-surface-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingLoading />}>
      <PricingContent />
    </Suspense>
  );
}
