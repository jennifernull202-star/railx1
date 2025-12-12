/**
 * THE RAIL EXCHANGE™ — Unsaved Changes Warning Hook
 * 
 * Shows a browser warning when user tries to leave page with unsaved changes.
 * Use this on multi-step forms and editors.
 */

'use client';

import { useEffect, useCallback } from 'react';

interface UseUnsavedChangesOptions {
  hasChanges: boolean;
  message?: string;
}

/**
 * Hook that warns users before leaving a page with unsaved changes.
 * 
 * @param options.hasChanges - Whether there are unsaved changes
 * @param options.message - Custom message (most browsers ignore this and show their own)
 * 
 * @example
 * ```tsx
 * const [formData, setFormData] = useState(initialData);
 * const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
 * 
 * useUnsavedChanges({ hasChanges });
 * ```
 */
export function useUnsavedChanges({
  hasChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesOptions) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but some older ones may use it
        e.returnValue = message;
        return message;
      }
    },
    [hasChanges, message]
  );

  useEffect(() => {
    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [hasChanges, handleBeforeUnload]);
}

export default useUnsavedChanges;
