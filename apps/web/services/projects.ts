import { apiFetch } from '@/lib/api';
import type { Project, ProjectListItem } from '@/lib/admin/project-types';

/** List published projects from the public API. Returns `[]` on error. */
export async function listProjects(
  opts: { featured?: boolean; category?: string } = {},
): Promise<ProjectListItem[]> {
  const params = new URLSearchParams();
  if (opts.featured) params.set('featured', 'true');
  if (opts.category) params.set('category', opts.category);
  const query = params.toString();
  try {
    return await apiFetch<ProjectListItem[]>(`/projects${query ? `?${query}` : ''}`, {
      cache: 'no-store',
    });
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
