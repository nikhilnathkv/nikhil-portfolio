import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaLibraryClient } from '@/components/admin/media/MediaLibraryClient';
import type { Media } from '@/lib/admin/media-types';

const media: Media = {
  id: 'm1',
  filename: 'abc.png',
  original_filename: 'diagram.png',
  mime_type: 'image/png',
  size: 2048,
  url: 'http://storage/abc.png',
  alt_text: null,
  title: null,
  description: null,
  created_at: '2026-08-15T00:00:00Z',
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/usage'))
      return { ok: true, status: 200, json: async () => ({ data: { count: 0, items: [] } }) };
    if (method === 'DELETE') return { ok: true, status: 204, json: async () => ({}) };
    if (method === 'PUT') return { ok: true, status: 200, json: async () => ({ data: media }) };
    return { ok: true, status: 200, json: async () => ({ data: [media] }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('MediaLibraryClient', () => {
  it('renders the media grid', async () => {
    render(<MediaLibraryClient />);
    expect(await screen.findByText('diagram.png')).toBeInTheDocument();
  });

  it('rejects an unsupported file type client-side (no upload)', async () => {
    const { container } = render(<MediaLibraryClient />);
    await screen.findByText('diagram.png');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bad = new File(['x'], 'evil.exe', { type: 'application/x-msdownload' });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(await screen.findByText(/Unsupported file type/)).toBeInTheDocument();
    // No POST attempted.
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/admin/media',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('opens detail, shows usage, and deletes', async () => {
    const user = userEvent.setup();
    render(<MediaLibraryClient />);
    await user.click(await screen.findByText('diagram.png'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Not used by any content/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    // Confirm dialog
    const confirm = screen.getAllByRole('dialog').at(-1)!;
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/media/m1',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });
});
