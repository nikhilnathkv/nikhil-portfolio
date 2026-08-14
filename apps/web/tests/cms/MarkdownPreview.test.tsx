import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';

describe('MarkdownPreview', () => {
  it('renders headings and GFM tables', () => {
    render(<MarkdownPreview content={'# Title\n\n| A | B |\n| - | - |\n| 1 | 2 |'} />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('does not render raw HTML (injection-safe)', () => {
    const { container } = render(
      <MarkdownPreview content={'Hello <script>alert(1)</script> <b>bold?</b>'} />,
    );
    // The raw tags are escaped to text, not turned into elements.
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<b>bold?</b>');
  });
});
