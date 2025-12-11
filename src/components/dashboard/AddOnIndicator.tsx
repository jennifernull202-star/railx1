/**
 * THE RAIL EXCHANGE™ — Header Add-On Indicator
 * 
 * Dynamic add-on count indicator for seller dashboard header.
 * Shows real-time count of active add-ons from database.
 * 
 * REQUIREMENTS:
 * - Dynamic count from seller add-on database
 * - Live updates after purchase or expiration
 * - Visible only to sellers
 * - Clickable, routes to /dashboard/addons
 * - Zero hard-coding
 * - Mobile responsive
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';

interface AddOnStats {
  total: number;
  active: number;
  pending: number;
  expiringSoon: number;
}

interface AddOnIndicatorProps {
  className?: string;
  variant?: 'compact' | 'expanded';
}

export default function AddOnIndicator({ 
  className = '', 
  variant = 'compact' 
}: AddOnIndicatorProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AddOnStats>({
    total: 0,
    active: 0,
    pending: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);

  // Check if user is a seller (has seller subscription or active listings)
  const isSeller = session?.user?.subscriptionTier && 
    ['basic', 'plus', 'pro', 'enterprise'].includes(session.user.subscriptionTier);

  // Fetch add-on stats from database
  useEffect(() => {
    async function fetchStats() {
      if (!session?.user || !isSeller) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/addons/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({
            total: data.total || 0,
            active: data.active || 0,
            pending: data.pending || 0,
            expiringSoon: data.expiringSoon || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch add-on stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [session, isSeller]);

  // Don't render if not a seller
  if (!isSeller) {
    return null;
  }

  // Don't render while loading
  if (loading) {
    return null;
  }

  // Compact variant - just icon and count
  if (variant === 'compact') {
    return (
      <Link
        href="/dashboard/addons"
        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors ${className}`}
        title={`${stats.active} active add-ons${stats.expiringSoon > 0 ? `, ${stats.expiringSoon} expiring soon` : ''}`}
      >
        <Package className="w-5 h-5 text-slate-600" />
        {stats.active > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rail-orange rounded-full">
            {stats.active > 99 ? '99+' : stats.active}
          </span>
        )}
        {stats.expiringSoon > 0 && (
          <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
        )}
      </Link>
    );
  }

  // Expanded variant - full info
  return (
    <Link
      href="/dashboard/addons"
      className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-surface-border hover:border-rail-orange/30 hover:shadow-sm transition-all ${className}`}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-rail-orange/10 rounded-lg">
        <Package className="w-5 h-5 text-rail-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-900">Add-Ons</span>
          {stats.active > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-rail-orange rounded-full">
              {stats.active}
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary truncate">
          {stats.active === 0 
            ? 'No active add-ons' 
            : stats.expiringSoon > 0 
              ? `${stats.expiringSoon} expiring soon`
              : `${stats.active} active`
          }
          {stats.pending > 0 && ` • ${stats.pending} pending`}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </Link>
  );
}

export { AddOnIndicator };
