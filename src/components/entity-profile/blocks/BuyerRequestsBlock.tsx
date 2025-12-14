/**
 * THE RAIL EXCHANGE™ — Buyer Requests Block
 * 
 * Displays active buyer requests/ISO requests from an entity.
 * NO auth. NO enforcement. Pure display.
 * 
 * Empty state: "No active buyer requests at this time"
 */

import Link from 'next/link';
import { FileSearch } from 'lucide-react';
import { Entity } from '@/types/entity';

export interface BuyerRequestsBlockProps {
  entity: Entity | null;
  maxItems?: number;
}

interface BuyerRequest {
  id: string;
  title: string;
  category?: string;
  urgency?: 'standard' | 'urgent' | 'critical';
  createdAt?: string;
}

export function BuyerRequestsBlock({ entity, maxItems = 3 }: BuyerRequestsBlockProps) {
  // Don't render if no entity
  if (!entity) {
    return null;
  }

  // Get buyer requests from entity (future: entity.buyerRequests)
  // For now, always show empty state - NO mock data
  const buyerRequests: BuyerRequest[] = [];
  
  const displayedRequests = buyerRequests.slice(0, maxItems);
  const hasRequests = displayedRequests.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-gray-400" />
          Buyer Requests
        </h2>
        {hasRequests && (
          <span className="text-sm text-gray-500">
            {buyerRequests.length} request{buyerRequests.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {hasRequests ? (
        <>
          {/* Requests List */}
          <div className="space-y-3">
            {displayedRequests.map((request) => (
              <Link
                key={request.id}
                href={`/iso/${request.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-1">{request.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {request.category && <span>{request.category}</span>}
                  {request.urgency && request.urgency !== 'standard' && (
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${request.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' : ''}
                      ${request.urgency === 'critical' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View More Link */}
          {buyerRequests.length > maxItems && (
            <div className="mt-4 text-center">
              <Link
                href={`/iso?buyer=${entity.id}`}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                View all {buyerRequests.length} requests →
              </Link>
            </div>
          )}
        </>
      ) : (
        /* Empty State - Marketplace Pattern */
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-slate-500 leading-relaxed">
            No active buyer requests at this time
          </p>
        </div>
      )}
    </div>
  );
}
