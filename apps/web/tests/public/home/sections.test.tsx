import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EngineeringFocus } from '@/components/public/home/EngineeringFocus';
import { Hero } from '@/components/public/home/Hero';
import { SelectedWork } from '@/components/public/home/SelectedWork';
import type { ProjectListItem } from '@/lib/admin/project-types';
import type { SkillCategory } from '@/lib/admin/skill-types';

function project(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'p1',
    title: 'Enterprise AI Knowledge Platform',
    slug: 'enterprise-ai',
    short_description: 'Production RAG over enterprise documents.',
    category: 'GenAI',
    status: 'published',
    featured: true,
    display_order: 0,
    published_at: '2026-01-01',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    hero_image_url: null,
    metrics: [{ name: 'Retrieval accuracy', value: '94', unit: '%', display_order: 0 }],
    skills: [{ id: 's1', category_id: 'c1', name: 'RAG', display_order: 0, featured: true }],
    ...overrides,
  };
}

describe('Hero', () => {
  it('renders name, role, positioning, both CTAs, and the tech signal', () => {
    render(
      <Hero
        name="Nikhil Nath"
        role="AI / ML Engineer"
        positioning="I build production-grade AI systems."
        techSignal={['GenAI', 'RAG']}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Nikhil Nath' })).toBeInTheDocument();
    expect(screen.getByText('AI / ML Engineer')).toBeInTheDocument();
    expect(screen.getByText('I build production-grade AI systems.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore my work' })).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(screen.getByRole('link', { name: 'View resume' })).toHaveAttribute('href', '/resume');
    expect(screen.getByText('GenAI')).toBeInTheDocument();
  });
});

describe('SelectedWork', () => {
  it('renders featured project cards with their metrics', () => {
    render(<SelectedWork projects={[project()]} />);
    expect(
      screen.getByRole('link', { name: 'Enterprise AI Knowledge Platform' }),
    ).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
  });

  it('shows a graceful public empty state (not a CMS error) when there are none', () => {
    render(<SelectedWork projects={[]} githubUrl="https://github.com/x" />);
    expect(screen.queryByText(/no projects found/i)).not.toBeInTheDocument();
    expect(screen.getByText(/documenting some of the systems/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub →' })).toHaveAttribute(
      'href',
      'https://github.com/x',
    );
  });
});

describe('EngineeringFocus', () => {
  it('derives areas from skill categories when present', () => {
    const categories: SkillCategory[] = [
      {
        id: 'c1',
        name: 'Generative AI',
        display_order: 0,
        skills: [{ id: 's1', category_id: 'c1', name: 'RAG', display_order: 0, featured: true }],
      },
    ];
    render(<EngineeringFocus categories={categories} />);
    expect(screen.getByRole('heading', { name: 'Generative AI' })).toBeInTheDocument();
  });

  it('falls back to curated areas when there are no skills', () => {
    render(<EngineeringFocus categories={[]} />);
    expect(screen.getByRole('heading', { name: 'Agentic AI' })).toBeInTheDocument();
  });
});
