/**
 * THE RAIL EXCHANGE™ — Subscription Status Card
 * 
 * Displays subscription/verification status with expiration info.
 * Shows: Status | Renewal Date | CTA
 * 
 * Used in dashboard to give users visibility into their subscription state.
 */

'use client';

import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  CreditCard,
} from 'lucide-react';

interface SubscriptionStatusCardProps {
  /** Type of subscription/verification */
  type: 'seller' | 'contractor' | 'professional';
  /** Current status */
  status: 'active' | 'expiring' | 'expired' | 'pending' | 'none';
  /** Expiration date (ISO string) */
  expiresAt?: string | null;
  /** Link to manage/renew */
  manageLink: string;
  /** Tier name (e.g., "Standard", "Priority", "Professional") */
  tierName?: string;
}

export default function SubscriptionStatusCard({
  type,
  status,
  expiresAt,
  manageLink,
  tierName,
}: SubscriptionStatusCardProps) {
  // Calculate days remaining
  const getDaysRemaining = (): number | null => {
    if (!expiresAt) return null;
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();
  
  // Determine if expiring soon (within 30 days)
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = status === 'expired' || (daysRemaining !== null && daysRemaining <= 0);
  const actualStatus = isExpired ? 'expired' : isExpiringSoon ? 'expiring' : status;

  // Status configuration
  const statusConfig = {
    active: {
      icon: CheckCircle2,
      label: 'Active',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    expiring: {
      icon: AlertTriangle,
      label: 'Expiring Soon',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    expired: {
      icon: AlertTriangle,
      label: 'Expired',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    pending: {
      icon: Clock,
      label: 'Pending Review',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    none: {
      icon: Shield,
      label: 'Not Verified',
      color: 'text-slate-500',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
  };

  const typeLabels = {
    seller: 'Seller Verification',
    contractor: 'Contractor Verification',
    professional: 'Professional Plan',
  };

  const config = statusConfig[actualStatus];
  const Icon = config.icon;

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get CTA text
  const getCTAText = (): string => {
    if (actualStatus === 'expired') return 'Renew Now';
    if (actualStatus === 'expiring') return 'Renew';
    if (actualStatus === 'none') return 'Get Verified';
    if (actualStatus === 'pending') return 'View Status';
    return 'Manage';
  };

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <span className="font-semibold text-navy-900">{typeLabels[type]}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {tierName && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Tier: <span className="font-medium text-navy-900">{tierName}</span></span>
          </div>
        )}
        
        {expiresAt && actualStatus !== 'none' && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {actualStatus === 'expired' ? 'Expired: ' : 'Renews: '}
              <span className={`font-medium ${actualStatus === 'expired' ? 'text-red-600' : 'text-navy-900'}`}>
                {formatDate(expiresAt)}
              </span>
            </span>
          </div>
        )}
        
        {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 60 && (
          <div className={`text-sm font-medium ${
            daysRemaining <= 7 ? 'text-red-600' :
            daysRemaining <= 30 ? 'text-amber-600' :
            'text-slate-600'
          }`}>
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={manageLink}
        className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          actualStatus === 'expired'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : actualStatus === 'expiring'
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : actualStatus === 'none'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        {actualStatus === 'expired' || actualStatus === 'expiring' ? (
          <RefreshCw className="w-4 h-4" />
        ) : actualStatus === 'none' ? (
          <CreditCard className="w-4 h-4" />
        ) : (
          <Shield className="w-4 h-4" />
        )}
        {getCTAText()}
      </Link>
    </div>
  );
}
