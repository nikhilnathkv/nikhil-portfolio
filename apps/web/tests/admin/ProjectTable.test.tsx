import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProjectTable } from '@/components/admin/projects/ProjectTable';
import type { ProjectListItem } from '@/lib/admin/project-types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/projects',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const base = {
  short_description: 'x',
  category: 'GenAI',
  display_order: 0,
  published_at: null,
  created_at: '2026-08-14T00:00:00Z',
  updated_at: '2026-08-14T00:00:00Z',
  skills: [],
};

const draft: ProjectListItem = {
  ...base,
  id: '1',
  title: 'Draft One',
  slug: 'draft-one',
  status: 'draft',
  featured: false,
};
const published: ProjectListItem = {
  ...base,
  id: '2',
  title: 'Live One',
  slug: 'live-one',
  status: 'published',
  featured: true,
};

describe('ProjectTable', () => {
  it('renders a row per project with status', () => {
    render(
      <ProjectTable
        projects={[draft, published]}
        onToggleFeatured={() => {}}
        onAction={() => {}}
      />,
    );
    expect(screen.getByText('Draft One')).toBeInTheDocument();
    expect(screen.getByText('Live One')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('toggles featured via the star button', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<ProjectTable projects={[draft]} onToggleFeatured={onToggle} onAction={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Feature project' }));
    expect(onToggle).toHaveBeenCalledWith(draft);
  });

  it('offers Publish for a draft and Unpublish for a published project', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <ProjectTable
        projects={[draft, published]}
        onToggleFeatured={() => {}}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions for Draft One' }));
    await user.click(screen.getByRole('menuitem', { name: 'Publish' }));
    expect(onAction).toHaveBeenCalledWith('publish', draft);

    await user.click(screen.getByRole('button', { name: 'Actions for Live One' }));
    const menu = screen.getByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Unpublish' }));
    expect(onAction).toHaveBeenCalledWith('unpublish', published);
  });

  it('always offers Delete', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<ProjectTable projects={[draft]} onToggleFeatured={() => {}} onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Actions for Draft One' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledWith('delete', draft);
  });
});
