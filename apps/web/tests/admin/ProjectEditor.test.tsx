import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectEditor } from '@/components/admin/projects/ProjectEditor';
import type { Project } from '@/lib/admin/project-types';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

const created: Project = {
  id: 'new1',
  title: 'Vision Pipeline',
  slug: 'vision-pipeline',
  short_description: 'A CV pipeline.',
  description: null,
  problem: null,
  solution: null,
  architecture: null,
  engineering_decisions: null,
  evaluation: null,
  results: null,
  challenges: null,
  lessons_learned: null,
  category: 'Computer Vision',
  status: 'draft',
  featured: false,
  is_confidential: false,
  display_order: 0,
  github_url: null,
  live_url: null,
  hero_image_url: null,
  architecture_diagram_url: null,
  seo_title: null,
  seo_description: null,
  published_at: null,
  created_at: '2026-08-14T00:00:00Z',
  updated_at: '2026-08-14T00:00:00Z',
  metrics: [],
  skills: [],
  related_research: [],
  related_experiments: [],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  replace.mockClear();
  fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith('/api/admin/skills')) {
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    }
    if (url.includes('/publish')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { ...created, status: 'published' } }),
      };
    }
    // create / update
    return { ok: true, status: 200, json: async () => ({ data: created }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('ProjectEditor', () => {
  it('auto-generates the slug from the title', async () => {
    const user = userEvent.setup();
    render(<ProjectEditor />);
    await user.type(screen.getByLabelText(/Title/), 'Enterprise AI Platform');
    expect(screen.getByLabelText(/Slug/)).toHaveValue('enterprise-ai-platform');
  });

  it('shows the short-description character counter', async () => {
    const user = userEvent.setup();
    render(<ProjectEditor />);
    expect(screen.getByText(/0\/200/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Short description/), 'Hello');
    expect(screen.getByText(/5\/200/)).toBeInTheDocument();
  });

  it('marks the form dirty after an edit', async () => {
    const user = userEvent.setup();
    render(<ProjectEditor />);
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/Title/), 'X');
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('disables Save Draft until title and short description are present', async () => {
    const user = userEvent.setup();
    render(<ProjectEditor />);
    const save = screen.getByRole('button', { name: 'Save Draft' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/Title/), 'Vision Pipeline');
    await user.type(screen.getByLabelText(/Short description/), 'A CV pipeline.');
    expect(save).toBeEnabled();
  });

  it('creates a project on Save Draft', async () => {
    const user = userEvent.setup();
    render(<ProjectEditor />);
    await user.type(screen.getByLabelText(/Title/), 'Vision Pipeline');
    await user.type(screen.getByLabelText(/Short description/), 'A CV pipeline.');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/projects',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(await screen.findByText('Draft saved.')).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/admin/projects/new1');
  });

  it('publishes through the confirm dialog', async () => {
    const user = userEvent.setup();
    render(<ProjectEditor initial={created} />);
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('/projects/vision-pipeline');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/projects/new1/publish',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
