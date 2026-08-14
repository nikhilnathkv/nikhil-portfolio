import type { Metadata } from 'next';
import Link from 'next/link';

import { ResearchListClient } from '@/components/admin/research/ResearchListClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Research' };

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        title="Research"
        description="Your research write-ups and papers."
        action={
          <Link
            href="/admin/research/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + New Research
          </Link>
        }
      />
      <ResearchListClient />
    </>
  );
}
