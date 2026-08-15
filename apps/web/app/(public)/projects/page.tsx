import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsIndexPage() {
  return (
    <StubPage
      eyebrow="Work"
      title="Projects"
      intro="Technical case studies — the problem, the architecture, the decisions, and the measured results."
      milestone="M4.3"
    />
  );
}
