import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CaseStudyView } from '@/components/projects/CaseStudyView';
import type { Project } from '@/lib/admin/project-types';

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'Enterprise AI Knowledge Platform',
    slug: 'enterprise-ai',
    short_description: 'Production RAG over enterprise documents.',
    description: 'An overview of the platform.',
    problem: 'Thousands of documents were hard to search.',
    solution: 'A hybrid retrieval pipeline.',
    architecture: null,
    engineering_decisions: null,
    evaluation: null,
    results: null,
    challenges: null,
    lessons_learned: null,
    category: 'GenAI',
    status: 'published',
    featured: true,
    is_confidential: false,
    display_order: 0,
    github_url: null,
    live_url: null,
    hero_image_url: null,
    architecture_diagram_url: null,
    seo_title: null,
    seo_description: null,
    published_at: '2026-01-01',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    metrics: [{ id: 'm1', name: 'Retrieval accuracy', value: '94', unit: '%', display_order: 0 }],
    skills: [{ id: 's1', category_id: 'c1', name: 'RAG', display_order: 0, featured: true }],
    related_research: [],
    related_experiments: [],
    ...overrides,
  };
}

describe('CaseStudyView', () => {
  it('renders hero, metrics, and the sections that have content', () => {
    render(<CaseStudyView project={project()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Enterprise AI Knowledge Platform' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Problem' })).toBeInTheDocument();
    expect(screen.getByText('Thousands of documents were hard to search.')).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
  });

  it('hides sections that have no content', () => {
    render(<CaseStudyView project={project()} />);
    expect(screen.queryByRole('heading', { name: 'Lessons learned' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Challenges' })).not.toBeInTheDocument();
  });

  it('shows a confidentiality note only when the project is confidential', () => {
    const { rerender } = render(<CaseStudyView project={project()} />);
    expect(screen.queryByText(/omitted for confidentiality/i)).not.toBeInTheDocument();
    rerender(<CaseStudyView project={project({ is_confidential: true })} />);
    expect(screen.getByText(/omitted for confidentiality/i)).toBeInTheDocument();
  });

  it('renders external links only when their URLs exist', () => {
    const { rerender } = render(<CaseStudyView project={project()} />);
    expect(screen.queryByRole('link', { name: /GitHub/i })).not.toBeInTheDocument();
    rerender(<CaseStudyView project={project({ github_url: 'https://github.com/x/y' })} />);
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/x/y',
    );
  });

  it('renders related research and experiments as links', () => {
    render(
      <CaseStudyView
        project={project({
          related_research: [{ id: 'r1', title: 'Retrieval Study', slug: 'retrieval-study' }],
          related_experiments: [{ id: 'e1', title: 'BM25 vs Dense', slug: 'bm25-vs-dense' }],
        })}
      />,
    );
    expect(screen.getByRole('link', { name: /Retrieval Study/ })).toHaveAttribute(
      'href',
      '/research/retrieval-study',
    );
    expect(screen.getByRole('link', { name: /BM25 vs Dense/ })).toHaveAttribute(
      'href',
      '/experiments/bm25-vs-dense',
    );
  });
});
