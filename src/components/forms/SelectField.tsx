/**
 * THE RAIL EXCHANGE™ — Select Field Component
 * 
 * Premium select dropdown with label, validation, and helper text support.
 * Uses ShadCN UI Select with Rail Exchange design system.
 */

'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectFieldProps {
  label: string;
  placeholder?: string;
  options: SelectOption[] | SelectGroup[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function isGroupedOptions(options: SelectOption[] | SelectGroup[]): options is SelectGroup[] {
  return options.length > 0 && 'options' in options[0];
}

const SelectField = React.forwardRef<HTMLButtonElement, SelectFieldProps>(
  ({ 
    className, 
    label, 
    placeholder = 'Select an option', 
    options, 
    value, 
    onChange,
    error, 
    helperText, 
    required, 
    disabled,
    id,
  }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={selectId}
          className={cn(
            "text-sm font-medium text-navy-900",
            error && "text-status-error"
          )}
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger
            ref={ref}
            id={selectId}
            className={cn(
              "h-11 rounded-lg border-surface-border bg-white px-4 text-navy-900",
              "focus:border-rail-orange focus:ring-2 focus:ring-rail-orange/20",
              "transition-all duration-200",
              error && "border-status-error focus:border-status-error focus:ring-status-error/20",
              className
            )}
            aria-invalid={!!error}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border-surface-border rounded-lg shadow-lg">
            {isGroupedOptions(options) ? (
              options.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-text-tertiary">
                    {group.label}
                  </SelectLabel>
                  {group.options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className="cursor-pointer hover:bg-surface-secondary focus:bg-surface-secondary"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))
            ) : (
              options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="cursor-pointer hover:bg-surface-secondary focus:bg-surface-secondary"
                >
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-status-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

export { SelectField };
