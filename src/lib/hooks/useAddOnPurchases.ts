/**
 * THE RAIL EXCHANGE™ — Add-On Purchases Hook
 * 
 * #2 fix: SWR-powered hook for real-time add-on badge refresh.
 * Automatically revalidates on focus, reconnect, and at intervals.
 */

'use client';

import useSWR from 'swr';

interface AddOnPurchase {
  _id: string;
  type: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  listingId?: string;
  listingTitle?: string;
  amount: number;
  startedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface UseAddOnPurchasesResult {
  purchases: AddOnPurchase[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => void;
  unassignedCount: number;
  activeCount: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch add-on purchases');
  }
  const data = await res.json();
  return data.purchases || [];
};

/**
 * Hook to fetch and manage add-on purchases with real-time updates
 * 
 * Features:
 * - Automatic revalidation on window focus
 * - Automatic revalidation on network reconnect
 * - Periodic refresh every 30 seconds
 * - Optimistic UI updates via mutate()
 */
export function useAddOnPurchases(): UseAddOnPurchasesResult {
  const { data, error, isLoading, mutate } = useSWR<AddOnPurchase[]>(
    '/api/addons/purchases',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      errorRetryCount: 3,
    }
  );

  const purchases = data || [];
  
  // Calculate counts
  const unassignedCount = purchases.filter(
    p => p.status === 'active' && !p.listingId && ['featured', 'premium', 'elite'].includes(p.type)
  ).length;
  
  const activeCount = purchases.filter(p => p.status === 'active').length;

  return {
    purchases,
    isLoading,
    isError: !!error,
    error,
    mutate,
    unassignedCount,
    activeCount,
  };
}

/**
 * Hook to check if a specific listing has active add-ons
 */
export function useListingAddOns(listingId: string | undefined) {
  const { purchases, isLoading, isError, mutate } = useAddOnPurchases();
  
  const listingAddOns = listingId 
    ? purchases.filter(p => p.listingId === listingId && p.status === 'active')
    : [];
  
  return {
    addOns: listingAddOns,
    hasFeatured: listingAddOns.some(p => p.type === 'featured'),
    hasPremium: listingAddOns.some(p => p.type === 'premium'),
    hasElite: listingAddOns.some(p => p.type === 'elite'),
    isLoading,
    isError,
    refresh: mutate,
  };
}

export default useAddOnPurchases;
