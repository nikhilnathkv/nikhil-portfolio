/** Experience types mirroring the API JSON (snake_case). */

export interface ProjectRef {
  id: string;
  title: string;
  slug: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string | null;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string | null;
  is_current: boolean;
  summary: string | null;
  description: string | null;
  display_order: number;
  projects: ProjectRef[];
  created_at: string;
  updated_at: string;
}

export interface ExperienceWritePayload {
  company: string;
  role: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  summary?: string | null;
  description?: string | null;
  display_order?: number;
  project_ids?: string[];
}
