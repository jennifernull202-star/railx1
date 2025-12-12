/**
 * THE RAIL EXCHANGE™ — Recommended Contractors Modal
 * 
 * Displayed after buyer actions:
 * - Saves a listing
 * - Requests information
 * - Downloads a spec sheet
 * 
 * Shows ONLY:
 * - Paid + Verified contractors
 * - Type + Location relevant
 * - Priority/Featured first
 * - Limited to 3-5 contractors
 * 
 * LAZY LOADED. MINIMAL DATA.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CONTRACTOR_TYPE_CONFIG, type ContractorType } from '@/config/contractor-types';

interface ContractorData {
  _id: string;
  businessName: string;
  logo?: string;
  contractorTypes?: string[];
  visibilityTier: 'verified' | 'featured' | 'priority';
  address?: {
    city?: string;
    state?: string;
  };
}

interface RecommendedContractorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentCategory: string;
  listingTitle: string;
  actionType: 'save' | 'inquiry' | 'specsheet';
}

export function RecommendedContractorsModal({
  isOpen,
  onClose,
  equipmentCategory,
  listingTitle,
  actionType,
}: RecommendedContractorsModalProps) {
  const [contractors, setContractors] = useState<ContractorData[]>([]);
  const [loading, setLoading] = useState(true);

  // Lazy load contractors only when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchContractors() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/contractors/relevant?category=${encodeURIComponent(equipmentCategory)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setContractors(data.contractors || []);
        }
      } catch (error) {
        console.error('Failed to fetch recommended contractors:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContractors();
  }, [isOpen, equipmentCategory]);

  if (!isOpen) return null;

  // Get action-specific messaging
  const getActionMessage = () => {
    switch (actionType) {
      case 'save':
        return 'Saved! Need help with this asset?';
      case 'inquiry':
        return 'Inquiry sent! While you wait...';
      case 'specsheet':
        return 'Spec sheet downloaded!';
      default:
        return 'Need help with this asset?';
    }
  };

  // Get tier badge
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'priority':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[10px] font-semibold rounded-full">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Priority
          </span>
        );
      case 'featured':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rail-orange text-white text-[10px] font-semibold rounded-full">
            Featured
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-navy-50 to-navy-100/50 px-6 py-5 border-b border-navy-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy-900">{getActionMessage()}</h3>
              <p className="text-sm text-text-secondary line-clamp-1">{listingTitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="text-sm font-semibold text-navy-900 mb-1">
            Recommended Verified Contractors for This Asset
          </h4>
          <p className="text-xs text-text-secondary mb-4">
            Need inspection, transport, repair, or compliance help?
          </p>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contractor List */}
          {!loading && contractors.length > 0 && (
            <div className="space-y-2">
              {contractors.map((contractor) => {
                const primaryType = contractor.contractorTypes?.[0];
                const typeConfig = primaryType ? CONTRACTOR_TYPE_CONFIG[primaryType as ContractorType] : null;
                
                return (
                  <Link
                    key={contractor._id}
                    href={`/contractors/${contractor._id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-border hover:shadow-md hover:border-rail-orange/30 transition-all group"
                  >
                    {/* Logo */}
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {contractor.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={contractor.logo}
                          alt={contractor.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-text-tertiary">
                          {contractor.businessName.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-navy-900 truncate group-hover:text-rail-orange transition-colors">
                          {contractor.businessName}
                        </span>
                        {getTierBadge(contractor.visibilityTier)}
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        {typeConfig?.shortLabel || typeConfig?.label || 'Rail Contractor'}
                        {contractor.address?.state && ` • ${contractor.address.state}`}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg 
                      className="w-4 h-4 text-text-tertiary group-hover:text-rail-orange group-hover:translate-x-0.5 transition-all flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}

          {/* No Contractors */}
          {!loading && contractors.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary">
                No contractors available in this area yet.
              </p>
              <Link
                href="/contractors"
                onClick={onClose}
                className="text-sm font-medium text-rail-orange hover:text-rail-orange-dark mt-2 inline-block"
              >
                Browse all contractors →
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-surface-border">
          <div className="flex items-center justify-between">
            <Link
              href={`/contractors?service=${equipmentCategory}`}
              onClick={onClose}
              className="text-xs font-medium text-rail-orange hover:text-rail-orange-dark"
            >
              View all contractors →
            </Link>
            <button
              onClick={onClose}
              className="text-xs font-medium text-text-secondary hover:text-navy-900"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendedContractorsModal;
