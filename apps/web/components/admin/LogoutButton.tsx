'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={className}
      aria-label="Log out"
    >
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  );
}
