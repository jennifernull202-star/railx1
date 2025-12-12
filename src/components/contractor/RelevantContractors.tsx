/**
 * THE RAIL EXCHANGE™ — Relevant Contractors Component
 * 
 * Displays relevant contractors based on equipment category.
 * Used on equipment listing pages to drive paid contractor exposure.
 * 
 * BUSINESS RULES:
 * - Only shows PAID + VERIFIED contractors
 * - Contractors are matched by equipment category
 * - Priority contractors shown first, then Featured, then Verified
 * - Limited to 3-5 contractors to maintain value
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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

interface RelevantContractorsProps {
  equipmentCategory: string;
  className?: string;
  maxContractors?: number;
}

export function RelevantContractors({
  equipmentCategory,
  className = '',
  maxContractors = 3,
}: RelevantContractorsProps) {
  const [contractors, setContractors] = useState<ContractorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContractors() {
      try {
        const response = await fetch(
          `/api/contractors/relevant?category=${encodeURIComponent(equipmentCategory)}&limit=${maxContractors}`
        );
        if (response.ok) {
          const data = await response.json();
          setContractors(data.contractors || []);
        }
      } catch (error) {
        console.error('Failed to fetch relevant contractors:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContractors();
  }, [equipmentCategory, maxContractors]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-navy-50 to-navy-100/50 rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-navy-200 rounded w-2/3 mb-4" />
          <div className="space-y-3">
            <div className="h-16 bg-navy-200 rounded" />
            <div className="h-16 bg-navy-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (contractors.length === 0) {
    return null;
  }

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
    <div className={`bg-gradient-to-br from-navy-50 to-navy-100/50 rounded-2xl border border-navy-200/50 p-6 ${className}`}>
      {/* Header - Services CTA as specified */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-rail-orange/10 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Need inspection, transport, repair, or compliance help?</h3>
          <p className="text-xs text-text-secondary">Verified contractors for this equipment</p>
        </div>
      </div>

      {/* Contractor List */}
      <div className="space-y-3">
        {contractors.map((contractor) => {
          // Get primary contractor type label
          const primaryType = contractor.contractorTypes?.[0];
          const typeConfig = primaryType ? CONTRACTOR_TYPE_CONFIG[primaryType as ContractorType] : null;
          
          return (
            <Link
              key={contractor._id}
              href={`/contractors/${contractor._id}`}
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

      {/* View All Link */}
      <Link
        href={`/contractors?service=${equipmentCategory}`}
        className="block text-center text-xs font-medium text-rail-orange hover:text-rail-orange-dark mt-4 pt-3 border-t border-navy-200/50"
      >
        View all contractors →
      </Link>
    </div>
  );
}

export default RelevantContractors;
