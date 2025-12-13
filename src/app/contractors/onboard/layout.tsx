/**
 * Contractor Onboard Layout
 * Wraps onboarding page with auth provider since it requires session
 */

import ClientAuthProvider from '@/components/providers/ClientAuthProvider';

export default function ContractorOnboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}
