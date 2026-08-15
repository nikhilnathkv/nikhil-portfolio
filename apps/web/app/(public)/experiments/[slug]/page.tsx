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
  const description = experiment.hypothesis ?? undefined;
  const path = `/experiments/${experiment.slug}`;
  return {
    title: experiment.title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'article', title: experiment.title, description, url: path },
  };
}

export default async function PublicExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experiment = await getPublishedExperiment(slug);
  if (!experiment) notFound();
  return <ExperimentView experiment={experiment} />;
}
