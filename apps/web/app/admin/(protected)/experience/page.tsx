import type { Metadata } from 'next';
import Link from 'next/link';

import { ExperienceListClient } from '@/components/admin/experience/ExperienceListClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Experience' };

export default function ExperiencePage() {
  return (
    <>
      <PageHeader
        title="Experience"
        description="Your roles and the projects you built in each."
        action={
          <Link
            href="/admin/experience/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Add Experience
          </Link>
        }
      />
      <ExperienceListClient />
    </>
  );
}
