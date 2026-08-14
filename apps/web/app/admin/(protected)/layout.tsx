import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { getCurrentUser } from '@/lib/admin/server-api';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // Frontend guard is UX only; the API remains the authoritative boundary.
    redirect('/admin/login');
  }
  return <AdminShell user={user}>{children}</AdminShell>;
}
