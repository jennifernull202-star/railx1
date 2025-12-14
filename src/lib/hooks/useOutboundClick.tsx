/**
 * THE RAIL EXCHANGE™ — Outbound Click Tracking Hook
 * 
 * useOutboundClick - Track clicks on outbound links (phone, email, website)
 * 
 * Usage:
 * const trackClick = useOutboundClick('contractor', contractorId);
 * <a href="tel:..." onClick={() => trackClick('phone')}>Call</a>
 */

'use client';

import { useCallback } from 'react';

type TargetType = 'listing' | 'contractor' | 'seller';
type ClickType = 'phone' | 'email' | 'website' | 'inquiry';

/**
 * Hook for tracking outbound clicks
 * @param targetType - Type of entity ('listing', 'contractor', 'seller')
 * @param targetId - ID of the entity
 * @returns trackClick function
 */
export function useOutboundClick(targetType: TargetType, targetId: string) {
  const trackClick = useCallback(async (clickType: ClickType) => {
    try {
      // Fire and forget - don't block the user
      fetch('/api/analytics/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          clickType,
        }),
      }).catch(() => {
        // Silently fail - analytics should not impact UX
      });
    } catch {
      // Silently fail
    }
  }, [targetType, targetId]);

  return trackClick;
}

/**
 * Wrapper component for outbound links with tracking
 */
interface OutboundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetType: TargetType;
  targetId: string;
  clickType: ClickType;
  children: React.ReactNode;
}

export function OutboundLink({
  targetType,
  targetId,
  clickType,
  children,
  onClick,
  ...props
}: OutboundLinkProps) {
  const trackClick = useOutboundClick(targetType, targetId);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackClick(clickType);
    onClick?.(e);
  };

  return (
    <a onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
