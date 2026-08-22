import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResumePage from '@/app/(public)/resume/page';
import type { Experience } from '@/lib/admin/experience-types';
import type { Profile } from '@/lib/admin/profile-types';
import type { ProjectListItem } from '@/lib/admin/project-types';
import type { Resume } from '@/lib/admin/resume-types';
import type { SkillCategory } from '@/lib/admin/skill-types';

vi.mock('@/services/profile', () => ({ getProfile: vi.fn() }));
vi.mock('@/services/experience', () => ({ listExperience: vi.fn() }));
vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));
vi.mock('@/services/skills', () => ({ listSkills: vi.fn() }));
vi.mock('@/services/resume', () => ({ getActiveResume: vi.fn() }));

import { listExperience } from '@/services/experience';
import { getProfile } from '@/services/profile';
import { listProjects } from '@/services/projects';
import { getActiveResume } from '@/services/resume';
import { listSkills } from '@/services/skills';

const profile: Profile = {
  id: '1',
  name: 'Nikhil Nath',
  headline: 'AI / ML Engineer',
  short_bio: 'Production AI/ML across enterprise environments.',
  long_bio: 'Longer.',
  location: 'Abu Dhabi',
  email: 'me@example.com',
  linkedin_url: 'https://linkedin.com/in/x',
  github_url: null,
  education: '- BSc, Example University',
  certifications: '- Azure AI Engineer',
  profile_image_id: null,
  resume_id: null,
  profile_image: null,
  resume: null,
};

beforeEach(() => {
  vi.mocked(getProfile).mockResolvedValue(profile);
  vi.mocked(listExperience).mockResolvedValue([
    {
      id: 'x1',
      company: 'Novigo',
      role: 'AI/ML Engineer',
      location: null,
      start_date: '2026-01-01',
      end_date: null,
      is_current: true,
      summary: 'Built production systems.',
      description: null,
      display_order: 0,
      projects: [],
      created_at: '',
      updated_at: '',
    } as Experience,
  ]);
  vi.mocked(listProjects).mockResolvedValue([
    {
      id: 'p1',
      title: 'Enterprise RAG',
      slug: 'enterprise-rag',
      short_description: 'Production RAG.',
      category: 'GenAI',
      status: 'published',
      featured: true,
      display_order: 0,
      published_at: null,
      created_at: '',
      updated_at: '',
      hero_image_url: null,
      metrics: [],
      skills: [],
    } as ProjectListItem,
  ]);
  vi.mocked(listSkills).mockResolvedValue([
    {
      id: 'c1',
      name: 'GenAI',
      display_order: 0,
      skills: [{ id: 's1', category_id: 'c1', name: 'RAG', display_order: 0, featured: true }],
    } as SkillCategory,
  ]);
  vi.mocked(getActiveResume).mockResolvedValue(null);
});

describe('Resume page', () => {
  it('assembles the web resume from CMS content', async () => {
    render(await ResumePage());
    expect(screen.getByRole('heading', { level: 1, name: 'Nikhil Nath' })).toBeInTheDocument();
    expect(
      screen.getByText('Production AI/ML across enterprise environments.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Enterprise RAG')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Certifications')).toBeInTheDocument();
    // No uploaded resume -> no download button.
    expect(screen.queryByRole('link', { name: /Download PDF/ })).not.toBeInTheDocument();
  });

  it('shows the Download PDF button when an active resume exists', async () => {
    vi.mocked(getActiveResume).mockResolvedValue({
      id: 'r1',
      name: 'CV',
      file_url: 'http://localhost:9000/media/cv.pdf',
      version: 'v1',
      is_active: true,
      created_at: '',
    } as Resume);
    render(await ResumePage());
    expect(screen.getByRole('link', { name: /Download PDF/ })).toHaveAttribute(
      'href',
      'http://localhost:9000/media/cv.pdf',
    );
  });
});
