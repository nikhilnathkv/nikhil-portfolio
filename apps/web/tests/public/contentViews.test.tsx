import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleView } from '@/components/content/ArticleView';
import { ExperimentView } from '@/components/content/ExperimentView';
import { ResearchView } from '@/components/content/ResearchView';
import type { BlogPost } from '@/lib/admin/blog-types';
import type { Experiment } from '@/lib/admin/experiment-types';
import type { Research } from '@/lib/admin/research-types';

const post: BlogPost = {
  id: 'b1',
  title: 'Evaluating RAG',
  slug: 'evaluating-rag',
  excerpt: 'How to measure retrieval quality.',
  content: 'Body with `code` and **bold**.',
  cover_image_id: null,
  category: 'GenAI',
  status: 'published',
  featured: false,
  seo_title: null,
  seo_description: null,
  published_at: '2026-08-01',
  created_at: '2026-08-01',
  updated_at: '2026-08-01',
  tags: [{ id: 't1', name: 'RAG' }],
  cover_image: null,
};

function research(overrides: Partial<Research> = {}): Research {
  return {
    id: 'r1',
    title: 'Hybrid Retrieval Benchmark',
    slug: 'hybrid-retrieval',
    abstract: 'We compare retrieval strategies.',
    research_question: 'Does hybrid beat dense?',
    methodology: 'A/B over 100 queries.',
    dataset: null,
    experimental_setup: null,
    results: 'Hybrid won.',
    analysis: null,
    limitations: null,
    conclusion: null,
    references: null,
    paper_url: null,
    publication_url: null,
    github_url: null,
    project_id: null,
    project: null,
    status: 'published',
    published_at: '2026-08-01',
    created_at: '2026-08-01',
    updated_at: '2026-08-01',
    related_experiments: [],
    ...overrides,
  };
}

function experiment(overrides: Partial<Experiment> = {}): Experiment {
  return {
    id: 'e1',
    title: 'BM25 vs Dense',
    slug: 'bm25-vs-dense',
    hypothesis: 'Dense wins on concepts.',
    method: null,
    setup: 'Two retrievers.',
    approach: null,
    results: 'Mixed.',
    learnings: 'Hybrid is best.',
    conclusion: null,
    project_id: null,
    project: null,
    github_url: null,
    status: 'published',
    metrics: [{ id: 'm1', name: 'Recall@5', value: '0.94', unit: null, display_order: 0 }],
    created_at: '2026-08-01',
    updated_at: '2026-08-01',
    related_research: [],
    ...overrides,
  };
}

describe('ArticleView', () => {
  it('renders title, excerpt, body and tags', () => {
    render(<ArticleView post={post} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Evaluating RAG' })).toBeInTheDocument();
    expect(screen.getByText('How to measure retrieval quality.')).toBeInTheDocument();
    expect(screen.getByText('RAG')).toBeInTheDocument();
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });
});

describe('ResearchView', () => {
  it('renders present sections and hides empty ones', () => {
    render(<ResearchView research={research()} />);
    expect(screen.getByRole('heading', { name: 'Research question' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Limitations' })).not.toBeInTheDocument();
  });

  it('renders related experiments (project-centric graph)', () => {
    render(
      <ResearchView
        research={research({
          related_experiments: [{ id: 'e9', title: 'BM25 baseline', slug: 'bm25-baseline' }],
        })}
      />,
    );
    expect(screen.getByRole('link', { name: /BM25 baseline/ })).toHaveAttribute(
      'href',
      '/experiments/bm25-baseline',
    );
  });
});

describe('ExperimentView', () => {
  it('renders hypothesis, metrics, setup (fallback), and related research', () => {
    render(
      <ExperimentView
        experiment={experiment({
          related_research: [{ id: 'r9', title: 'Retrieval Study', slug: 'retrieval-study' }],
        })}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Hypothesis' })).toBeInTheDocument();
    expect(screen.getByText('Recall@5')).toBeInTheDocument();
    expect(screen.getByText('0.94')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retrieval Study/ })).toHaveAttribute(
      'href',
      '/research/retrieval-study',
    );
  });

  it('falls back to method for Setup when setup is empty', () => {
    render(
      <ExperimentView experiment={experiment({ setup: null, method: 'Legacy method text.' })} />,
    );
    expect(screen.getByText('Legacy method text.')).toBeInTheDocument();
  });
});
