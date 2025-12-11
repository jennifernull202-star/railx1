/**
 * THE RAIL EXCHANGE™ — Verification Start (Redirect)
 * 
 * Redirects to the first verification step.
 * Each step is now its own page as required by the audit.
 */

import { redirect } from 'next/navigation';

export default function VerificationStartPage() {
  redirect('/dashboard/contractor/verify/identity');
}
