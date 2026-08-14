import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectListClient } from '@/components/admin/projects/ProjectListClient';
import type { ProjectListItem } from '@/lib/admin/project-types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/projects',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const project: ProjectListItem = {
  id: 'p1',
  title: 'Aviation Intelligence',
  slug: 'aviation-intelligence',
  short_description: 'Forecasting demand.',
  category: 'Time Series',
  status: 'draft',
  featured: false,
  display_order: 0,
  published_at: null,
  created_at: '2026-08-14T00:00:00Z',
  updated_at: '2026-08-14T00:00:00Z',
  skills: [],
};

function listResponse(items: ProjectListItem[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: items,
      meta: { pagination: { page: 1, page_size: 20, total: items.length, total_pages: 1 } },
    }),
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'DELETE') return { ok: true, status: 204, json: async () => ({}) };
    if (method === 'POST') return { ok: true, status: 200, json: async () => ({ data: project }) };
    if (method === 'PUT') return { ok: true, status: 200, json: async () => ({ data: project }) };
    return listResponse([project]);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('ProjectListClient', () => {
  it('loads and renders projects', async () => {
    render(<ProjectListClient />);
    expect(await screen.findByText('Aviation Intelligence')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/projects?'),
      expect.anything(),
    );
  });

  it('shows the empty state when there are no projects', async () => {
    fetchMock.mockImplementation(async () => listResponse([]));
    render(<ProjectListClient />);
    expect(await screen.findByText('No projects yet')).toBeInTheDocument();
  });

  it('sends a search query (debounced) to the API', async () => {
    const user = userEvent.setup();
    render(<ProjectListClient />);
    await screen.findByText('Aviation Intelligence');
    await user.type(screen.getByLabelText('Search projects'), 'aviation');
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('q=aviation'),
        expect.anything(),
      ),
    );
  });

  it('deletes a project after typing the confirmation', async () => {
    const user = userEvent.setup();
    render(<ProjectListClient />);
    await screen.findByText('Aviation Intelligence');

    await user.click(screen.getByRole('button', { name: 'Actions for Aviation Intelligence' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'DELETE');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/projects/p1',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('publishes a project through the confirm dialog', async () => {
    const user = userEvent.setup();
    render(<ProjectListClient />);
    await screen.findByText('Aviation Intelligence');

    await user.click(screen.getByRole('button', { name: 'Actions for Aviation Intelligence' }));
    await user.click(screen.getByRole('menuitem', { name: 'Publish' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/aviation-intelligence/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/projects/p1/publish',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('optimistically toggles featured with a PUT', async () => {
    const user = userEvent.setup();
    render(<ProjectListClient />);
    await screen.findByText('Aviation Intelligence');
    await user.click(screen.getByRole('button', { name: 'Feature project' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/projects/p1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });
});
