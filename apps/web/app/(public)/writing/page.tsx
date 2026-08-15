import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Writing' };

export default function WritingIndexPage() {
  return (
    <StubPage
      eyebrow="Notes"
      title="Writing"
      intro="Deep-dives and notes on machine-learning engineering, systems, and tooling."
      milestone="M4.5"
    />
  );
}
