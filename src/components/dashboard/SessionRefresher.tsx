/**
 * THE RAIL EXCHANGE™ — Session Refresher Component
 * 
 * Client component that refreshes the NextAuth session when subscription
 * changes occur (detected via URL params or events).
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

interface SessionRefresherInnerProps {
  currentTier?: string;
  isContractor?: boolean;
}

function SessionRefresherInner({ 
  currentTier,
  isContractor 
}: SessionRefresherInnerProps) {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for subscription success callback
    const subscriptionSuccess = searchParams.get('subscription') === 'success';
    const newTier = searchParams.get('tier');
    
    if (subscriptionSuccess && newTier) {
      // Trigger session refresh with new subscription data
      update({
        subscriptionTier: newTier,
      });
      
      // Clean up URL params after handling
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      url.searchParams.delete('tier');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, update]);

  useEffect(() => {
    // Sync session if database tier differs from session tier
    if (session?.user && currentTier) {
      const sessionTier = session.user.subscriptionTier;
      
      if (sessionTier !== currentTier) {
        update({
          subscriptionTier: currentTier,
        });
      }
    }
  }, [session, currentTier, update]);

  useEffect(() => {
    // Sync contractor status
    if (session?.user && isContractor !== undefined) {
      const sessionIsContractor = session.user.isVerifiedContractor;
      
      if (sessionIsContractor !== isContractor) {
        update({
          isVerifiedContractor: isContractor,
        });
      }
    }
  }, [session, isContractor, update]);

  return null;
}

interface SessionRefresherProps {
  /**
   * Current subscription tier from database (passed from server)
   */
  currentTier?: string;
  /**
   * Whether user is currently a contractor (from database)
   */
  isContractor?: boolean;
}

export default function SessionRefresher(props: SessionRefresherProps) {
  return (
    <Suspense fallback={null}>
      <SessionRefresherInner {...props} />
    </Suspense>
  );
}
