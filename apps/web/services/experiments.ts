import { apiFetch } from '@/lib/api';
import type { Experiment } from '@/lib/admin/experiment-types';

export async function getPublishedExperiment(slug: string): Promise<Experiment | null> {
  try {
    return await apiFetch<Experiment>(`/experiments/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
