/**
 * Contractor Register Layout
 * Wraps registration page with auth provider since it requires session
 */

import ClientAuthProvider from '@/components/providers/ClientAuthProvider';

export default function ContractorRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}
