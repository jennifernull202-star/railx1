/**
 * THE RAIL EXCHANGE™ — Pricing Page
 * 
 * Premium pricing page with monthly/yearly toggle.
 * Displays subscription tiers, contractor plans, and marketplace add-ons.
 */

import { Metadata } from 'next';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing | The Rail Exchange',
  description: 'Simple, transparent pricing for sellers and contractors. Choose monthly or yearly billing with savings up to 17%.',
};

export default function PricingPage() {
  return <PricingContent />;
}
