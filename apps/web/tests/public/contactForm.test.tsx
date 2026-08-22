import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContactForm } from '@/components/public/ContactForm';

afterEach(() => vi.restoreAllMocks());

function fill() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Recruiter' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'r@example.com' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there' } });
}

describe('ContactForm', () => {
  it('submits and shows a success state', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 201 }));
    render(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(screen.getByText(/Message sent/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({ method: 'POST' }),
    );
    // Honeypot is sent in the payload.
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toHaveProperty('honeypot');
  });

  it('shows an error when required fields are missing', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    render(<ContactForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an error when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));
    render(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
