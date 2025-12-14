/**
 * THE RAIL EXCHANGE™ — Analytics Tracking Hook (Expanded)
 * 
 * useAnalyticsEvent - Track analytics events with source attribution
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ This hook tracks:                                                        │
 * │ • Outbound clicks (website, LinkedIn, phone, email)                     │
 * │ • Source attribution (Search, Map, Profile, Listing, Direct)            │
 * │ • Map visibility (impressions, opens)                                   │
 * │ • Page views with referrer tracking                                     │
 * │                                                                          │
 * │ PRIVACY: Fire-and-forget. No blocking. No PII.                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * Usage:
 * const { trackOutboundClick, trackPageView, trackMapEvent } = useAnalyticsEvent('contractor', id);
 * <a href="..." onClick={() => trackOutboundClick('website', 'profile')}>Website</a>
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type TargetType = 'listing' | 'contractor' | 'seller' | 'company';
type ClickType = 'phone' | 'email' | 'website' | 'linkedin' | 'inquiry';
type Source = 'search' | 'map' | 'profile' | 'listing' | 'direct' | 'external';
type EventType = 'outbound_click' | 'page_view' | 'map_impression' | 'map_open' | 'search_impression';

interface TrackEventParams {
  targetType: TargetType;
  targetId: string;
  eventType: EventType;
  clickType?: ClickType;
  source: Source;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect source from URL parameters or referrer
 */
function detectSource(searchParams: URLSearchParams | null, referrer?: string): Source {
  // Check URL parameters first
  const utmSource = searchParams?.get('utm_source');
  const ref = searchParams?.get('ref');
  
  if (utmSource === 'search' || ref === 'search') return 'search';
  if (utmSource === 'map' || ref === 'map') return 'map';
  if (utmSource === 'listing' || ref === 'listing') return 'listing';
  if (utmSource === 'profile' || ref === 'profile') return 'profile';
  
  // Check referrer
  if (referrer) {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.host === host) {
        // Internal navigation - check path
        if (referrerUrl.pathname.includes('/search')) return 'search';
        if (referrerUrl.pathname.includes('/map')) return 'map';
        if (referrerUrl.pathname.includes('/listings/')) return 'listing';
        if (referrerUrl.pathname.includes('/contractors/') || 
            referrerUrl.pathname.includes('/companies/') ||
            referrerUrl.pathname.includes('/sellers/')) return 'profile';
        return 'direct';
      }
      // External referrer
      return 'external';
    } catch {
      return 'direct';
    }
  }
  
  return 'direct';
}

/**
 * Fire-and-forget event tracking
 */
async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).catch(() => {
      // Silently fail - analytics should not impact UX
    });
  } catch {
    // Silently fail
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for comprehensive analytics tracking
 * @param targetType - Type of entity
 * @param targetId - ID of the entity
 * @returns Object with tracking functions
 */
export function useAnalyticsEvent(targetType: TargetType, targetId: string) {
  const searchParams = useSearchParams();
  const pageViewTracked = useRef(false);
  const detectedSource = useRef<Source>('direct');
  
  // Detect source on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      detectedSource.current = detectSource(searchParams, document.referrer);
    }
  }, [searchParams]);
  
  /**
   * Track outbound click (phone, email, website, LinkedIn)
   */
  const trackOutboundClick = useCallback((clickType: ClickType, source?: Source) => {
    trackEvent({
      targetType,
      targetId,
      eventType: 'outbound_click',
      clickType,
      source: source || detectedSource.current,
    });
  }, [targetType, targetId]);
  
  /**
   * Track page view (should be called once per page load)
   */
  const trackPageView = useCallback((source?: Source) => {
    if (pageViewTracked.current) return; // Prevent duplicate tracking
    pageViewTracked.current = true;
    
    trackEvent({
      targetType,
      targetId,
      eventType: 'page_view',
      source: source || detectedSource.current,
    });
  }, [targetType, targetId]);
  
  /**
   * Track map events (impression = shown on map, open = marker clicked)
   */
  const trackMapEvent = useCallback((eventType: 'map_impression' | 'map_open') => {
    trackEvent({
      targetType,
      targetId,
      eventType,
      source: 'map',
    });
  }, [targetType, targetId]);
  
  /**
   * Track search impression (appeared in search results)
   */
  const trackSearchImpression = useCallback(() => {
    trackEvent({
      targetType,
      targetId,
      eventType: 'search_impression',
      source: 'search',
    });
  }, [targetType, targetId]);
  
  return {
    trackOutboundClick,
    trackPageView,
    trackMapEvent,
    trackSearchImpression,
    detectedSource: detectedSource.current,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wrapper component for outbound links with tracking
 */
interface OutboundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetType: TargetType;
  targetId: string;
  clickType: ClickType;
  source?: Source;
  children: React.ReactNode;
}

export function TrackedOutboundLink({
  targetType,
  targetId,
  clickType,
  source,
  children,
  onClick,
  ...props
}: OutboundLinkProps) {
  const { trackOutboundClick } = useAnalyticsEvent(targetType, targetId);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackOutboundClick(clickType, source);
    onClick?.(e);
  };

  return (
    <a onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

/**
 * Component to track page views on mount
 */
interface PageViewTrackerProps {
  targetType: TargetType;
  targetId: string;
}

export function PageViewTracker({ targetType, targetId }: PageViewTrackerProps) {
  const { trackPageView } = useAnalyticsEvent(targetType, targetId);
  
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);
  
  return null;
}

export default useAnalyticsEvent;
