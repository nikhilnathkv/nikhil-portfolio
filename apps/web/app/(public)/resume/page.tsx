import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Resume' };

export default function ResumeIndexPage() {
  return (
    <StubPage
      eyebrow="CV"
      title="Resume"
      intro="View or download the latest resume."
      milestone="M4.6"
    />
  );
}
