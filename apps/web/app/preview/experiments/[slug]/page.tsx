import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ExperimentView } from '@/components/content/ExperimentView';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { getAdminExperimentBySlug, getCurrentUser } from '@/lib/admin/server-api';

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default async function ExperimentPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const experiment = await getAdminExperimentBySlug(slug);
  if (!experiment) notFound();

  return (
    <div className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span className="flex items-center gap-2 font-medium">
          Preview <StatusBadge status={experiment.status} />
        </span>
        <Link href={`/admin/experiments/${experiment.id}`} className="font-medium underline">
          Back to editor
        </Link>
      </div>
      <main className="px-6 py-12">
        <ExperimentView experiment={experiment} />
      </main>
    </div>
  );
}
