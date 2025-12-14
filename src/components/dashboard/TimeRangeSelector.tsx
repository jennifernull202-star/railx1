/**
 * THE RAIL EXCHANGE™ — Time Range Selector
 * 
 * Dropdown selector for analytics time ranges (7/30/90 days)
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ Time ranges: 7 days, 30 days, 90 days                                   │
 * │ Persists selection in URL for sharing/bookmarking                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type TimeRange = 7 | 30 | 90;

interface TimeRangeSelectorProps {
  value?: TimeRange;
  onChange?: (value: TimeRange) => void;
  className?: string;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

export function TimeRangeSelector({
  value,
  onChange,
  className = '',
}: TimeRangeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current value from URL or prop
  const currentValue: TimeRange = 
    value || 
    (parseInt(searchParams.get('days') || '30', 10) as TimeRange) || 
    30;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue: TimeRange) => {
    setIsOpen(false);
    
    if (onChange) {
      onChange(newValue);
    } else {
      // Update URL params
      const params = new URLSearchParams(searchParams.toString());
      params.set('days', String(newValue));
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const currentLabel = TIME_RANGES.find(r => r.value === currentValue)?.label || 'Last 30 days';

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span>{currentLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => handleSelect(range.value)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                currentValue === range.value
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimeRangeSelector;
