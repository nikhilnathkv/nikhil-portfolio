import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperienceEditor } from '@/components/admin/experience/ExperienceEditor';
import type { Experience } from '@/lib/admin/experience-types';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

const created: Experience = {
  id: 'ex1',
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
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  replace.mockClear();
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/api/admin/projects'))
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    if ((init?.method ?? 'GET') !== 'GET')
      return { ok: true, status: 200, json: async () => ({ data: created }) };
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('ExperienceEditor', () => {
  it('current-role checkbox disables and clears the end date', async () => {
    const user = userEvent.setup();
    render(<ExperienceEditor />);
    const endDate = screen.getByLabelText(/End date/);
    await user.type(endDate, '2025-12-31');
    expect(endDate).toHaveValue('2025-12-31');

    await user.click(screen.getByLabelText('This is my current role'));
    expect(endDate).toBeDisabled();
    expect(endDate).toHaveValue('');
  });

  it('shows a date-order error and blocks saving', async () => {
    const user = userEvent.setup();
    render(<ExperienceEditor />);
    await user.type(screen.getByLabelText(/Company/), 'X');
    await user.type(screen.getByLabelText(/^Role/), 'Y');
    await user.type(screen.getByLabelText(/Start date/), '2026-05-01');
    await user.type(screen.getByLabelText(/End date/), '2026-01-01');
    expect(screen.getByText(/cannot be earlier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('creates an experience via POST', async () => {
    const user = userEvent.setup();
    render(<ExperienceEditor />);
    await user.type(screen.getByLabelText(/Company/), 'Novigo');
    await user.type(screen.getByLabelText(/^Role/), 'AI/ML Engineer');
    await user.type(screen.getByLabelText(/Start date/), '2026-01-01');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/experience',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(replace).toHaveBeenCalledWith('/admin/experience/ex1');
  });
});
