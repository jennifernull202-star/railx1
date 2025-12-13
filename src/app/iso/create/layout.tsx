/**
 * ISO Create Layout
 * Wraps create page with auth provider since it requires session
 */

import ClientAuthProvider from '@/components/providers/ClientAuthProvider';

export default function ISOCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}
