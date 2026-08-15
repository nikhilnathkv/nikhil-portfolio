import { apiFetch } from '@/lib/api';
import type { Experiment, ExperimentListItem } from '@/lib/admin/experiment-types';

/** List published experiments from the public API. Returns `[]` on error. */
export async function listExperiments(): Promise<ExperimentListItem[]> {
  try {
    return await apiFetch<ExperimentListItem[]>('/experiments', { cache: 'no-store' });
  } catch {
    return [];
  }
}

export async function getPublishedExperiment(slug: string): Promise<Experiment | null> {
  try {
    return await apiFetch<Experiment>(`/experiments/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
