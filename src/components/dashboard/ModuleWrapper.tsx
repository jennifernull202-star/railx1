/**
 * THE RAIL EXCHANGE™ — Dashboard Module Wrapper Component
 * 
 * Wrapper for dashboard content modules with consistent styling.
 * Provides title, description, and optional actions.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ModuleWrapperProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ModuleWrapper: React.FC<ModuleWrapperProps> = ({
  title,
  description,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

export { ModuleWrapper };
