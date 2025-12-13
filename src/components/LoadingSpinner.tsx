/**
 * THE RAIL EXCHANGE™ — Loading Components
 * 
 * GLOBAL UI ENFORCEMENT: Skeleton loaders only, no spinners.
 * All loading states use pulse/skeleton animations.
 */

import { cn } from '@/lib/utils';
import { SKELETON_CLASSES } from '@/lib/ui';

interface LoadingSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'orange';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses = {
  default: 'bg-slate-200',
  white: 'bg-white/50',
  orange: 'bg-rail-orange/30',
};

/**
 * LoadingSpinner - Now renders a pulsing skeleton circle (not a spinner)
 * Maintained for API compatibility across the codebase
 */
export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        SKELETON_CLASSES.pulse,
        'rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Skeleton pulse dots instead of spinner */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-[15px] font-medium text-navy-900">{message}</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  message?: string;
}

export function LoadingCard({ message = 'Loading...' }: LoadingCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {/* Skeleton pulse dots instead of spinner */}
      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="mt-4 text-[14px] text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingButton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'w-4 h-4 rounded-full bg-current opacity-50 animate-pulse',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
