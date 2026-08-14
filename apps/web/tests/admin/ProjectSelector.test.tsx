import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectSelector } from '@/components/admin/projects/ProjectSelector';
import type { ProjectRef } from '@/lib/admin/experience-types';

const projects = [
  { id: '1', title: 'Enterprise AI Platform', slug: 'enterprise-ai-platform' },
  { id: '2', title: 'Vision Pipeline', slug: 'vision-pipeline' },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: projects }) })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('ProjectSelector', () => {
  it('searches and adds a project', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ProjectSelector selected={[]} onChange={onChange} />);

    // Wait for options to load.
    await waitFor(() => expect(screen.getByLabelText('Search projects')).toBeInTheDocument());
    await user.type(screen.getByLabelText('Search projects'), 'vision');
    await user.click(await screen.findByRole('option', { name: 'Vision Pipeline' }));
    expect(onChange).toHaveBeenCalledWith([projects[1]]);
  });

  it('renders selected chips and removes them', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const selected: ProjectRef[] = [projects[0]];
    render(<ProjectSelector selected={selected} onChange={onChange} />);
    expect(screen.getByText('Enterprise AI Platform')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Enterprise AI Platform' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
