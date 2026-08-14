import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatCard } from '@/components/admin/StatCard';

describe('StatCard', () => {
  it('renders label, value and hint', () => {
    render(<StatCard label="Projects" value={4} hint="3 published · 1 draft" />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3 published · 1 draft')).toBeInTheDocument();
  });
});
