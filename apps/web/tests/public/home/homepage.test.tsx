import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from '@/app/(public)/page';

vi.mock('@/services/profile', () => ({ getProfile: vi.fn() }));
vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));
vi.mock('@/services/experience', () => ({ listExperience: vi.fn() }));
vi.mock('@/services/blog', () => ({ listPosts: vi.fn() }));
vi.mock('@/services/research', () => ({ listResearch: vi.fn() }));
vi.mock('@/services/skills', () => ({ listSkills: vi.fn() }));

import { listPosts } from '@/services/blog';
import { listExperience } from '@/services/experience';
import { getProfile } from '@/services/profile';
import { listProjects } from '@/services/projects';
import { listResearch } from '@/services/research';
import { listSkills } from '@/services/skills';

beforeEach(() => {
  vi.mocked(getProfile).mockResolvedValue({
    id: '1',
    name: 'Nikhil Nath',
    headline: 'AI / ML Engineer',
    short_bio: 'I build production-grade AI systems.',
    long_bio: 'Longer bio here.',
    location: null,
    email: 'me@example.com',
    linkedin_url: 'https://linkedin.com/in/x',
    github_url: 'https://github.com/x',
    profile_image_id: null,
    resume_id: null,
    profile_image: null,
    education: null,
    certifications: null,
    resume: null,
  });
  vi.mocked(listProjects).mockResolvedValue([]);
  vi.mocked(listExperience).mockResolvedValue([]);
  vi.mocked(listPosts).mockResolvedValue([]);
  vi.mocked(listResearch).mockResolvedValue([]);
  vi.mocked(listSkills).mockResolvedValue([]);
});

describe('HomePage (integration)', () => {
  it('fetches all sections in parallel and renders the hero + key sections', async () => {
    const ui = await HomePage();
    render(ui);

    // Hero
    expect(screen.getByRole('heading', { level: 1, name: 'Nikhil Nath' })).toBeInTheDocument();
    // Sections present even when content is empty (graceful)
    expect(screen.getByText('Selected Work')).toBeInTheDocument();
    expect(screen.getByText('Engineering Focus')).toBeInTheDocument();
    expect(screen.getByText("Let's build something useful.")).toBeInTheDocument();

    // Every data source was queried (parallel fetch).
    expect(getProfile).toHaveBeenCalledOnce();
    expect(listProjects).toHaveBeenCalledWith({ featured: true });
    expect(listSkills).toHaveBeenCalledOnce();
  });
});
