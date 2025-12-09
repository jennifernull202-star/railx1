/**
 * THE RAIL EXCHANGE™ — Input Field Component
 * 
 * Premium input field with label, validation, and helper text support.
 * Uses ShadCN UI Input with Rail Exchange design system.
 */

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  hint?: string; // Alias for helperText
  required?: boolean;
  icon?: React.ReactNode;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, label, error, helperText, hint, required, icon, id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const helpText = helperText || hint;

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium text-navy-900",
            error && "text-status-error"
          )}
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </Label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 rounded-lg border-surface-border bg-white px-4 text-navy-900",
              "placeholder:text-text-tertiary",
              "focus:border-rail-orange focus:ring-2 focus:ring-rail-orange/20",
              "transition-all duration-200",
              icon && "pl-10",
              error && "border-status-error focus:border-status-error focus:ring-status-error/20",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-status-error">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-text-tertiary">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export { InputField };
