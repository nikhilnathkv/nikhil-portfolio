import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ExperimentView } from '@/components/content/ExperimentView';
import { Container } from '@/components/public';
import { getPublishedExperiment } from '@/services/experiments';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experiment = await getPublishedExperiment(slug);
  if (!experiment) return { title: 'Experiment not found' };
  return { title: experiment.title, description: experiment.hypothesis ?? undefined };
}

export default async function PublicExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experiment = await getPublishedExperiment(slug);
  if (!experiment) notFound();
  return (
    <Container size="prose" className="py-16">
      <ExperimentView experiment={experiment} />
    </Container>
  );
}
