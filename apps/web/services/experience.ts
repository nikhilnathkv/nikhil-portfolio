import { apiFetch } from '@/lib/api';
import type { Experience } from '@/lib/admin/experience-types';

/** List experience entries (most recent first) from the public API. `[]` on error. */
export async function listExperience(): Promise<Experience[]> {
  try {
    return await apiFetch<Experience[]>('/experience', { cache: 'no-store' });
  } catch {
    return [];
  }
}
