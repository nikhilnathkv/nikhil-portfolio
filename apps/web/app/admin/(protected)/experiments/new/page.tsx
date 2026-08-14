import type { Metadata } from 'next';

import { ExperimentEditor } from '@/components/admin/experiments/ExperimentEditor';

export const metadata: Metadata = { title: 'New Experiment' };

export default function NewExperimentPage() {
  return <ExperimentEditor />;
}
