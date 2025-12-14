/**
 * THE RAIL EXCHANGE™ — CTA Upgrade Block
 * 
 * Displays upgrade prompts for entity owners.
 * NO auth. NO enforcement. NO Stripe logic. Pure display.
 */

import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { VISIBILITY_TIER } from '@/types/entity';
import { CTAUpgradeBlockProps } from '../types';

export function CTAUpgradeBlock({ entity, isOwner = false }: CTAUpgradeBlockProps) {
  // Only show for owners
  if (!entity || !isOwner) {
    return null;
  }

  // Don't show if already at highest tier
  if (entity.visibilityTier === VISIBILITY_TIER.PRIORITY) {
    return null;
  }

  // Determine upgrade message based on current tier
  const getUpgradeMessage = () => {
    switch (entity.visibilityTier) {
      case VISIBILITY_TIER.HIDDEN:
        return {
          title: 'Get Listed',
          description: 'Make your profile visible in the directory to receive inquiries.',
          cta: 'Activate Listing',
        };
      case VISIBILITY_TIER.BASIC:
        return {
          title: 'Boost Your Visibility',
          description: 'Featured listings appear higher in search results. Visibility varies by category and market conditions.',
          cta: 'Upgrade to Featured',
        };
      case VISIBILITY_TIER.FEATURED:
        return {
          title: 'Go Priority',
          description: 'Priority placement puts you at the top of every relevant search.',
          cta: 'Upgrade to Priority',
        };
      default:
        return {
          title: 'Upgrade Your Profile',
          description: 'Increase your visibility and reach more customers.',
          cta: 'View Options',
        };
    }
  };

  const message = getUpgradeMessage();

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-purple-200 rounded-lg">
          <Sparkles className="h-5 w-5 text-purple-700" />
        </div>
        <div>
          <h3 className="font-semibold text-purple-900">{message.title}</h3>
          <p className="text-sm text-purple-700 mt-1">{message.description}</p>
        </div>
      </div>

      <Link
        href="/dashboard/upgrade"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
      >
        {message.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default CTAUpgradeBlock;
