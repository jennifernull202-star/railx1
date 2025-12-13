/**
 * THE RAIL EXCHANGE™ — Contractor Verification Tile
 * 
 * Shows verification status and allows purchasing the $100/month Verified Badge.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface VerificationTileProps {
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired' | 'unverified';
  verifiedBadgePurchased?: boolean;
  verifiedBadgeExpiresAt?: string;
  onPurchase?: () => void;
  onManage?: () => void;
  isLoading?: boolean;
  className?: string;
}

const VerificationTile: React.FC<VerificationTileProps> = ({
  verificationStatus,
  verifiedBadgePurchased,
  verifiedBadgeExpiresAt,
  onPurchase,
  onManage,
  isLoading,
  className,
}) => {
  const isVerified = verificationStatus === 'verified' && verifiedBadgePurchased;
  const isPending = verificationStatus === 'pending';
  const isExpired = verificationStatus === 'expired' || (!verifiedBadgePurchased && verificationStatus === 'verified');

  const getStatusInfo = () => {
    if (isVerified) {
      return {
        icon: (
          <svg className="w-8 h-8 text-status-success" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
        title: 'Verified Contractor',
        subtitle: 'Your profile is verified and visible to clients',
        badgeColor: 'bg-status-success',
        badgeText: 'Active',
      };
    }
    if (isPending) {
      return {
        icon: (
          <svg className="w-8 h-8 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        title: 'Verification Pending',
        subtitle: 'Your verification is being reviewed',
        badgeColor: 'bg-status-warning',
        badgeText: 'Pending',
      };
    }
    if (isExpired) {
      return {
        icon: (
          <svg className="w-8 h-8 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        title: 'Verification Expired',
        subtitle: 'Renew your subscription to restore verification',
        badgeColor: 'bg-status-error',
        badgeText: 'Expired',
      };
    }
    return {
      icon: (
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Not Verified',
      subtitle: 'Get verified to boost your visibility',
      badgeColor: 'bg-text-tertiary',
      badgeText: 'Unverified',
    };
  };

  const status = getStatusInfo();

  return (
    <Card className={cn(
      "overflow-hidden",
      isVerified && "border-status-success/30 bg-status-success/5",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
            isVerified ? "bg-status-success/10" : "bg-surface-secondary"
          )}>
            {status.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-navy-900">{status.title}</h3>
              <Badge className={cn("text-white border-0 text-xs", status.badgeColor)}>
                {status.badgeText}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              {status.subtitle}
            </p>

            {/* Benefits */}
            {!isVerified && (
              <div className="mb-4 p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs font-medium text-navy-900 mb-2">Verified Badge Benefits:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-status-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority placement in search results
                  </li>
                  <li className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-status-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified badge on your profile
                  </li>
                  <li className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-status-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Increased trust from potential clients
                  </li>
                  <li className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-status-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    300% more visibility
                  </li>
                </ul>
              </div>
            )}

            {/* Expiration date */}
            {isVerified && verifiedBadgeExpiresAt && (
              <p className="text-xs text-text-tertiary mb-4">
                Renews: {new Date(verifiedBadgeExpiresAt).toLocaleDateString()}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isVerified ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onManage}
                  disabled={isLoading}
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onPurchase}
                  disabled={isLoading || isPending}
                  className="bg-rail-orange hover:bg-rail-orange-dark"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 bg-white/30 rounded-full animate-pulse mr-2" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  Get Verified — $100/month
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { VerificationTile };
