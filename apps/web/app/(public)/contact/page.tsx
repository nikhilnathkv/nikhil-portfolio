import type { Metadata } from 'next';

import { StubPage } from '@/components/public/StubPage';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactIndexPage() {
  return (
    <StubPage
      eyebrow="Say hello"
      title="Contact"
      intro="Get in touch about roles, collaboration, or questions."
      milestone="M4.6"
    />
  );
}
