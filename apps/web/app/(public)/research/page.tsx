import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Research' };

export default function ResearchIndexPage() {
  return (
    <StubPage
      eyebrow="Findings"
      title="Research"
      intro="Papers, findings, and ongoing investigations."
      milestone="M4.5"
    />
  );
}
