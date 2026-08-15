import { apiFetch } from '@/lib/api';
import type { Research, ResearchListItem } from '@/lib/admin/research-types';

/** List published research from the public API. Returns `[]` on error. */
export async function listResearch(): Promise<ResearchListItem[]> {
  try {
    return await apiFetch<ResearchListItem[]>('/research', { cache: 'no-store' });
  } catch {
    return [];
  }
}

export async function getPublishedResearch(slug: string): Promise<Research | null> {
  try {
    return await apiFetch<Research>(`/research/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
