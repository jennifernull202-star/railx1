/**
 * THE RAIL EXCHANGE™ — Promo Code Input Component
 * 
 * A clearly visible, mobile-optimized promo code input that:
 * - Is ALWAYS visible (not collapsible or conditional)
 * - Validates codes in real-time against Stripe
 * - Shows clear success/error feedback
 * - Applies discounts to checkout
 * 
 * GLOBAL UI ENFORCEMENT:
 * - Skeleton loaders (no spinners)
 * - Inline, non-alarmist error feedback
 * 
 * CRITICAL: This component must be rendered for Seller Pro checkout flows.
 */

'use client';

import { useState, useEffect } from 'react';
import { Tag, Check, X, Gift, Sparkles } from 'lucide-react';
import { getErrorMessage } from '@/lib/ui';

interface PromoCodeInputProps {
  /** Callback when a valid promo code is applied */
  onPromoApplied: (code: string, discount: PromoDiscount | null) => void;
  /** The tier being purchased (for validation) */
  targetTier?: string;
  /** Pre-filled promo code from URL */
  initialCode?: string;
  /** Whether the input should be disabled */
  disabled?: boolean;
  /** Custom class for the container */
  className?: string;
}

export interface PromoDiscount {
  code: string;
  percentOff?: number;
  amountOff?: number;
  duration: string;
  durationInMonths?: number;
  appliesTo?: string[];
  valid: boolean;
  message: string;
}

export default function PromoCodeInput({
  onPromoApplied,
  targetTier,
  initialCode = '',
  disabled = false,
  className = '',
}: PromoCodeInputProps) {
  const [code, setCode] = useState(initialCode);
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(!!initialCode);

  // Auto-validate if initial code is provided
  useEffect(() => {
    if (initialCode && !appliedPromo) {
      validatePromoCode(initialCode);
    }
  }, [initialCode]);

  async function validatePromoCode(promoCode: string) {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: promoCode.toUpperCase().trim(),
          tier: targetTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use standardized error messages for common API errors
        if (response.status === 429) {
          throw new Error(getErrorMessage('rate_limited'));
        }
        throw new Error(data.error || 'Invalid promo code');
      }

      if (data.valid) {
        const discount: PromoDiscount = {
          code: promoCode.toUpperCase().trim(),
          percentOff: data.percentOff,
          amountOff: data.amountOff,
          duration: data.duration,
          durationInMonths: data.durationInMonths,
          appliesTo: data.appliesTo,
          valid: true,
          message: data.message || getSuccessMessage(data),
        };
        
        // UX Item #8: Log promo code applied manually (not from URL pre-fill)
        if (promoCode !== initialCode) {
          console.log('[EVENT] promo_code_applied_manually');
        }
        
        setAppliedPromo(discount);
        setError(null);
        onPromoApplied(discount.code, discount);
      } else {
        setError(data.error || 'This promo code is not valid');
        setAppliedPromo(null);
        onPromoApplied('', null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate code';
      setError(message);
      setAppliedPromo(null);
      onPromoApplied('', null);
    } finally {
      setIsValidating(false);
    }
  }

  function getSuccessMessage(data: { percentOff?: number; amountOff?: number; duration?: string; durationInMonths?: number }): string {
    if (data.percentOff === 100) {
      if (data.duration === 'once' || data.durationInMonths === 1) {
        return '🎉 Promo applied: First month FREE!';
      }
      return '🎉 Promo applied: 100% off!';
    }
    if (data.percentOff) {
      return `🎉 Promo applied: ${data.percentOff}% off!`;
    }
    if (data.amountOff) {
      return `🎉 Promo applied: $${(data.amountOff / 100).toFixed(2)} off!`;
    }
    return '🎉 Promo code applied successfully!';
  }

  function handleRemovePromo() {
    // UX Item #8: Log promo code removed
    console.log('[EVENT] promo_code_removed');
    setAppliedPromo(null);
    setCode('');
    setError(null);
    onPromoApplied('', null);
  }

  function handleApply() {
    validatePromoCode(code);
  }

  return (
    <div className={`${className}`}>
      {/* Promo Applied Success State */}
      {appliedPromo ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-800">
                  {appliedPromo.code}
                </span>
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-green-700 font-medium">
                {appliedPromo.message}
              </p>
              {appliedPromo.percentOff === 100 && (
                <div className="mt-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Month 1: <span className="line-through opacity-60">$49</span>{' '}
                    <span className="font-bold text-green-800">$0.00</span>
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleRemovePromo}
              className="p-1.5 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
              title="Remove promo code"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Toggle Button (when input is hidden) */}
          {!showInput ? (
            <button
              onClick={() => {
                // UX Item #8: Log promo code link clicked
                console.log('[EVENT] promo_code_link_clicked');
                setShowInput(true);
                // UX Item #8: Log promo code input expanded
                console.log('[EVENT] promo_code_input_expanded');
              }}
              disabled={disabled}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-rail-orange/50 rounded-xl text-rail-orange hover:bg-rail-orange/5 hover:border-rail-orange transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Tag className="w-5 h-5" />
              <span>Have a promo code?</span>
            </button>
          ) : (
            /* Promo Code Input Field */
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-900 mb-3">
                <Tag className="w-4 h-4 text-rail-orange" />
                Enter Promo Code
              </label>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApply();
                      }
                    }}
                    placeholder="e.g., RAILXFREE"
                    disabled={disabled || isValidating}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-navy-900 font-mono uppercase placeholder:normal-case placeholder:font-sans focus:ring-2 focus:ring-rail-orange/50 focus:border-rail-orange disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                    autoCapitalize="characters"
                  />
                </div>
                
                <button
                  onClick={handleApply}
                  disabled={disabled || isValidating || !code.trim()}
                  className="px-6 py-3 bg-rail-orange text-white rounded-lg font-semibold hover:bg-[#e55f15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {isValidating ? (
                    <>
                      {/* Skeleton pulse loader instead of spinner */}
                      <span className="w-4 h-4 bg-current opacity-30 rounded-full animate-pulse" />
                      <span className="hidden sm:inline">Checking...</span>
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowInput(false);
                  setCode('');
                  setError(null);
                }}
                className="mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
