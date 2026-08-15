import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PublicNotFound from '@/app/(public)/not-found';
import { CardGridSkeleton } from '@/components/public';

describe('Public not-found', () => {
  it('renders a 404 heading and a link home', () => {
    render(<PublicNotFound />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});

describe('CardGridSkeleton', () => {
  it('exposes a loading status region', () => {
    render(<CardGridSkeleton count={3} />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});
