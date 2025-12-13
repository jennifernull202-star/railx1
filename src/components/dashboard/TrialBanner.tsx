/**
 * THE RAIL EXCHANGE™ — Trial Countdown Banner
 * 
 * S-4.7: Dashboard nag reduction - show once per session, dismissible
 * Displays trial countdown with option to dismiss until next session.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface TrialBannerProps {
  daysRemaining: number;
  userId: string;
}

export default function TrialBanner({ daysRemaining, userId }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden until we check sessionStorage

  useEffect(() => {
    // S-4.7: Check if banner was dismissed in this session
    const dismissedKey = `trial-banner-dismissed-${userId}`;
    const wasDismissed = sessionStorage.getItem(dismissedKey);
    
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, [userId]);

  const handleDismiss = () => {
    // S-4.7: Remember dismissal for this session only
    const dismissedKey = `trial-banner-dismissed-${userId}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  // Don't render if dismissed
  if (dismissed) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative">
      {/* S-4.7: Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Dismiss trial banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold">{daysRemaining}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {daysRemaining === 0 
                ? 'Trial Ends Today!' 
                : daysRemaining === 1 
                  ? '1 Day Left in Your Trial' 
                  : `${daysRemaining} Days Left in Your Trial`}
            </h3>
            <p className="text-white/80 text-sm">
              Enjoy full Seller Pro features. {daysRemaining <= 7 ? 'Subscribe now to keep your benefits!' : 'Your trial is active.'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
