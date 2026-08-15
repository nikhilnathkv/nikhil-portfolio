import type { Metadata } from 'next';

import { ButtonLink, Container, Section, SectionHeading } from '@/components/public';
import { TimelineRole } from '@/components/public/experience/TimelineRole';
import { listExperience } from '@/services/experience';

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Where I have applied AI/ML in production — a timeline of roles across consulting and enterprise environments, with the systems built along the way.',
  alternates: { canonical: '/experience' },
  openGraph: {
    title: 'Experience · Nikhil Nath',
    description: 'A timeline of AI/ML roles across consulting and enterprise environments.',
    url: '/experience',
  },
};

export default async function ExperiencePage() {
  const roles = await listExperience();

  return (
    <Section className="pt-16 sm:pt-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Career"
          title="Experience"
          intro="Where I've applied AI/ML in production — across consulting and enterprise environments. Each role links to the case studies built along the way."
        />

        {roles.length > 0 ? (
          <ol className="mt-14 max-w-3xl">
            {roles.map((role) => (
              <TimelineRole key={role.id} role={role} />
            ))}
          </ol>
        ) : (
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-pub-muted">
            My professional history is being written up here shortly.
          </p>
        )}

        <div className="mt-16 flex flex-wrap gap-3 border-t border-pub-border pt-10">
          <ButtonLink href="/resume">View resume</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Get in touch
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
