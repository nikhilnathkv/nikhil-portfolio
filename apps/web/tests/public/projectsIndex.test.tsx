import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectsIndexPage from '@/app/(public)/projects/page';
import type { ProjectListItem } from '@/lib/admin/project-types';

vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));
import { listProjects } from '@/services/projects';

function project(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: Math.random().toString(36),
    title: 'A Project',
    slug: 'a-project',
    short_description: 'desc',
    category: 'GenAI',
    status: 'published',
    featured: false,
    display_order: 0,
    published_at: '2026-01-01',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    hero_image_url: null,
    metrics: [],
    skills: [],
    ...overrides,
  };
}

beforeEach(() => vi.mocked(listProjects).mockReset());

describe('Projects index', () => {
  it('renders a featured section, category chips, and all cards', async () => {
    vi.mocked(listProjects).mockResolvedValue([
      project({
        id: '1',
        title: 'Featured RAG',
        slug: 'featured-rag',
        featured: true,
        category: 'GenAI',
      }),
      project({ id: '2', title: 'Vision System', slug: 'vision', category: 'Computer Vision' }),
    ]);
    render(await ProjectsIndexPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'GenAI' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Computer Vision' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vision System' })).toBeInTheDocument();
  });

  it('filters to the selected category', async () => {
    vi.mocked(listProjects).mockResolvedValue([
      project({ id: '1', title: 'GenAI One', slug: 'g1', category: 'GenAI' }),
      project({ id: '2', title: 'Vision One', slug: 'v1', category: 'Computer Vision' }),
    ]);
    render(await ProjectsIndexPage({ searchParams: Promise.resolve({ category: 'GenAI' }) }));

    expect(screen.getByRole('link', { name: 'GenAI One' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Vision One' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GenAI' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows a graceful empty state when there are no projects', async () => {
    vi.mocked(listProjects).mockResolvedValue([]);
    render(await ProjectsIndexPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Case studies are on the way/i)).toBeInTheDocument();
  });
});
