/**
 * THE RAIL EXCHANGE™ — Add-On Status Component
 * 
 * Displays active add-ons with duration timers and pricing.
 * Used in listing detail, dashboard, and management screens.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ADD_ON_TYPES,
  ADD_ON_METADATA,
  formatAddOnPrice,
  formatAddOnDuration,
  getRemainingTime,
  formatRemainingTime,
  type AddOnType,
} from '@/config/addons';

interface AddOnStatus {
  type: AddOnType;
  active: boolean;
  expiresAt?: string | Date | null;
  purchasedAt?: string | Date;
}

interface AddOnStatusDisplayProps {
  addOns: AddOnStatus[];
  variant?: 'compact' | 'detailed' | 'card';
  showPricing?: boolean;
  onPurchase?: (type: AddOnType) => void;
}

/**
 * Timer hook for countdown display
 */
function useCountdown(expiresAt: Date | null) {
  const [remaining, setRemaining] = useState(() => getRemainingTime(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      setRemaining(getRemainingTime(expiresAt));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining;
}

/**
 * Single add-on badge with timer
 */
function AddOnBadge({ addOn }: { addOn: AddOnStatus }) {
  const expiresAt = addOn.expiresAt ? new Date(addOn.expiresAt) : null;
  const remaining = useCountdown(expiresAt);
  const metadata = ADD_ON_METADATA[addOn.type];

  if (!addOn.active) return null;

  // Determine badge style based on type
  // Elite is the ONLY placement tier (no Premium/Featured)
  const getBadgeStyle = () => {
    switch (addOn.type) {
      case ADD_ON_TYPES.ELITE:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      case ADD_ON_TYPES.AI_ENHANCEMENT:
        return 'bg-blue-600 text-white';
      case ADD_ON_TYPES.VERIFIED_BADGE:
        return 'bg-green-600 text-white';
      case ADD_ON_TYPES.SPEC_SHEET:
        return 'bg-slate-700 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const isExpiringSoon = remaining && !remaining.expired && remaining.days <= 3;

  return (
    <div className="inline-flex flex-col items-start">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeStyle()}`}>
        <span>{metadata?.icon}</span>
        {metadata?.badge || addOn.type}
      </span>
      {remaining && !remaining.expired && (
        <span className={`text-[10px] mt-0.5 ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          {formatRemainingTime(expiresAt)}
        </span>
      )}
      {remaining?.expired && (
        <span className="text-[10px] mt-0.5 text-red-600 font-medium">Expired</span>
      )}
    </div>
  );
}

/**
 * Add-on purchase card
 */
function AddOnCard({
  type,
  isActive = false,
  expiresAt,
  onPurchase,
}: {
  type: AddOnType;
  isActive?: boolean;
  expiresAt?: string | Date | null;
  onPurchase?: () => void;
}) {
  const metadata = ADD_ON_METADATA[type];
  const price = formatAddOnPrice(type);
  const duration = formatAddOnDuration(type);
  const expiresDate = expiresAt ? new Date(expiresAt) : null;
  const remaining = useCountdown(expiresDate);

  // Get card accent color
  // Elite is the ONLY placement tier (no Premium/Featured)
  const getAccentColor = () => {
    switch (type) {
      case ADD_ON_TYPES.ELITE:
        return 'border-l-amber-500';
      case ADD_ON_TYPES.AI_ENHANCEMENT:
        return 'border-l-blue-600';
      case ADD_ON_TYPES.VERIFIED_BADGE:
        return 'border-l-green-600';
      case ADD_ON_TYPES.SPEC_SHEET:
        return 'border-l-slate-700';
      default:
        return 'border-l-gray-400';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${getAccentColor()} p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{metadata?.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{metadata?.name}</h4>
            <p className="text-xs text-gray-500">{metadata?.shortDescription}</p>
          </div>
        </div>
        {isActive && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
            Active
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Price</span>
          <span className="font-semibold text-gray-900">{price}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Duration</span>
          <span className="text-gray-900">{duration}</span>
        </div>
        {isActive && remaining && !remaining.expired && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className={`font-medium ${remaining.days <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatRemainingTime(expiresDate)}
            </span>
          </div>
        )}
      </div>

      {/* Features list */}
      <ul className="space-y-1.5 mb-4">
        {metadata?.features.slice(0, 3).map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
            <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {!isActive && onPurchase && (
        <button
          onClick={onPurchase}
          className="w-full py-2 px-4 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
        >
          Purchase {price}
        </button>
      )}

      {isActive && remaining?.expired && onPurchase && (
        <button
          onClick={onPurchase}
          className="w-full py-2 px-4 bg-rail-orange text-white text-sm font-medium rounded-lg hover:bg-rail-orange/90 transition-colors"
        >
          Renew {price}
        </button>
      )}
    </div>
  );
}

/**
 * Main component to display add-on status
 */
export function AddOnStatusDisplay({
  addOns,
  variant = 'compact',
  showPricing = false,
  onPurchase,
}: AddOnStatusDisplayProps) {
  const activeAddOns = addOns.filter((a) => a.active);

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {activeAddOns.map((addOn) => (
          <AddOnBadge key={addOn.type} addOn={addOn} />
        ))}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-3">
        {activeAddOns.length > 0 ? (
          activeAddOns.map((addOn) => {
            const metadata = ADD_ON_METADATA[addOn.type];
            const expiresAt = addOn.expiresAt ? new Date(addOn.expiresAt) : null;
            const remaining = getRemainingTime(expiresAt);

            return (
              <div
                key={addOn.type}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{metadata?.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{metadata?.name}</p>
                    {remaining && !remaining.expired ? (
                      <p className={`text-xs ${remaining.days <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatRemainingTime(expiresAt)}
                      </p>
                    ) : remaining?.expired ? (
                      <p className="text-xs text-red-600">Expired</p>
                    ) : (
                      <p className="text-xs text-green-600">Permanent</p>
                    )}
                  </div>
                </div>
                {showPricing && (
                  <span className="text-sm font-semibold text-gray-900">
                    {formatAddOnPrice(addOn.type)}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No active add-ons</p>
        )}
      </div>
    );
  }

  // Card variant - show all available add-ons
  if (variant === 'card') {
    const allAddOns = Object.values(ADD_ON_TYPES) as AddOnType[];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allAddOns
          .map((type) => {
            const existingAddOn = addOns.find((a) => a.type === type);
            return (
              <AddOnCard
                key={type}
                type={type}
                isActive={existingAddOn?.active || false}
                expiresAt={existingAddOn?.expiresAt}
                onPurchase={onPurchase ? () => onPurchase(type) : undefined}
              />
            );
          })}
      </div>
    );
  }

  return null;
}

/**
 * Simple badge component for inline use
 */
export function AddOnBadgeSimple({ type, size = 'sm' }: { type: AddOnType; size?: 'xs' | 'sm' | 'md' }) {
  const metadata = ADD_ON_METADATA[type];

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  // Elite is the ONLY placement tier (no Premium/Featured)
  const getBadgeStyle = () => {
    switch (type) {
      case ADD_ON_TYPES.ELITE:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      case ADD_ON_TYPES.AI_ENHANCEMENT:
        return 'bg-blue-600 text-white';
      case ADD_ON_TYPES.SPEC_SHEET:
        return 'bg-slate-700 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]} ${getBadgeStyle()}`}>
      {metadata?.badge || type}
    </span>
  );
}

export default AddOnStatusDisplay;
