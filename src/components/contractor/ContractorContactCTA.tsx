/**
 * THE RAIL EXCHANGE™ — Contractor Contact CTA Component
 * 
 * S-12.4: Contractor Profile Guest Clarity
 * - Logged-out users: Show create account prompt with clear messaging
 * - Logged-in users: Show direct email contact button
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

interface ContractorContactCTAProps {
  businessName: string;
  businessEmail: string;
  yearsInBusiness?: number;
  regionsCount?: number;
  isVerified?: boolean;
}

export default function ContractorContactCTA({ 
  businessName, 
  businessEmail,
  yearsInBusiness,
  regionsCount,
  isVerified
}: ContractorContactCTAProps) {
  const status = useSessionStatus();
  const pathname = usePathname();
  const callbackUrl = encodeURIComponent(pathname);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border p-4 z-40">
        <div className="container-rail">
          <div className="flex flex-col gap-2">
            <div className="btn-primary w-full py-3 flex items-center justify-center opacity-50">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show guest clarity with signup CTA
  if (status === 'unauthenticated') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border p-4 z-40">
        <div className="container-rail">
          <div className="flex flex-col gap-2">
            {/* S-12.4: Guest clarity info block */}
            <div className="bg-surface-secondary rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-navy-900 text-sm">{businessName}</span>
                {isVerified && (
                  <span className="text-[10px] bg-status-success/10 text-status-success px-1.5 py-0.5 rounded">Verified</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                {yearsInBusiness && (
                  <span>{yearsInBusiness} years in business (self-reported)</span>
                )}
                {regionsCount && regionsCount > 0 && (
                  <span>{regionsCount} regions served</span>
                )}
              </div>
            </div>

            {/* S-12.4: Guest CTA with clear messaging */}
            <Link
              href={`/auth/register?callbackUrl=${callbackUrl}`}
              className="btn-primary w-full py-3 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Create Free Account to Contact
            </Link>
            
            {/* S-12.4: Already have an account link */}
            <Link
              href={`/auth/login?callbackUrl=${callbackUrl}`}
              className="text-center text-sm text-text-secondary hover:text-rail-orange transition-colors"
            >
              Already have an account? Sign in
            </Link>
            
            {/* S-12.4: Subtext explaining why */}
            <p className="text-[10px] text-center text-text-tertiary mt-1">
              Contact details are protected to prevent spam.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: Show full contact CTA
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border p-4 z-40">
      <div className="container-rail">
        <div className="flex flex-col gap-2">
          <a
            href={`mailto:${businessEmail}?subject=Service Inquiry via The Rail Exchange`}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact {businessName}
          </a>
          {/* S-11.4: Contractor Lead Handling Expectation */}
          <p className="text-[10px] text-center text-text-tertiary">
            Contractors manage their own lead follow-up. Availability and response times may vary.
          </p>
          {/* S-7.6: Contractor lead quality expectation */}
          <p className="text-[10px] text-center text-text-tertiary mt-1">
            Contractors expect legitimate service inquiries only.
          </p>
          {/* S-4.8: Clear confirmation of where replies go */}
          <p className="text-xs text-center text-text-tertiary mt-1">
            📧 Replies will arrive in your email inbox
          </p>
        </div>
      </div>
    </div>
  );
}
