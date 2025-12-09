/**
 * THE RAIL EXCHANGE™ — Textarea Field Component
 * 
 * Premium textarea with label, validation, character count, and helper text support.
 * Uses ShadCN UI Textarea with Rail Exchange design system.
 */

'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  hint?: string; // Alias for helperText
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    hint, 
    required, 
    showCharCount,
    maxLength,
    id,
    value,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const charCount = typeof value === 'string' ? value.length : 0;
    const helpText = helperText || hint;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label 
            htmlFor={textareaId}
            className={cn(
              "text-sm font-medium text-navy-900",
              error && "text-status-error"
            )}
          >
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </Label>
          {showCharCount && maxLength && (
            <span className={cn(
              "text-xs",
              charCount > maxLength ? "text-status-error" : "text-text-tertiary"
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <Textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={cn(
            "min-h-[120px] rounded-lg border-surface-border bg-white px-4 py-3 text-navy-900",
            "placeholder:text-text-tertiary",
            "focus:border-rail-orange focus:ring-2 focus:ring-rail-orange/20",
            "transition-all duration-200 resize-y",
            error && "border-status-error focus:border-status-error focus:ring-status-error/20",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helpText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-status-error">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${textareaId}-helper`} className="text-sm text-text-tertiary">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';

export { TextareaField };
