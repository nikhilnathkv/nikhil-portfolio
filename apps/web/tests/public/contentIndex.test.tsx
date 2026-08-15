import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExperimentsIndexPage from '@/app/(public)/experiments/page';
import ResearchIndexPage from '@/app/(public)/research/page';
import WritingIndexPage from '@/app/(public)/writing/page';
import type { BlogPostListItem } from '@/lib/admin/blog-types';

vi.mock('@/services/blog', () => ({ listPosts: vi.fn() }));
vi.mock('@/services/research', () => ({ listResearch: vi.fn() }));
vi.mock('@/services/experiments', () => ({ listExperiments: vi.fn() }));

import { listPosts } from '@/services/blog';
import { listExperiments } from '@/services/experiments';
import { listResearch } from '@/services/research';

function post(overrides: Partial<BlogPostListItem> = {}): BlogPostListItem {
  return {
    id: Math.random().toString(36),
    title: 'A Post',
    slug: 'a-post',
    excerpt: 'x',
    category: 'GenAI',
    status: 'published',
    featured: false,
    published_at: '2026-08-01',
    created_at: '2026-08-01',
    updated_at: '2026-08-01',
    tags: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(listPosts).mockReset();
  vi.mocked(listResearch).mockReset();
  vi.mocked(listExperiments).mockReset();
});

describe('Writing index', () => {
  it('renders cards + category filter and filters by category', async () => {
    vi.mocked(listPosts).mockResolvedValue([
      post({ id: '1', title: 'GenAI Post', slug: 'genai', category: 'GenAI' }),
      post({ id: '2', title: 'ML Post', slug: 'ml', category: 'Machine Learning' }),
    ]);
    render(await WritingIndexPage({ searchParams: Promise.resolve({ category: 'GenAI' }) }));
    expect(screen.getByRole('heading', { level: 1, name: 'Articles & deep-dives' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GenAI Post' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'ML Post' })).not.toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    vi.mocked(listPosts).mockResolvedValue([]);
    render(await WritingIndexPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/currently exploring this area/i)).toBeInTheDocument();
  });
});

describe('Research & Experiments indexes', () => {
  it('research empty state', async () => {
    vi.mocked(listResearch).mockResolvedValue([]);
    render(await ResearchIndexPage());
    expect(screen.getByRole('heading', { level: 1, name: 'Investigations & findings' })).toBeInTheDocument();
    expect(screen.getByText(/currently exploring this area/i)).toBeInTheDocument();
  });

  it('experiments empty state', async () => {
    vi.mocked(listExperiments).mockResolvedValue([]);
    render(await ExperimentsIndexPage());
    expect(screen.getByRole('heading', { level: 1, name: 'A technical playground' })).toBeInTheDocument();
    expect(screen.getByText(/currently exploring this area/i)).toBeInTheDocument();
  });
});
