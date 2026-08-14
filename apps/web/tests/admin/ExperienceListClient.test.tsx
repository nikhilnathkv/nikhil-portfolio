import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperienceListClient } from '@/components/admin/experience/ExperienceListClient';
import type { Experience } from '@/lib/admin/experience-types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/experience',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const items: Experience[] = [
  {
    id: 'a',
    company: 'Novigo',
    role: 'AI/ML Engineer',
    location: null,
    start_date: '2026-01-01',
    end_date: null,
    is_current: true,
    summary: null,
    description: null,
    display_order: 0,
    projects: [],
    created_at: '2026-08-14T00:00:00Z',
    updated_at: '2026-08-14T00:00:00Z',
  },
  {
    id: 'b',
    company: 'EY',
    role: 'Senior Associate',
    location: null,
    start_date: '2022-01-01',
    end_date: '2025-12-31',
    is_current: false,
    summary: null,
    description: null,
    display_order: 1,
    projects: [],
    created_at: '2026-08-14T00:00:00Z',
    updated_at: '2026-08-14T00:00:00Z',
  },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'DELETE') return { ok: true, status: 204, json: async () => ({}) };
    if (method === 'PUT') return { ok: true, status: 200, json: async () => ({ data: items[0] }) };
    return { ok: true, status: 200, json: async () => ({ data: items }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('ExperienceListClient', () => {
  it('renders rows with a formatted period and current badge', async () => {
    render(<ExperienceListClient />);
    expect(await screen.findByText('Novigo')).toBeInTheDocument();
    expect(screen.getByText('2026–Now')).toBeInTheDocument();
    expect(screen.getByText('2022–2025')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('deletes an entry after confirmation', async () => {
    const user = userEvent.setup();
    render(<ExperienceListClient />);
    await screen.findByText('Novigo');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/experience/a',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('reorders via the move buttons (PUT display_order)', async () => {
    const user = userEvent.setup();
    render(<ExperienceListClient />);
    await screen.findByText('EY');
    await user.click(screen.getByRole('button', { name: 'Move EY up' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/experience/'),
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });
});
