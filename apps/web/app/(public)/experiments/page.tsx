import type { Metadata } from 'next';

import { Container, ExperimentCard, Section, SectionHeading } from '@/components/public';
import { listExperiments } from '@/services/experiments';

export const metadata: Metadata = {
  title: 'Experiments',
  description:
    'A technical playground — controlled comparisons, benchmarks and prototypes, with the hypothesis, setup and results for each.',
  alternates: { canonical: '/experiments' },
  openGraph: {
    title: 'Experiments · Nikhil Nath',
    description: 'Controlled comparisons, benchmarks and prototypes.',
    url: '/experiments',
  },
};

export default async function ExperimentsIndexPage() {
  const items = await listExperiments();
  return (
    <Section className="pt-16 sm:pt-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Experiments"
          title="A technical playground"
          intro="Lower-friction than a full project: controlled comparisons and prototypes — the hypothesis, the setup, and what the results showed."
        />
        {items.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <ExperimentCard key={e.id} slug={e.slug} title={e.title} summary={e.hypothesis} />
            ))}
          </div>
        ) : (
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-pub-muted">
            I&apos;m currently exploring this area. New experiments will appear here soon.
          </p>
        )}
      </Container>
    </Section>
  );
}
