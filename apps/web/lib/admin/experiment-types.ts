import type { ContentRef, ProjectMetric } from '@/lib/admin/project-types';
import type { ContentStatus, ProjectRef } from '@/lib/admin/project-refs';

export interface ExperimentListItem {
  id: string;
  title: string;
  slug: string;
  hypothesis: string | null;
  project_id: string | null;
  project: ProjectRef | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface Experiment {
  id: string;
  title: string;
  slug: string;
  hypothesis: string | null;
  method: string | null;
  setup: string | null;
  approach: string | null;
  results: string | null;
  learnings: string | null;
  conclusion: string | null;
  project_id: string | null;
  project: ProjectRef | null;
  github_url: string | null;
  status: ContentStatus;
  metrics: ProjectMetric[];
  created_at: string;
  updated_at: string;
  related_research: ContentRef[];
}

export interface ExperimentWritePayload {
  title: string;
  slug?: string;
  hypothesis?: string | null;
  method?: string | null;
  setup?: string | null;
  approach?: string | null;
  results?: string | null;
  learnings?: string | null;
  conclusion?: string | null;
  project_id?: string | null;
  github_url?: string | null;
  metrics?: Omit<ProjectMetric, 'id'>[];
}
