/**
 * THE RAIL EXCHANGE™ — Subscription Provider
 * 
 * Provides fresh subscription data from MongoDB (not stale JWT session).
 * Use this context for any subscription-related UI that needs current data.
 */

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';

export interface SubscriptionData {
  sellerTier: string;
  sellerStatus: string | null;
  contractorTier: string;
  contractorStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  activeListingCount: number;
  stripeCustomerId: string | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Computed properties
  isProSeller: boolean;
  hasSellerSubscription: boolean;
  isVerifiedContractor: boolean;
  isTrial: boolean;
}

const SubscriptionContext = React.createContext<SubscriptionContextType | null>(null);

export function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { data: session, status, update } = useSession();
  const [subscription, setSubscription] = React.useState<SubscriptionData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSubscription = React.useCallback(async () => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/subscriptions');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      setSubscription(data);

      // Sync session with database (in case they differ)
      if (session?.user && data.sellerTier !== session.user.subscriptionTier) {
        update({
          subscriptionTier: data.sellerTier !== 'buyer' ? data.sellerTier : undefined,
          isVerifiedContractor: data.contractorTier === 'verified',
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [status, session, update]);

  // Fetch on mount and when session changes
  React.useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Computed properties
  const hasSellerSubscription = subscription?.sellerTier !== 'buyer' && subscription?.sellerTier !== undefined;
  const isProSeller = subscription?.sellerTier === 'pro' || subscription?.sellerTier === 'enterprise';
  const isVerifiedContractor = subscription?.contractorTier === 'verified';
  const isTrial = subscription?.sellerStatus === 'trialing';

  const value = React.useMemo(
    () => ({
      subscription,
      loading,
      error,
      refetch: fetchSubscription,
      isProSeller,
      hasSellerSubscription,
      isVerifiedContractor,
      isTrial,
    }),
    [subscription, loading, error, fetchSubscription, isProSeller, hasSellerSubscription, isVerifiedContractor, isTrial]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export { SubscriptionContext };
