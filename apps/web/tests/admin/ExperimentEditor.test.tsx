import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperimentEditor } from '@/components/admin/experiments/ExperimentEditor';
import type { Experiment } from '@/lib/admin/experiment-types';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

const created: Experiment = {
  id: 'e1',
  title: 'BM25 vs Dense',
  slug: 'bm25-vs-dense',
  hypothesis: null,
  method: null,
  results: null,
  conclusion: null,
  project_id: null,
  project: null,
  github_url: null,
  status: 'draft',
  metrics: [],
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

describe('ExperimentEditor', () => {
  it('adds a metric and creates the experiment with it', async () => {
    const user = userEvent.setup();
    render(<ExperimentEditor />);
    await user.type(screen.getByLabelText(/^Title/), 'BM25 vs Dense');

    await user.click(screen.getByRole('button', { name: '+ Add Metric' }));
    await user.type(screen.getByLabelText('Metric 1 name'), 'Recall@5');
    await user.type(screen.getByLabelText('Metric 1 value'), '0.87');

    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const call = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/admin/experiments' && init?.method === 'POST',
    );
    expect(call).toBeTruthy();
    const body = JSON.parse((call![1] as RequestInit).body as string);
    expect(body.metrics).toEqual([expect.objectContaining({ name: 'Recall@5', value: '0.87' })]);
    expect(replace).toHaveBeenCalledWith('/admin/experiments/e1');
  });
});
