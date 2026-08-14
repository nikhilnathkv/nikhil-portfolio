/** Shared lightweight cross-domain types. */

export type { ContentStatus } from '@/lib/admin/project-types';

/** Light project reference embedded in research/experiment payloads. */
export interface ProjectRef {
  id: string;
  title: string;
  slug: string;
}
