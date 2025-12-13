/**
 * THE RAIL EXCHANGE™ — Auth Pages Layout
 * 
 * Provides SessionProvider for auth pages that need it
 * (login uses useCaptchaThreshold which stores in sessionStorage, 
 * but signIn from next-auth/react doesn't require SessionProvider)
 */

import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
