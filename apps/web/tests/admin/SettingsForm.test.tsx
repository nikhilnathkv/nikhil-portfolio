import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsForm } from '@/components/admin/settings/SettingsForm';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'PUT')
      return { ok: true, status: 200, json: async () => ({ data: {} }) };
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: [{ key: 'site_name', value: 'Old Name' }] }),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('SettingsForm', () => {
  it('loads settings, edits a value, and saves only changed keys', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    const siteName = await screen.findByLabelText('Site name');
    expect(siteName).toHaveValue('Old Name');

    // Save disabled until dirty.
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.clear(siteName);
    await user.type(siteName, 'Nikhil Nath');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/settings/site_name',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    // Unchanged keys are not PUT.
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/admin/settings/footer_text',
      expect.anything(),
    );
  });
});
