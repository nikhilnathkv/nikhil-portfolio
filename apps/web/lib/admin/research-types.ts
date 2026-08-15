import type { ContentRef } from '@/lib/admin/project-types';
import type { ContentStatus, ProjectRef } from '@/lib/admin/project-refs';

export interface ResearchListItem {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  project_id: string | null;
  project: ProjectRef | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Research {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  research_question: string | null;
  methodology: string | null;
  dataset: string | null;
  experimental_setup: string | null;
  results: string | null;
  analysis: string | null;
  limitations: string | null;
  conclusion: string | null;
  references: string | null;
  paper_url: string | null;
  publication_url: string | null;
  github_url: string | null;
  project_id: string | null;
  project: ProjectRef | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  related_experiments: ContentRef[];
}

export interface ResearchWritePayload {
  title: string;
  slug?: string;
  abstract?: string | null;
  research_question?: string | null;
  methodology?: string | null;
  dataset?: string | null;
  experimental_setup?: string | null;
  results?: string | null;
  analysis?: string | null;
  limitations?: string | null;
  conclusion?: string | null;
  references?: string | null;
  paper_url?: string | null;
  publication_url?: string | null;
  github_url?: string | null;
  project_id?: string | null;
}
