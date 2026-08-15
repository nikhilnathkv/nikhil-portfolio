import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CaseStudyView } from '@/components/projects/CaseStudyView';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { getAdminProjectBySlug, getCurrentUser } from '@/lib/admin/server-api';

// Previews must never be indexed by search engines.
export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Admin-only: the preview can show unpublished drafts.
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const project = await getAdminProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span className="flex items-center gap-2 font-medium">
          Preview <StatusBadge status={project.status} />
        </span>
        <Link href={`/admin/projects/${project.id}`} className="font-medium underline">
          Back to editor
        </Link>
      </div>
      {/* Render inside the public theme so the preview matches the live page exactly. */}
      <main className="public-theme min-h-dvh bg-pub-bg text-pub-fg">
        <CaseStudyView project={project} />
      </main>
    </div>
  );
}
