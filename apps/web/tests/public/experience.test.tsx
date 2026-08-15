import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExperiencePage from '@/app/(public)/experience/page';
import { TimelineRole } from '@/components/public/experience/TimelineRole';
import type { Experience } from '@/lib/admin/experience-types';

vi.mock('@/services/experience', () => ({ listExperience: vi.fn() }));
import { listExperience } from '@/services/experience';

function role(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'x1',
    company: 'EY',
    role: 'Senior Associate',
    location: 'Abu Dhabi, UAE',
    start_date: '2020-06-01',
    end_date: '2026-01-01',
    is_current: false,
    summary: 'Enterprise AI/ML engagements.',
    description: '- Built a retrieval system\n- Improved accuracy',
    display_order: 0,
    projects: [{ id: 'p1', title: 'Enterprise RAG', slug: 'enterprise-rag' }],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('TimelineRole', () => {
  it('renders the role, company, location, a date range, and linked projects', () => {
    render(
      <ul>
        <TimelineRole role={role()} />
      </ul>,
    );
    expect(screen.getByRole('heading', { name: 'Senior Associate' })).toBeInTheDocument();
    expect(screen.getByText(/EY/)).toBeInTheDocument();
    expect(screen.getByText(/Abu Dhabi, UAE/)).toBeInTheDocument();
    expect(screen.getByText(/Jun 2020 — Jan 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Enterprise RAG/ })).toHaveAttribute(
      'href',
      '/projects/enterprise-rag',
    );
    // Markdown impact bullets rendered.
    expect(screen.getByText('Built a retrieval system')).toBeInTheDocument();
  });

  it('shows "Present" for a current role and anchors an id for backlinks', () => {
    const { container } = render(
      <ul>
        <TimelineRole role={role({ id: 'cur', is_current: true, end_date: null })} />
      </ul>,
    );
    expect(screen.getByText(/— Present/)).toBeInTheDocument();
    expect(container.querySelector('#exp-cur')).not.toBeNull();
  });
});

describe('Experience page', () => {
  beforeEach(() => vi.mocked(listExperience).mockReset());

  it('renders a timeline of roles', async () => {
    vi.mocked(listExperience).mockResolvedValue([role({ id: 'a', company: 'Novigo' })]);
    render(await ExperiencePage());
    expect(screen.getByRole('heading', { level: 1, name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByText(/Novigo/)).toBeInTheDocument();
  });

  it('shows a graceful empty state', async () => {
    vi.mocked(listExperience).mockResolvedValue([]);
    render(await ExperiencePage());
    expect(screen.getByText(/being written up/i)).toBeInTheDocument();
  });
});
