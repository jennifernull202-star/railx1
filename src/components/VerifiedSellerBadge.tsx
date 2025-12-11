/**
 * THE RAIL EXCHANGE™ — Verified Seller Badge Component
 * 
 * Blue shield badge with white checkmark displayed for verified sellers.
 * 
 * MANDATORY DISPLAY LOCATIONS:
 * - Listing cards
 * - Listing detail pages
 * - Seller profile
 * - Contact seller modal
 * - Search results
 * - Messaging thread header
 * 
 * LEGAL DISCLAIMER (MUST be shown with badge):
 * "Verified Seller: Documentation reviewed.
 * Transactions and payments are not guaranteed by The Rail Exchange."
 */

'use client';

import { Shield, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface VerifiedSellerBadgeProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Show full disclaimer instead of tooltip */
  showDisclaimer?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const BADGE_TOOLTIP = `Verified Seller: Documentation reviewed.
Transactions and payments are not guaranteed by The Rail Exchange.`;

const FULL_DISCLAIMER = `Verified Seller indicates identity and business documentation were submitted and reviewed.
The Rail Exchange does not guarantee transactions, payments, item condition, or outcomes.
All transactions occur directly between buyers and sellers.`;

export function VerifiedSellerBadge({
  size = 'sm',
  showTooltip = true,
  showDisclaimer = false,
  className = '',
}: VerifiedSellerBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className="relative flex items-center justify-center"
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        {/* Blue Shield with White Checkmark */}
        <div className="relative">
          <Shield className={`${iconSize} text-blue-600 fill-blue-600`} />
          <CheckCircle2 
            className={`absolute inset-0 m-auto text-white ${
              size === 'xs' ? 'w-2 h-2' : 
              size === 'sm' ? 'w-2.5 h-2.5' : 
              size === 'md' ? 'w-3 h-3' : 'w-3.5 h-3.5'
            }`} 
          />
        </div>

        {/* Tooltip */}
        {showTooltip && tooltipVisible && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
            <div className="bg-navy-900 text-white text-xs rounded-lg py-2 px-3 whitespace-pre-line max-w-xs shadow-lg">
              {BADGE_TOOLTIP}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900" />
            </div>
          </div>
        )}
      </div>

      {/* Full Disclaimer (optional) */}
      {showDisclaimer && (
        <p className="text-xs text-slate-500 mt-1">
          {FULL_DISCLAIMER}
        </p>
      )}
    </div>
  );
}

/**
 * Verified Seller Badge with Label
 * For use in profiles, contact modals, etc.
 */
export function VerifiedSellerBadgeWithLabel({
  size = 'sm',
  showDisclaimer = false,
  className = '',
}: Omit<VerifiedSellerBadgeProps, 'showTooltip'>) {
  const textSize = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="inline-flex items-center gap-1.5">
        <VerifiedSellerBadge size={size} showTooltip={!showDisclaimer} />
        <span className={`font-medium text-blue-600 ${textSize[size]}`}>
          Verified Seller
        </span>
      </div>
      {showDisclaimer && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {FULL_DISCLAIMER}
        </p>
      )}
    </div>
  );
}

/**
 * Compact badge for listing cards and search results
 */
export function VerifiedSellerBadgeCompact({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] font-medium text-blue-600 ${className}`}
      title={BADGE_TOOLTIP}
    >
      <Shield className="w-3 h-3 fill-blue-600" />
      <span>Verified</span>
    </div>
  );
}

/**
 * Full badge block for seller profiles and contact modals
 */
export function VerifiedSellerBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-blue-50 border border-blue-100 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-blue-900">Verified Seller</p>
          <p className="text-xs text-blue-600">Documentation reviewed</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        {FULL_DISCLAIMER}
      </p>
    </div>
  );
}

export default VerifiedSellerBadge;
