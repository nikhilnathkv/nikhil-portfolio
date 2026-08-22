import type { Metadata } from 'next';

import { Container, ResearchCard, Section, SectionHeading } from '@/components/public';
import { listResearch } from '@/services/research';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Investigations, benchmarks and findings across retrieval, evaluation and ML — the questions I looked into and what the data showed.',
  alternates: { canonical: '/research' },
  openGraph: {
    title: 'Research · Nikhil Nath',
    description: 'Investigations, benchmarks and findings across AI/ML.',
    url: '/research',
  },
};

export default async function ResearchIndexPage() {
  const items = await listResearch();
  return (
    <Section className="pt-16 sm:pt-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Research"
          title="Investigations & findings"
          intro="I investigate a question, measure it, and report what I found — retrieval strategies, evaluation methods, and ML benchmarks."
        />
        {items.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <ResearchCard
                key={r.id}
                slug={r.slug}
                title={r.title}
                summary={r.abstract}
                publishedAt={r.published_at}
              />
            ))}
          </div>
        ) : (
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-pub-muted">
            I&apos;m currently exploring this area. New research will appear here soon.
          </p>
        )}
      </Container>
    </Section>
  );
}
