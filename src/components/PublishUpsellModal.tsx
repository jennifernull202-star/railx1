/**
 * THE RAIL EXCHANGE™ — Publish Upsell Modal
 * 
 * Triggered when seller clicks "Publish".
 * Captures revenue at the moment of seller intent.
 * 
 * OFFERS:
 * - Featured Listing ($20 / 30 days)
 * - AI Listing Enhancement ($10)
 * - Spec Sheet PDF ($25)
 * 
 * ACTIONS:
 * - "Add & Publish" - Checkout, then publish with add-ons
 * - "Skip & Publish" - Publish without add-ons
 */

'use client';

import { useState } from 'react';
import { 
  ADD_ON_TYPES, 
  ADD_ON_PRICING, 
  ADD_ON_DURATION,
  ADD_ON_METADATA 
} from '@/config/pricing';

interface PublishUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishWithAddons: (addons: string[]) => Promise<void>;
  onPublishWithoutAddons: () => Promise<void>;
  listingTitle: string;
}

interface AddOnOption {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  description: string;
  icon: string;
  features: string[];
  popular?: boolean;
}

const UPSELL_ADDONS: AddOnOption[] = [
  {
    id: ADD_ON_TYPES.FEATURED,
    name: ADD_ON_METADATA[ADD_ON_TYPES.FEATURED].name,
    price: ADD_ON_PRICING[ADD_ON_TYPES.FEATURED],
    duration: ADD_ON_DURATION[ADD_ON_TYPES.FEATURED],
    description: ADD_ON_METADATA[ADD_ON_TYPES.FEATURED].shortDescription,
    icon: '⭐',
    features: [
      '3x more visibility',
      'Featured badge',
      'Priority in search',
    ],
    popular: true,
  },
  {
    id: ADD_ON_TYPES.AI_ENHANCEMENT,
    name: ADD_ON_METADATA[ADD_ON_TYPES.AI_ENHANCEMENT].name,
    price: ADD_ON_PRICING[ADD_ON_TYPES.AI_ENHANCEMENT],
    duration: ADD_ON_DURATION[ADD_ON_TYPES.AI_ENHANCEMENT],
    description: ADD_ON_METADATA[ADD_ON_TYPES.AI_ENHANCEMENT].shortDescription,
    icon: '🤖',
    features: [
      'AI-optimized title & description',
      'SEO improvements',
      'Better buyer match',
    ],
  },
  {
    id: ADD_ON_TYPES.SPEC_SHEET,
    name: ADD_ON_METADATA[ADD_ON_TYPES.SPEC_SHEET].name,
    price: ADD_ON_PRICING[ADD_ON_TYPES.SPEC_SHEET],
    duration: ADD_ON_DURATION[ADD_ON_TYPES.SPEC_SHEET],
    description: ADD_ON_METADATA[ADD_ON_TYPES.SPEC_SHEET].shortDescription,
    icon: '📄',
    features: [
      'Professional PDF spec sheet',
      'Downloadable by buyers',
      'Increases trust & inquiries',
    ],
  },
];

export function PublishUpsellModal({
  isOpen,
  onClose,
  onPublishWithAddons,
  onPublishWithoutAddons,
  listingTitle,
}: PublishUpsellModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const totalPrice = selectedAddons.reduce((sum, addonId) => {
    const addon = UPSELL_ADDONS.find(a => a.id === addonId);
    return sum + (addon?.price || 0);
  }, 0);

  const handlePublishWithAddons = async () => {
    if (selectedAddons.length === 0) {
      // If nothing selected, just publish
      handleSkipAndPublish();
      return;
    }

    setIsProcessing(true);
    try {
      await onPublishWithAddons(selectedAddons);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipAndPublish = async () => {
    setIsProcessing(true);
    try {
      await onPublishWithoutAddons();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-t-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Ready to Publish!</h2>
                <p className="text-white/70 text-sm mt-1 truncate max-w-md">
                  {listingTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
                disabled={isProcessing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-text-secondary">
                Boost your listing&apos;s visibility and get more inquiries
              </p>
            </div>

            {/* Add-on Options */}
            <div className="space-y-3">
              {UPSELL_ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    disabled={isProcessing}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-rail-orange bg-rail-orange/5'
                        : 'border-surface-border hover:border-rail-orange/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected 
                          ? 'border-rail-orange bg-rail-orange' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Icon */}
                      <div className="text-2xl">{addon.icon}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-navy-900">{addon.name}</h3>
                          {addon.popular && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {addon.description}
                        </p>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {addon.features.map((feature, i) => (
                            <li key={i} className="text-xs text-text-tertiary flex items-center gap-1">
                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-navy-900">
                          ${(addon.price / 100).toFixed(0)}
                        </div>
                        {addon.duration && (
                          <div className="text-xs text-text-tertiary">
                            / {addon.duration} days
                          </div>
                        )}
                        {!addon.duration && (
                          <div className="text-xs text-text-tertiary">
                            one-time
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Total */}
            {selectedAddons.length > 0 && (
              <div className="mt-4 p-4 bg-surface-secondary rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-navy-900">
                    {selectedAddons.length} add-on{selectedAddons.length !== 1 ? 's' : ''} selected
                  </span>
                  <span className="text-xl font-bold text-navy-900">
                    ${(totalPrice / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            {/* Skip & Publish */}
            <button
              onClick={handleSkipAndPublish}
              disabled={isProcessing}
              className="flex-1 py-3 px-6 border border-surface-border rounded-xl font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Publishing...' : 'Skip & Publish'}
            </button>

            {/* Add & Publish */}
            <button
              onClick={handlePublishWithAddons}
              disabled={isProcessing}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                selectedAddons.length > 0
                  ? 'bg-rail-orange text-white hover:bg-rail-orange-dark'
                  : 'bg-navy-900 text-white hover:bg-navy-800'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : selectedAddons.length > 0 ? (
                `Add & Publish • $${(totalPrice / 100).toFixed(2)}`
              ) : (
                'Publish Listing'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublishUpsellModal;
