import { apiFetch } from '@/lib/api';
import type { Project, ProjectListItem } from '@/lib/admin/project-types';

/** List published projects from the public API. Returns `[]` on error. */
export async function listProjects(): Promise<ProjectListItem[]> {
  try {
    return await apiFetch<ProjectListItem[]>('/projects', { cache: 'no-store' });
  } catch {
    return [];
  }
}

/**
 * Fetch a single published project by slug from the public API. Returns `null`
 * for missing / unpublished projects (the API 404s and `apiFetch` throws).
 */
export async function getPublishedProject(slug: string): Promise<Project | null> {
  try {
    return await apiFetch<Project>(`/projects/${slug}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}
