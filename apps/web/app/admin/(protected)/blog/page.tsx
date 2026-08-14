import type { Metadata } from 'next';
import Link from 'next/link';

import { BlogListClient } from '@/components/admin/blog/BlogListClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  return (
    <>
      <PageHeader
        title="Blog"
        description="Your technical writing."
        action={
          <Link
            href="/admin/blog/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + New Article
          </Link>
        }
      />
      <BlogListClient />
    </>
  );
}
