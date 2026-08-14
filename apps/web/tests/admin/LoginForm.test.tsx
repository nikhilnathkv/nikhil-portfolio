import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/components/admin/LoginForm';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
    vi.unstubAllGlobals();
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const password = screen.getByPlaceholderText('••••••••••••');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows a generic error when the API rejects the credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: { message: 'Invalid email or password' } }),
      })),
    );
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects to the dashboard on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ data: {} }) })),
    );
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'AdminPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/dashboard'));
  });
});
