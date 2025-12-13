/**
 * THE RAIL EXCHANGE™ — Verification Start (Redirect)
 * 
 * Redirects to the first verification step.
 * Each step is now its own page as required by the audit.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerificationStartPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/contractor/verify/identity');
  }, [router]);
  
  return null;
}
