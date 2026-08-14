import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentListShell, type Column } from '@/components/cms/ContentListShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/blog',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

interface Item {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  title: string;
}

const item: Item = { id: 'a1', slug: 'hello', status: 'draft', title: 'Hello Post' };
const columns: Column<Item>[] = [{ header: 'Article', cell: (i) => <span>{i.title}</span> }];

function listResponse(items: Item[]) {
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
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'POST') return { ok: true, status: 200, json: async () => ({ data: item }) };
    return listResponse([item]);
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function renderShell() {
  render(
    <ContentListShell<Item>
      basePath="/blog"
      adminBase="/admin/blog"
      previewBase="/preview/blog"
      publicBase="/blog"
      columns={columns}
      newHref="/admin/blog/new"
      newLabel="+ New"
      emptyTitle="Empty"
    />,
  );
}

describe('ContentListShell', () => {
  it('loads and renders rows', async () => {
    renderShell();
    expect(await screen.findByText('Hello Post')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/blog?'),
      expect.anything(),
    );
  });

  it('duplicates without a confirm dialog', async () => {
    renderShell();
    await screen.findByText('Hello Post');
    await userEvent.setup().click(screen.getByRole('button', { name: /Actions/i }));
    await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/blog/a1/duplicate',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('publishes through a confirm dialog that shows the public URL', async () => {
    renderShell();
    await screen.findByText('Hello Post');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Actions/i }));
    await user.click(screen.getByRole('menuitem', { name: 'Publish' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/\/blog\/hello/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/blog/a1/publish',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
