import type { ContentStatus } from '@/lib/admin/project-types';

/** Category vocabulary for projects (stored as a free string on the API). */
export const CATEGORIES = [
  'GenAI',
  'Agentic AI',
  'Machine Learning',
  'Time Series',
  'Computer Vision',
  'MLOps',
  'Data Engineering',
  'Other',
] as const;

export const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'created_at', label: 'Recently created' },
  { value: 'display_order', label: 'Display order' },
  { value: 'published_at', label: 'Recently published' },
];

export const MAX_SHORT_DESCRIPTION = 200;

/** Client-side slug generation, mirroring the API's slugify policy. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
