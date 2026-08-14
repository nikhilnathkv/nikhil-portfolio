import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/LoginForm';
import { getCurrentUser } from '@/lib/admin/server-api';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already authenticated → straight to the dashboard.
  if (await getCurrentUser()) {
    redirect('/admin/dashboard');
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400">Portfolio CMS</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            Sign in to the admin
          </h1>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
