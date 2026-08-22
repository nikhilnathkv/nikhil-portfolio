import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { ContactForm } from '@/components/public/ContactForm';
import { Footer } from '@/components/public/Footer';
import { CaseStudyView } from '@/components/projects/CaseStudyView';
import { Hero } from '@/components/public/home/Hero';
import type { Project } from '@/lib/admin/project-types';

// jsdom lacks layout, so scope axe to rules that don't need it (colour-contrast
// is verified manually / in the design tokens, not in jsdom).
const opts = { rules: { 'color-contrast': { enabled: false } } };

function project(): Project {
  return {
    id: 'p1',
    title: 'Enterprise AI Knowledge Platform',
    slug: 'enterprise-ai',
    short_description: 'Production RAG over enterprise documents.',
    description: 'Overview.',
    problem: 'A problem.',
    solution: 'A solution.',
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
    github_url: 'https://github.com/x/y',
    live_url: null,
    hero_image_url: null,
    architecture_diagram_url: null,
    seo_title: null,
    seo_description: null,
    published_at: '2026-01-01',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    metrics: [{ id: 'm1', name: 'Accuracy', value: '94', unit: '%', display_order: 0 }],
    skills: [{ id: 's1', category_id: 'c1', name: 'RAG', display_order: 0, featured: true }],
    related_research: [],
    related_experiments: [],
    experience: [],
  };
}

describe('accessibility (axe)', () => {
  it('Hero has no violations', async () => {
    const { container } = render(
      <div className="public-theme">
        <Hero
          name="Nikhil Nath"
          role="AI / ML Engineer"
          positioning="I build systems."
          techSignal={['RAG']}
        />
      </div>,
    );
    expect(await axe(container, opts)).toHaveNoViolations();
  });

  it('ContactForm has no violations (labelled inputs)', async () => {
    const { container } = render(
      <div className="public-theme">
        <ContactForm />
      </div>,
    );
    expect(await axe(container, opts)).toHaveNoViolations();
  });

  it('CaseStudyView has no violations', async () => {
    const { container } = render(
      <div className="public-theme">
        <CaseStudyView project={project()} />
      </div>,
    );
    expect(await axe(container, opts)).toHaveNoViolations();
  });

  it('Footer has no violations', async () => {
    const { container } = render(
      <div className="public-theme">
        <Footer socials={[{ label: 'GitHub', href: 'https://github.com/x' }]} />
      </div>,
    );
    expect(await axe(container, opts)).toHaveNoViolations();
  });
});
