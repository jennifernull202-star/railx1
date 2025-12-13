/**
 * THE RAIL EXCHANGE™ — Client Auth Provider
 * 
 * PERFORMANCE OPTIMIZATION:
 * Scoped SessionProvider for routes that require live session context.
 * Public pages do NOT need this wrapper.
 * 
 * Usage:
 * - Wrap in dashboard/layout.tsx
 * - Wrap in admin/layout.tsx
 * - Do NOT wrap in root layout.tsx
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface ClientAuthProviderProps {
  children: ReactNode;
}

export default function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  return (
    <SessionProvider
      // Reduce unnecessary refetches on public-facing pages
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
