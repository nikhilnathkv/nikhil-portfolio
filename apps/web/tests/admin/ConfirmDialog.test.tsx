import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(<ConfirmDialog open={false} title="Hidden" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('confirms and cancels via the buttons', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="Archive this project?"
        confirmLabel="Archive"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('requires the typed phrase before enabling confirm', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="Delete this project permanently?"
        confirmLabel="Delete"
        requireTyped="DELETE"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'DELETE');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
