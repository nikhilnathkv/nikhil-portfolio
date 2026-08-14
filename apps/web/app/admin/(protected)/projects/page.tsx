import type { Metadata } from 'next';
import Link from 'next/link';

import { ProjectListClient } from '@/components/admin/projects/ProjectListClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage the technical work showcased on your portfolio."
        action={
          <Link
            href="/admin/projects/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + New Project
          </Link>
        }
      />
      <ProjectListClient />
    </>
  );
}
