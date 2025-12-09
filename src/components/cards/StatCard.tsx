/**
 * THE RAIL EXCHANGE™ — Stat Card Component
 * 
 * Premium statistics card for dashboards and admin panels.
 * Used for KPIs, metrics, and analytics displays.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string | {
    value: number;
    period: string;
  };
  changeDirection?: 'up' | 'down';
  icon?: React.ReactNode;
  iconColor?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-white border-surface-border',
    icon: 'bg-surface-secondary text-navy-900',
    value: 'text-navy-900',
  },
  primary: {
    card: 'bg-navy-900 border-navy-800',
    icon: 'bg-white/10 text-white',
    value: 'text-white',
  },
  success: {
    card: 'bg-status-success/10 border-status-success/20',
    icon: 'bg-status-success/20 text-status-success',
    value: 'text-status-success',
  },
  warning: {
    card: 'bg-status-warning/10 border-status-warning/20',
    icon: 'bg-status-warning/20 text-status-warning',
    value: 'text-status-warning',
  },
  danger: {
    card: 'bg-status-error/10 border-status-error/20',
    icon: 'bg-status-error/20 text-status-error',
    value: 'text-status-error',
  },
};

const iconColorStyles = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeDirection,
  icon,
  iconColor,
  trend,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const styles = variantStyles[variant];
  const iconStyles = iconColor ? iconColorStyles[iconColor] : styles.icon;

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={cn(
      "overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md",
      styles.card,
      className
    )}>
      <CardContent className={cn(
        size === 'sm' && "p-4",
        size === 'md' && "p-5",
        size === 'lg' && "p-6"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className={cn(
              "font-medium",
              size === 'sm' && "text-xs",
              size === 'md' && "text-sm",
              size === 'lg' && "text-sm",
              variant === 'primary' ? "text-white/70" : "text-text-secondary"
            )}>
              {title}
            </p>

            {/* Value */}
            <p className={cn(
              "font-bold mt-1",
              size === 'sm' && "text-xl",
              size === 'md' && "text-2xl",
              size === 'lg' && "text-3xl",
              styles.value
            )}>
              {formatValue(value)}
            </p>

            {/* Subtitle or Change */}
            {change ? (
              <div className="flex items-center gap-1.5 mt-2">
                {typeof change === 'string' ? (
                  <span className={cn(
                    "flex items-center text-xs font-medium",
                    changeDirection === 'up' && "text-status-success",
                    changeDirection === 'down' && "text-status-error",
                    !changeDirection && "text-text-secondary"
                  )}>
                    {changeDirection === 'up' && (
                      <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {changeDirection === 'down' && (
                      <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {change}
                  </span>
                ) : (
                  <>
                    <span className={cn(
                      "flex items-center text-xs font-medium",
                      trend === 'up' && "text-status-success",
                      trend === 'down' && "text-status-error",
                      trend === 'neutral' && "text-text-tertiary"
                    )}>
                      {trend === 'up' && (
                        <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {trend === 'down' && (
                        <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {change.value > 0 ? '+' : ''}{change.value}%
                    </span>
                    <span className={cn(
                      "text-xs",
                      variant === 'primary' ? "text-white/50" : "text-text-tertiary"
                    )}>
                      vs {change.period}
                    </span>
                  </>
                )}
              </div>
            ) : subtitle && (
              <p className={cn(
                "text-xs mt-2",
                variant === 'primary' ? "text-white/50" : "text-text-tertiary"
              )}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div className={cn(
              "rounded-xl flex items-center justify-center flex-shrink-0",
              size === 'sm' && "w-10 h-10",
              size === 'md' && "w-12 h-12",
              size === 'lg' && "w-14 h-14",
              iconStyles
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { StatCard };
