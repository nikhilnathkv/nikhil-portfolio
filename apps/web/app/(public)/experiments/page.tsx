import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Experiments' };

export default function ExperimentsIndexPage() {
  return (
    <StubPage
      eyebrow="Builds"
      title="Experiments"
      intro="Small builds and measured results — hypotheses tested in code."
      milestone="M4.5"
    />
  );
}
