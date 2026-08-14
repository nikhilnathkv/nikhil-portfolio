import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileEditor } from '@/components/admin/profile/ProfileEditor';
import type { Profile } from '@/lib/admin/profile-types';

const profile: Profile = {
  id: 'pr1',
  name: 'Nikhil',
  headline: 'AI/ML Engineer',
  short_bio: 'short',
  long_bio: 'long',
  location: 'Bengaluru',
  email: 'me@example.com',
  linkedin_url: null,
  github_url: null,
  profile_image_id: null,
  resume_id: null,
  profile_image: null,
  resume: null,
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/admin/media'))
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    if (url.endsWith('/api/admin/resumes'))
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    if ((init?.method ?? 'GET') === 'PUT')
      return { ok: true, status: 200, json: async () => ({ data: profile }) };
    return { ok: true, status: 200, json: async () => ({ data: {} }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('ProfileEditor', () => {
  it('disables Save until required fields are present', async () => {
    const user = userEvent.setup();
    render(<ProfileEditor initial={null} />);
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/Name/), 'Nikhil');
    await user.type(screen.getByLabelText(/Headline/), 'AI/ML Engineer');
    await user.type(screen.getByLabelText(/Short bio/), 'short');
    await user.type(screen.getByLabelText(/Long bio/), 'long');
    expect(save).toBeEnabled();
  });

  it('prefills from an existing profile and marks dirty on edit', async () => {
    const user = userEvent.setup();
    render(<ProfileEditor initial={profile} />);
    expect(screen.getByLabelText(/Name/)).toHaveValue('Nikhil');
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/Headline/), '!');
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('saves via PUT /profile', async () => {
    const user = userEvent.setup();
    render(<ProfileEditor initial={profile} />);
    await user.type(screen.getByLabelText(/Name/), ' K V');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/profile',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
  });
});
