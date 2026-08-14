import type { Metadata } from 'next';

import { BlogEditor } from '@/components/admin/blog/BlogEditor';

export const metadata: Metadata = { title: 'New Article' };

export default function NewBlogPage() {
  return <BlogEditor />;
}
