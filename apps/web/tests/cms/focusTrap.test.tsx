import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

function View({ open }: { open: boolean }) {
  return (
    <>
      <button type="button">trigger</button>
      <ConfirmDialog open={open} title="Confirm" onConfirm={() => {}} onCancel={() => {}} />
    </>
  );
}

describe('ConfirmDialog focus management', () => {
  it('traps focus while open and returns it to the trigger on close', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<View open={false} />);

    // Focus the trigger, then open the dialog.
    const trigger = screen.getByRole('button', { name: 'trigger' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(<View open />);

    // Focus moved into the dialog and Tab stays trapped inside it.
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Closing returns focus to the trigger.
    rerender(<View open={false} />);
    expect(document.activeElement).toBe(trigger);
  });
});
