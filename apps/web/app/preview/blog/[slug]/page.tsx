import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ArticleView } from '@/components/content/ArticleView';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { getAdminPostBySlug, getCurrentUser } from '@/lib/admin/server-api';

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default async function BlogPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const post = await getAdminPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span className="flex items-center gap-2 font-medium">
          Preview <StatusBadge status={post.status} />
        </span>
        <Link href={`/admin/blog/${post.id}`} className="font-medium underline">
          Back to editor
        </Link>
      </div>
      <main className="px-6 py-12">
        <ArticleView post={post} />
      </main>
    </div>
  );
}
