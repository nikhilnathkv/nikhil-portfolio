import { afterEach, describe, expect, it, vi } from 'vitest';

import { adminRequest, SessionExpiredError } from '@/lib/admin/client-api';

afterEach(() => vi.unstubAllGlobals());

describe('adminRequest session handling', () => {
  it('throws SessionExpiredError on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
    );
    await expect(adminRequest('/projects')).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
