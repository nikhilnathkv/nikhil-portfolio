import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge } from '@/components/admin/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders the label for each status', () => {
    const { rerender } = render(<StatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    rerender(<StatusBadge status="published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
    rerender(<StatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
