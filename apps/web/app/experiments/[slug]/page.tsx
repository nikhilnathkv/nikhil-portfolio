import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ExperimentView } from '@/components/content/ExperimentView';
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
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <ExperimentView experiment={experiment} />
    </main>
  );
}
