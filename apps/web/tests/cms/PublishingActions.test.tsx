import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PublishingActions } from '@/components/cms/PublishingActions';

const noop = () => {};

function setup(status: 'draft' | 'published' | 'archived', overrides = {}) {
  const props = {
    title: 'X',
    status,
    isDirty: false,
    saving: false,
    canSave: true,
    onSave: vi.fn(),
    onPreview: vi.fn(),
    onPublish: vi.fn(),
    onUnpublish: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<PublishingActions {...props} />);
  return props;
}

describe('PublishingActions', () => {
  it('draft shows Save Draft + Publish and Delete in overflow', async () => {
    const props = setup('draft');
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(props.onDelete).toHaveBeenCalled();
  });

  it('published shows Save Changes + Unpublish/Archive, no Publish', async () => {
    const props = setup('published');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menuitem', { name: 'Unpublish' })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(props.onArchive).toHaveBeenCalled();
  });

  it('archived shows Republish', () => {
    setup('archived');
    expect(screen.getByRole('button', { name: 'Republish' })).toBeInTheDocument();
  });

  it('disables Save when canSave is false', () => {
    setup('draft', { canSave: false, onSave: noop });
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeDisabled();
  });
});
