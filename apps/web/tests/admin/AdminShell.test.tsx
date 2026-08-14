import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminShell } from '@/components/admin/AdminShell';
import type { User } from '@/lib/admin/types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

const user: User = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin',
  is_active: true,
};

describe('AdminShell', () => {
  it('renders the full navigation and the current user', () => {
    render(
      <AdminShell user={user}>
        <p>Page content</p>
      </AdminShell>,
    );
    for (const label of ['Dashboard', 'Projects', 'Blog', 'Profile', 'Skills', 'Messages']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('marks the active route with aria-current', () => {
    render(
      <AdminShell user={user}>
        <p>content</p>
      </AdminShell>,
    );
    const active = screen.getByRole('link', { name: 'Dashboard', current: 'page' });
    expect(active).toHaveAttribute('href', '/admin/dashboard');
  });
});
