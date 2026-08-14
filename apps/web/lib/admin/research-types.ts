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
  methodology: string | null;
  results: string | null;
  conclusion: string | null;
  paper_url: string | null;
  publication_url: string | null;
  github_url: string | null;
  project_id: string | null;
  project: ProjectRef | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchWritePayload {
  title: string;
  slug?: string;
  abstract?: string | null;
  methodology?: string | null;
  results?: string | null;
  conclusion?: string | null;
  paper_url?: string | null;
  publication_url?: string | null;
  github_url?: string | null;
  project_id?: string | null;
}
