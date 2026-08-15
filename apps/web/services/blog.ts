import { apiFetch } from '@/lib/api';
import type { BlogPost, BlogPostListItem } from '@/lib/admin/blog-types';

/** List published posts from the public API. Returns `[]` on error. */
export async function listPosts(): Promise<BlogPostListItem[]> {
  try {
    return await apiFetch<BlogPostListItem[]>('/blog', { cache: 'no-store' });
  } catch {
    return [];
  }
}

/** Fetch a published post by slug from the public API. Null if missing/unpublished. */
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  try {
    return await apiFetch<BlogPost>(`/blog/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
