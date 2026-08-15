import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button, ButtonLink, SectionHeading } from '@/components/public';
import { ProjectCard } from '@/components/public/cards';

describe('Button / ButtonLink', () => {
  it('renders a button element with the given label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders an internal link (no new tab) for a relative href', () => {
    render(<ButtonLink href="/projects">View</ButtonLink>);
    const link = screen.getByRole('link', { name: 'View' });
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).not.toHaveAttribute('target');
  });

  it('opens external links safely in a new tab', () => {
    render(<ButtonLink href="https://example.com">External</ButtonLink>);
    const link = screen.getByRole('link', { name: 'External' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});

describe('SectionHeading', () => {
  it('renders eyebrow, title at the requested level, and intro', () => {
    render(<SectionHeading as="h1" eyebrow="Work" title="Projects" intro="Case studies." />);
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Case studies.')).toBeInTheDocument();
  });
});

describe('ProjectCard (CardLink)', () => {
  it('exposes a single link whose accessible name is the title', () => {
    render(<ProjectCard slug="my-project" title="My Project" summary="A summary." />);
    const link = screen.getByRole('link', { name: 'My Project' });
    expect(link).toHaveAttribute('href', '/projects/my-project');
    expect(screen.getByRole('heading', { name: 'My Project' })).toBeInTheDocument();
  });
});
