import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'About' };

export default function AboutIndexPage() {
  return (
    <StubPage
      eyebrow="Profile"
      title="About"
      intro="Background, focus areas, and how I work."
      milestone="M4.4"
    />
  );
}
