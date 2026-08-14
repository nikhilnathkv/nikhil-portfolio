import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MessagesClient } from '@/components/admin/messages/MessagesClient';
import type { ContactMessage } from '@/lib/admin/message-types';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const msg: ContactMessage = {
  id: 'c1',
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Interested in AI collaboration',
  status: 'unread',
  created_at: '2026-08-15T09:00:00Z',
  read_at: null,
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/read'))
      return { ok: true, status: 200, json: async () => ({ data: { ...msg, status: 'read' } }) };
    if ((init?.method ?? 'GET') === 'POST' || (init?.method ?? 'GET') === 'DELETE')
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { ...msg, status: 'archived' } }),
      };
    return { ok: true, status: 200, json: async () => ({ data: [msg] }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('MessagesClient', () => {
  it('lists messages and opens one, marking it read', async () => {
    const user = userEvent.setup();
    render(<MessagesClient />);
    await user.click(await screen.findByText('John Doe'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/messages/c1/read',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('archives the open message', async () => {
    const user = userEvent.setup();
    render(<MessagesClient />);
    await user.click(await screen.findByText('John Doe'));
    await user.click(await screen.findByRole('button', { name: 'Archive' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/messages/c1/archive',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('filters by unread', async () => {
    const user = userEvent.setup();
    render(<MessagesClient />);
    await screen.findByText('John Doe');
    await user.click(screen.getByRole('button', { name: 'unread' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/messages?status=unread',
        expect.anything(),
      ),
    );
  });
});
