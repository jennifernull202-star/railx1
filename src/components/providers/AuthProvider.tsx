/**
 * THE RAIL EXCHANGE™ — Auth Session Provider
 * 
 * Client-side provider for NextAuth session management.
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
