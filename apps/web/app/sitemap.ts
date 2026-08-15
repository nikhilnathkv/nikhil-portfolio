import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';
import { listPosts } from '@/services/blog';
import { listExperiments } from '@/services/experiments';
import { listProjects } from '@/services/projects';
import { listResearch } from '@/services/research';

/**
 * Sitemap of public, published content only. Admin / API / preview and any
 * draft content are excluded by construction (the public services return
 * published items). Dynamic entries use each item's updated_at as lastModified.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, research, experiments] = await Promise.all([
    listProjects(),
    listPosts(),
    listResearch(),
    listExperiments(),
  ]);

  const url = (path: string) => `${SITE.url}${path}`;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: url('/projects'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/experience'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/writing'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/research'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: url('/experiments'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: url('/resume'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const dynamic: MetadataRoute.Sitemap = [
    ...projects.map((p) => ({
      url: url(`/projects/${p.slug}`),
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: url(`/writing/${p.slug}`),
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...research.map((r) => ({
      url: url(`/research/${r.slug}`),
      lastModified: new Date(r.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...experiments.map((e) => ({
      url: url(`/experiments/${e.slug}`),
      lastModified: new Date(e.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...dynamic];
}
