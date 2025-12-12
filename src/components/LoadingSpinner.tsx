/**
 * THE RAIL EXCHANGE™ — Loading Spinner
 * 
 * Animated loading indicator with brand styling.
 * Multiple sizes and variants available.
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'orange';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const variantClasses = {
  default: 'border-slate-200 border-t-navy-900',
  white: 'border-white/30 border-t-white',
  orange: 'border-rail-orange/30 border-t-rail-orange',
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
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
        <LoadingSpinner size="xl" variant="orange" />
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
      <LoadingSpinner size="lg" variant="orange" />
      <p className="mt-4 text-[14px] text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingButton({ className }: { className?: string }) {
  return (
    <LoadingSpinner 
      size="sm" 
      variant="white" 
      className={className} 
    />
  );
}
