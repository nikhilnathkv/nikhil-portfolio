/** Project CMS types mirroring the API JSON (snake_case). */

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  display_order: number;
  featured: boolean;
}

export interface ProjectMetric {
  id?: string;
  name: string;
  value: string;
  unit?: string | null;
  description?: string | null;
  display_order: number;
}

/** Lighter shape returned by the list endpoint. */
export interface ProjectListItem {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  category: string | null;
  status: ContentStatus;
  featured: boolean;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  skills: Skill[];
}

/** Full project as returned by detail/create/update endpoints. */
export interface Project {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  architecture: string | null;
  engineering_decisions: string | null;
  challenges: string | null;
  lessons_learned: string | null;
  category: string | null;
  status: ContentStatus;
  featured: boolean;
  display_order: number;
  github_url: string | null;
  live_url: string | null;
  hero_image_url: string | null;
  architecture_diagram_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metrics: ProjectMetric[];
  skills: Skill[];
}

/** Payload accepted by create/update (subset the editor controls). */
export interface ProjectWritePayload {
  title: string;
  slug?: string;
  short_description: string;
  description?: string | null;
  problem?: string | null;
  solution?: string | null;
  architecture?: string | null;
  engineering_decisions?: string | null;
  challenges?: string | null;
  lessons_learned?: string | null;
  category?: string | null;
  featured?: boolean;
  display_order?: number;
  github_url?: string | null;
  live_url?: string | null;
  hero_image_url?: string | null;
  architecture_diagram_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  skill_ids?: string[];
  metrics?: Omit<ProjectMetric, 'id'>[];
}
