import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Experience' };

export default function ExperienceIndexPage() {
  return (
    <StubPage
      eyebrow="Career"
      title="Experience"
      intro="Roles, timeline, and the projects behind them."
      milestone="M4.4"
    />
  );
}
