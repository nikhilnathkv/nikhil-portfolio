import { apiFetch } from '@/lib/api';
import type { Resume } from '@/lib/admin/resume-types';

/** Fetch the active resume from the public API. Null if none / on error. */
export async function getActiveResume(): Promise<Resume | null> {
  try {
    return await apiFetch<Resume>('/resume', { cache: 'no-store' });
  } catch {
    return null;
  }
}
