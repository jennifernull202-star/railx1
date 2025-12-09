/**
 * THE RAIL EXCHANGE™ — Contractor Card Component
 * 
 * Premium contractor card for directory and search displays.
 * Shows verification status, services, and regions.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface ContractorCardProps {
  id: string;
  businessName: string;
  businessDescription?: string;
  logo?: string;
  services: string[];
  serviceLabels?: Record<string, string>;
  regionsServed: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedBadgePurchased?: boolean;
  yearsInBusiness?: number;
  location?: {
    city?: string;
    state?: string;
  };
  rating?: number;
  reviewCount?: number;
  onContact?: (id: string) => void;
  className?: string;
}

const ContractorCard: React.FC<ContractorCardProps> = ({
  id,
  businessName,
  businessDescription,
  logo,
  services,
  serviceLabels = {},
  regionsServed,
  verificationStatus,
  verifiedBadgePurchased,
  yearsInBusiness,
  location,
  rating,
  reviewCount,
  onContact,
  className,
}) => {
  const isVerified = verificationStatus === 'verified' && verifiedBadgePurchased;
  const displayedServices = services.slice(0, 3);
  const moreServicesCount = services.length - 3;

  return (
    <Card className={cn(
      "group overflow-hidden rounded-xl border bg-white",
      "hover:shadow-lg transition-all duration-300",
      isVerified ? "border-status-success/30" : "border-surface-border",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-16 h-16 rounded-xl overflow-hidden bg-surface-secondary",
              "flex items-center justify-center",
              isVerified && "ring-2 ring-status-success ring-offset-2"
            )}>
              {logo ? (
                <Image
                  src={logo}
                  alt={businessName}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-text-tertiary">
                  {businessName.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <Link href={`/contractors/${id}`}>
                  <h3 className="text-base font-semibold text-navy-900 hover:text-rail-orange transition-colors line-clamp-1">
                    {businessName}
                  </h3>
                </Link>
                {location && (location.city || location.state) && (
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {[location.city, location.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              {isVerified && (
                <Badge className="bg-status-success text-white border-0 text-xs font-semibold flex-shrink-0">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </Badge>
              )}
            </div>

            {/* Description */}
            {businessDescription && (
              <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                {businessDescription}
              </p>
            )}

            {/* Services */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayedServices.map((service) => (
                <Badge
                  key={service}
                  variant="outline"
                  className="text-xs bg-surface-secondary border-0 text-text-secondary"
                >
                  {serviceLabels[service] || service.replace(/-/g, ' ')}
                </Badge>
              ))}
              {moreServicesCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-surface-secondary border-0 text-text-tertiary"
                >
                  +{moreServicesCount} more
                </Badge>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                {yearsInBusiness && (
                  <span>{yearsInBusiness}+ years</span>
                )}
                {rating !== undefined && reviewCount !== undefined && reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-status-warning" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {rating.toFixed(1)} ({reviewCount})
                  </span>
                )}
                {regionsServed.length > 0 && (
                  <span>{regionsServed.length} region{regionsServed.length > 1 ? 's' : ''}</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Link href={`/contractors/${id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    View Profile
                  </Button>
                </Link>
                {onContact && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-rail-orange hover:bg-rail-orange-dark"
                    onClick={() => onContact(id)}
                  >
                    Contact
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ContractorCard };
