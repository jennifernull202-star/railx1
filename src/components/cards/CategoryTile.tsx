/**
 * THE RAIL EXCHANGE™ — Category Tile Component
 * 
 * Premium category tile for homepage and navigation.
 * Clean, modern design with icon support.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface CategoryTileProps {
  slug?: string;
  label?: string;
  title?: string; // Alias for label
  name?: string; // Alias for label
  description?: string;
  icon?: React.ReactNode | string; // Support both React elements and emoji strings
  listingCount?: number;
  href?: string;
  color?: 'navy' | 'orange' | 'slate' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorVariants = {
  navy: 'bg-navy-900 text-white hover:bg-navy-800',
  orange: 'bg-rail-orange text-white hover:bg-rail-orange-dark',
  slate: 'bg-slate-700 text-white hover:bg-slate-600',
  default: 'bg-white text-navy-900 hover:bg-surface-secondary border border-surface-border',
};

const sizeVariants = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const iconSizeVariants = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const CategoryTile: React.FC<CategoryTileProps> = ({
  slug,
  label,
  title, // Alias for label
  name, // Alias for label
  description,
  icon,
  listingCount,
  href,
  color = 'default',
  size = 'md',
  className,
}) => {
  const displayLabel = label || title || name || '';
  const linkHref = href || (slug ? `/marketplace/category/${slug}` : '#');

  // Handle icon - can be React element or string (emoji)
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className="text-2xl">{icon}</span>;
    }
    return icon;
  };

  return (
    <Link href={linkHref}>
      <Card className={cn(
        "group overflow-hidden rounded-xl cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        colorVariants[color],
        className
      )}>
        <CardContent className={cn(sizeVariants[size], "flex flex-col items-center text-center")}>
          {/* Icon */}
          {icon && (
            <div className={cn(
              "rounded-xl flex items-center justify-center mb-3",
              iconSizeVariants[size],
              color === 'default' ? 'bg-surface-secondary text-rail-orange' : 'bg-white/20'
            )}>
              {renderIcon()}
            </div>
          )}

          {/* Label */}
          <h3 className={cn(
            "font-semibold transition-colors",
            size === 'sm' && "text-sm",
            size === 'md' && "text-base",
            size === 'lg' && "text-lg",
            color === 'default' && "group-hover:text-rail-orange"
          )}>
            {displayLabel}
          </h3>

          {/* Description */}
          {description && (
            <p className={cn(
              "mt-1 line-clamp-2",
              size === 'sm' && "text-xs",
              size === 'md' && "text-sm",
              size === 'lg' && "text-sm",
              color === 'default' ? "text-text-secondary" : "text-white/80"
            )}>
              {description}
            </p>
          )}

          {/* Listing Count */}
          {listingCount !== undefined && (
            <p className={cn(
              "mt-2",
              size === 'sm' && "text-xs",
              size === 'md' && "text-xs",
              size === 'lg' && "text-sm",
              color === 'default' ? "text-text-tertiary" : "text-white/60"
            )}>
              {listingCount.toLocaleString()} listing{listingCount !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export { CategoryTile };
