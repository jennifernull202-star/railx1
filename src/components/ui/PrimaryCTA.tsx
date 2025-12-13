'use client';

/**
 * THE RAIL EXCHANGE™ — Primary CTA Component
 * 
 * Sticky primary call-to-action button with disabled state helper
 */

interface PrimaryCTAProps {
  label: string
  disabled?: boolean
  helper?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

export function PrimaryCTA({
  label,
  disabled,
  helper,
  onClick,
  type = 'button',
  className = ''
}: PrimaryCTAProps) {
  return (
    <div className={`w-full ${className}`}>
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`w-full sticky bottom-0 md:top-24 py-3 rounded-lg font-semibold transition-colors ${
          disabled
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-rail-orange text-white hover:bg-rail-orange/90'
        }`}
      >
        {label}
      </button>
      {disabled && helper && (
        <p className="text-xs text-slate-500 mt-1 text-center">{helper}</p>
      )}
    </div>
  )
}
