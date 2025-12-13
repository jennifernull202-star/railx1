/**
 * THE RAIL EXCHANGE™ — Verification Renewal Banner
 * 
 * Dashboard banner that prompts sellers to renew their verification
 * when it's expiring within 60 days. Displays prominently on all
 * seller dashboard pages.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AlertTriangle, X, Clock, Shield, ChevronRight } from 'lucide-react';

interface UserVerificationData {
  verifiedSeller: boolean;
  verifiedSellerExpiresAt?: string;
  sellerVerificationExpiresAt?: string;
  sellerVerificationStatus?: string;
}

interface VerificationRenewalBannerProps {
  /** Number of days before expiration to show warning (default: 60) */
  warningThreshold?: number;
  /** Allow user to dismiss the banner */
  dismissible?: boolean;
  /** Compact mode for sidebar placement */
  compact?: boolean;
}

export default function VerificationRenewalBanner({
  warningThreshold = 60,
  dismissible = true,
  compact = false,
}: VerificationRenewalBannerProps) {
  // CASCADE KILL: Component disabled for stabilization
  return null;
  
  /*
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserVerificationData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data.success && data.user) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      const dismissedKey = `verification-renewal-dismissed-${session.user.id}`;
      const wasDismissed = sessionStorage.getItem(dismissedKey);
      if (wasDismissed) {
        setDismissed(true);
        setLoading(false);
        return;
      }
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id]);
  */

  const handleDismiss = () => {
    if (session?.user?.id) {
      sessionStorage.setItem(`verification-renewal-dismissed-${session.user.id}`, 'true');
    }
    setDismissed(true);
  };

  // Don't render if loading, dismissed, or no user data
  if (loading || dismissed || !userData) return null;

  // Only show for verified sellers
  if (!userData.verifiedSeller) return null;

  // Calculate days until expiration
  const expiresAt = userData.verifiedSellerExpiresAt || userData.sellerVerificationExpiresAt;
  if (!expiresAt) return null;

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiration = Math.floor(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only show if expiring within threshold
  if (daysUntilExpiration > warningThreshold || daysUntilExpiration < 0) return null;

  // Determine urgency level
  const isUrgent = daysUntilExpiration <= 14;
  const isWarning = daysUntilExpiration <= 30;

  // Format expiration date
  const formattedDate = expirationDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (compact) {
    return (
      <Link
        href="/dashboard/verification/renew"
        className={`block p-3 rounded-lg border transition-colors ${
          isUrgent
            ? 'bg-status-error/10 border-status-error/20 hover:bg-status-error/20'
            : isWarning
            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 flex-shrink-0 ${
            isUrgent ? 'text-status-error' : isWarning ? 'text-amber-600' : 'text-blue-600'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              isUrgent ? 'text-status-error' : isWarning ? 'text-amber-800' : 'text-blue-800'
            }`}>
              {daysUntilExpiration <= 0 ? 'Verification expired' :
               daysUntilExpiration === 1 ? 'Expires tomorrow' :
               `Expires in ${daysUntilExpiration} days`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        </div>
      </Link>
    );
  }

  return (
    <div className={`rounded-xl border p-4 mb-6 ${
      isUrgent
        ? 'bg-status-error/5 border-status-error/20'
        : isWarning
        ? 'bg-amber-50 border-amber-200'
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isUrgent ? 'bg-status-error/10' : isWarning ? 'bg-amber-100' : 'bg-blue-100'
        }`}>
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 text-status-error" />
          ) : (
            <Clock className={`w-5 h-5 ${isWarning ? 'text-amber-600' : 'text-blue-600'}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${
            isUrgent ? 'text-status-error' : isWarning ? 'text-amber-800' : 'text-blue-800'
          }`}>
            {isUrgent
              ? daysUntilExpiration <= 0
                ? 'Your Seller Verification Has Expired'
                : 'Your Seller Verification Expires Soon!'
              : 'Seller Verification Renewal Reminder'}
          </h3>
          <p className={`text-sm mt-1 ${
            isUrgent ? 'text-status-error/80' : isWarning ? 'text-amber-700' : 'text-blue-700'
          }`}>
            {daysUntilExpiration <= 0 ? (
              'Your verification has expired. Renew now to maintain your verified seller badge and keep your listings visible to buyers.'
            ) : (
              <>
                Your verification expires on <strong>{formattedDate}</strong> ({daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''} remaining).
                Renew early to avoid any interruption to your listings.
              </>
            )}
          </p>

          {/* Benefits reminder */}
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              Verified badge
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              Higher search ranking
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              Buyer trust boost
            </span>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-4">
            <Link
              href="/dashboard/verification/renew"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isUrgent
                  ? 'bg-status-error text-white hover:bg-status-error/90'
                  : 'bg-rail-orange text-white hover:bg-rail-orange/90'
              }`}
            >
              Renew Verification
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works#verification"
              className="text-sm text-text-secondary hover:text-navy-900 transition-colors"
            >
              Learn more
            </Link>
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
