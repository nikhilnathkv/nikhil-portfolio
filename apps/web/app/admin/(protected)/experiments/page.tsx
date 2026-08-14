import type { Metadata } from 'next';
import Link from 'next/link';

import { ExperimentListClient } from '@/components/admin/experiments/ExperimentListClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Experiments' };

export default function ExperimentsPage() {
  return (
    <>
      <PageHeader
        title="Experiments"
        description="What you tested and what you learned."
        action={
          <Link
            href="/admin/experiments/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + New Experiment
          </Link>
        }
      />
      <ExperimentListClient />
    </>
  );
}
