import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PublicNav } from '@/components/public/PublicNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects',
}));

describe('PublicNav', () => {
  it('marks the current section link as active', () => {
    render(<PublicNav siteName="Test Name" />);
    const projects = screen.getByRole('link', { name: 'Projects' });
    expect(projects).toHaveAttribute('aria-current', 'page');
    // A non-current link is not marked active.
    expect(screen.getByRole('link', { name: 'Writing' })).not.toHaveAttribute('aria-current');
  });

  it('opens the mobile drawer, traps focus, and closes on Escape returning focus', async () => {
    const user = userEvent.setup();
    render(<PublicNav siteName="Test Name" />);

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    toggle.focus();
    await user.click(toggle);

    // Drawer is open and focus moved into it.
    const dialog = screen.getByRole('dialog', { name: 'Site menu' });
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Tab stays trapped within the drawer.
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Escape closes the drawer and returns focus to the toggle.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Site menu' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open menu' }));
  });
});
