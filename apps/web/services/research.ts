import { apiFetch } from '@/lib/api';
import type { Research } from '@/lib/admin/research-types';

export async function getPublishedResearch(slug: string): Promise<Research | null> {
  try {
    return await apiFetch<Research>(`/research/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
