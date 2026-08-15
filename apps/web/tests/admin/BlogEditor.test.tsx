import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogEditor } from '@/components/admin/blog/BlogEditor';
import type { BlogPost } from '@/lib/admin/blog-types';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

const post: BlogPost = {
  id: 'b1',
  title: 'RAG Eval',
  slug: 'rag-eval',
  excerpt: null,
  content: '# hi',
  cover_image_id: null,
  category: 'RAG',
  status: 'draft',
  featured: false,
  seo_title: null,
  seo_description: null,
  published_at: null,
  created_at: '2026-08-14T00:00:00Z',
  updated_at: '2026-08-14T00:00:00Z',
  tags: [],
  cover_image: null,
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  replace.mockClear();
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/admin/media'))
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    if (url.includes('/publish'))
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { ...post, status: 'published' } }),
      };
    if ((init?.method ?? 'GET') !== 'GET')
      return { ok: true, status: 200, json: async () => ({ data: post }) };
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('BlogEditor', () => {
  it('auto-generates slug and creates on Save Draft', async () => {
    const user = userEvent.setup();
    render(<BlogEditor />);
    await user.type(screen.getByLabelText(/^Title/), 'RAG Eval');
    expect(screen.getByLabelText(/Slug/)).toHaveValue('rag-eval');
    await user.type(screen.getByLabelText('Markdown content'), '# hi');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/blog',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(replace).toHaveBeenCalledWith('/admin/blog/b1');
  });

  it('publishes an existing post through the dialog', async () => {
    const user = userEvent.setup();
    render(<BlogEditor initial={post} />);
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('/writing/rag-eval');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/blog/b1/publish',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
