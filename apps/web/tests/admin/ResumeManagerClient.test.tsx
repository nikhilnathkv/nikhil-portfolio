import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResumeManagerClient } from '@/components/admin/resume/ResumeManagerClient';
import type { Resume } from '@/lib/admin/resume-types';

const active: Resume = {
  id: 'r1',
  name: 'Nikhil_2026.pdf',
  file_url: 'http://storage/r1.pdf',
  version: '2026.08',
  is_active: true,
  created_at: '2026-08-15T00:00:00Z',
};
const old: Resume = {
  id: 'r0',
  name: 'Nikhil_old.pdf',
  file_url: 'http://storage/r0.pdf',
  version: '2026.05',
  is_active: false,
  created_at: '2026-05-01T00:00:00Z',
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'POST')
      return { ok: true, status: 200, json: async () => ({ data: old }) };
    return { ok: true, status: 200, json: async () => ({ data: [active, old] }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('ResumeManagerClient', () => {
  it('shows the active resume and previous versions', async () => {
    render(<ResumeManagerClient />);
    expect(await screen.findByText('Nikhil_2026.pdf')).toBeInTheDocument();
    expect(screen.getByText('● ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/Nikhil_old.pdf/)).toBeInTheDocument();
  });

  it('activates a previous version', async () => {
    const user = userEvent.setup();
    render(<ResumeManagerClient />);
    await screen.findByText('Nikhil_2026.pdf');
    await user.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/resumes/r0/activate',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('rejects a non-PDF client-side', async () => {
    const { container } = render(<ResumeManagerClient />);
    await screen.findByText('Nikhil_2026.pdf');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'x.png', { type: 'image/png' })] },
    });
    expect(await screen.findByText(/must be a PDF/)).toBeInTheDocument();
  });
});
