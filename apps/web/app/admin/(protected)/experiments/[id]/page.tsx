import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ExperimentEditor } from '@/components/admin/experiments/ExperimentEditor';
import { getAdminExperiment } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Edit Experiment' };

export default async function EditExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experiment = await getAdminExperiment(id);
  if (!experiment) notFound();
  return <ExperimentEditor initial={experiment} />;
}
