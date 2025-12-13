/**
 * THE RAIL EXCHANGE™ — Phone Display Component
 * 
 * S-3.2: Ruled & Consistent Phone Visibility
 * - Logged-out users: Phone hidden with sign-in prompt
 * - Logged-in users: Phone visible (if seller has enabled phone contact)
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * PERFORMANCE OPTIMIZATION:
 * Check session status via API instead of requiring SessionProvider.
 */
function useSessionStatus() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => setStatus(data?.user ? 'authenticated' : 'unauthenticated'))
      .catch(() => setStatus('unauthenticated'));
  }, []);
  
  return status;
}

interface PhoneDisplayProps {
  phone: string;
  className?: string;
}

export default function PhoneDisplay({ phone, className = '' }: PhoneDisplayProps) {
  const status = useSessionStatus();
  const pathname = usePathname();
  const callbackUrl = encodeURIComponent(pathname);

  // Loading state
  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="text-text-tertiary animate-pulse">Loading...</span>
      </div>
    );
  }

  // Unauthenticated: Show prompt
  if (status === 'unauthenticated') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <Link 
          href={`/auth/login?callbackUrl=${callbackUrl}`}
          className="text-text-secondary hover:text-rail-orange text-sm transition-colors"
        >
          Phone number visible after sign-in
        </Link>
      </div>
    );
  }

  // Authenticated: Show phone number
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span className="text-navy-900">{phone}</span>
    </div>
  );
}
