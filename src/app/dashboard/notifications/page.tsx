/**
 * Dashboard Notifications - Stub page to prevent 404 prefetch crashes
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/inquiries');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>
  );
}
