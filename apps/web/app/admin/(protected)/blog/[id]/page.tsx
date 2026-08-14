import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogEditor } from '@/components/admin/blog/BlogEditor';
import { getAdminPost } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Edit Article' };

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();
  return <BlogEditor initial={post} />;
}
