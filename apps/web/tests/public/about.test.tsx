import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AboutPage from '@/app/(public)/about/page';
import type { Experience } from '@/lib/admin/experience-types';
import type { ProjectListItem } from '@/lib/admin/project-types';
import type { SkillCategory } from '@/lib/admin/skill-types';

vi.mock('@/services/profile', () => ({ getProfile: vi.fn() }));
vi.mock('@/services/skills', () => ({ listSkills: vi.fn() }));
vi.mock('@/services/experience', () => ({ listExperience: vi.fn() }));
vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));

import { listExperience } from '@/services/experience';
import { getProfile } from '@/services/profile';
import { listProjects } from '@/services/projects';
import { listSkills } from '@/services/skills';

const skills: SkillCategory[] = [
  {
    id: 'c1',
    name: 'GenAI',
    display_order: 0,
    skills: [{ id: 's1', category_id: 'c1', name: 'RAG', display_order: 0, featured: true }],
  },
];

beforeEach(() => {
  vi.mocked(getProfile).mockResolvedValue(null);
  vi.mocked(listSkills).mockResolvedValue(skills);
  vi.mocked(listExperience).mockResolvedValue([{ start_date: '2018-01-01' } as Experience]);
  vi.mocked(listProjects).mockResolvedValue([{ id: 'p1' } as ProjectListItem]);
});

describe('About page', () => {
  it('renders positioning, grouped skills, and substantiated highlights', async () => {
    render(await AboutPage());
    expect(
      screen.getByRole('heading', { level: 1, name: /Building production AI systems/i }),
    ).toBeInTheDocument();
    // Grouped skills use the category name as an eyebrow, plus the skill tag.
    expect(screen.getAllByText('GenAI').length).toBeGreaterThan(0);
    expect(screen.getByText('RAG')).toBeInTheDocument();
    // Computed highlights: years of experience (>= 1) and case-study count.
    expect(screen.getByText('Years experience')).toBeInTheDocument();
    expect(screen.getByText('Case studies')).toBeInTheDocument();
  });
});
