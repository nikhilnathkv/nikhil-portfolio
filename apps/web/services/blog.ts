import { apiFetch } from '@/lib/api';
import type { BlogPost } from '@/lib/admin/blog-types';

/** Fetch a published post by slug from the public API. Null if missing/unpublished. */
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  try {
    return await apiFetch<BlogPost>(`/blog/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
