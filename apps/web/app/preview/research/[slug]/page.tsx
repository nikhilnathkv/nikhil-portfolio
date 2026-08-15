import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ResearchView } from '@/components/content/ResearchView';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { getAdminResearchBySlug, getCurrentUser } from '@/lib/admin/server-api';

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default async function ResearchPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const research = await getAdminResearchBySlug(slug);
  if (!research) notFound();

  return (
    <div className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span className="flex items-center gap-2 font-medium">
          Preview <StatusBadge status={research.status} />
        </span>
        <Link href={`/admin/research/${research.id}`} className="font-medium underline">
          Back to editor
        </Link>
      </div>
      <main className="public-theme min-h-dvh bg-pub-bg text-pub-fg">
        <ResearchView research={research} />
      </main>
    </div>
  );
}
