import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkillsManager } from '@/components/admin/skills/SkillsManager';

const categories = [
  {
    id: 'c1',
    name: 'GenAI',
    display_order: 0,
    skills: [
      {
        id: 's1',
        category_id: 'c1',
        name: 'LangGraph',
        description: null,
        display_order: 0,
        featured: false,
      },
    ],
  },
];

function baseFetch(overrides: (url: string, init?: RequestInit) => unknown | undefined) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const custom = overrides(url, init);
    if (custom) return custom;
    if (url.endsWith('/api/admin/skill-categories') && (init?.method ?? 'GET') === 'GET')
      return { ok: true, status: 200, json: async () => ({ data: categories }) };
    if (url.includes('/projects'))
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    return { ok: true, status: 200, json: async () => ({ data: {} }) };
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('SkillsManager', () => {
  it('renders categories and their skills', async () => {
    vi.stubGlobal(
      'fetch',
      baseFetch(() => undefined),
    );
    render(<SkillsManager />);
    expect(await screen.findByText('GenAI')).toBeInTheDocument();
    expect(screen.getByText('LangGraph')).toBeInTheDocument();
  });

  it('creates a category via POST', async () => {
    const fetchMock = baseFetch((url, init) =>
      url.endsWith('/api/admin/skill-categories') && init?.method === 'POST'
        ? {
            ok: true,
            status: 201,
            json: async () => ({ data: { id: 'c2', name: 'ML', display_order: 1, skills: [] } }),
          }
        : undefined,
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<SkillsManager />);
    await screen.findByText('GenAI');

    await user.click(screen.getAllByRole('button', { name: '+ Category' })[0]);
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Name/), 'ML');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/skill-categories',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('shows the usage indicator when editing a skill', async () => {
    const fetchMock = baseFetch((url) =>
      url.endsWith('/api/admin/skills/s1/projects')
        ? {
            ok: true,
            status: 200,
            json: async () => ({ data: [{ id: 'p1', title: 'Agentic RAG', slug: 'agentic-rag' }] }),
          }
        : undefined,
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<SkillsManager />);
    await screen.findByText('LangGraph');

    // Edit buttons: [0] is the category's, [1] is the skill's.
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    expect(await screen.findByText(/Used by 1 project/)).toBeInTheDocument();
    expect(screen.getByText('Agentic RAG')).toBeInTheDocument();
  });

  it('offers a forced delete when a skill is referenced', async () => {
    const fetchMock = baseFetch((url, init) => {
      if (url === '/api/admin/skills/s1' && init?.method === 'DELETE')
        return {
          ok: false,
          status: 422,
          json: async () => ({
            error: { code: 'BUSINESS_RULE', message: 'Skill is referenced by 2 project(s)' },
          }),
        };
      if (url === '/api/admin/skills/s1?force=true' && init?.method === 'DELETE')
        return { ok: true, status: 204, json: async () => ({}) };
      return undefined;
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<SkillsManager />);
    await screen.findByText('LangGraph');

    // Skill Delete → first confirm.
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]); // [0] is the category delete
    let dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    // Referenced → force dialog.
    expect(await screen.findByText(/referenced by 2 project/)).toBeInTheDocument();
    dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete anyway' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/skills/s1?force=true',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });
});
