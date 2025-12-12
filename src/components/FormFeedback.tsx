/**
 * THE RAIL EXCHANGE™ — Form Feedback Components
 * 
 * Alert, success, error, and warning message components
 * for form validation and user feedback.
 */

import { cn } from '@/lib/utils';

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const variantStyles = {
  success: {
    container: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-500',
    title: 'text-emerald-800',
    message: 'text-emerald-700',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-700',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    message: 'text-amber-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-700',
  },
};

const icons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

export function Alert({ variant, title, message, className, onDismiss }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-xl border',
        styles.container,
        className
      )}
      role="alert"
    >
      <div className={cn('flex-shrink-0', styles.icon)}>
        {icons[variant]}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('text-[14px] font-semibold mb-0.5', styles.title)}>
            {title}
          </h4>
        )}
        <p className={cn('text-[14px] leading-relaxed', styles.message)}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors', styles.icon)}
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Convenience components
export function SuccessAlert({ title, message, className, onDismiss }: Omit<AlertProps, 'variant'>) {
  return <Alert variant="success" title={title} message={message} className={className} onDismiss={onDismiss} />;
}

export function ErrorAlert({ title, message, className, onDismiss }: Omit<AlertProps, 'variant'>) {
  return <Alert variant="error" title={title} message={message} className={className} onDismiss={onDismiss} />;
}

export function WarningAlert({ title, message, className, onDismiss }: Omit<AlertProps, 'variant'>) {
  return <Alert variant="warning" title={title} message={message} className={className} onDismiss={onDismiss} />;
}

export function InfoAlert({ title, message, className, onDismiss }: Omit<AlertProps, 'variant'>) {
  return <Alert variant="info" title={title} message={message} className={className} onDismiss={onDismiss} />;
}

// Inline field error
interface FieldErrorProps {
  message: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  return (
    <p className={cn('flex items-center gap-1.5 mt-1.5 text-[13px] text-red-600', className)}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

// Field success hint
interface FieldSuccessProps {
  message: string;
  className?: string;
}

export function FieldSuccess({ message, className }: FieldSuccessProps) {
  return (
    <p className={cn('flex items-center gap-1.5 mt-1.5 text-[13px] text-emerald-600', className)}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}
