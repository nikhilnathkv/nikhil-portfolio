/** Admin/auth types mirroring the API JSON (snake_case). */

export type UserRole = 'admin' | 'editor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface ContentCounts {
  total: number;
  published: number;
  drafts: number;
}

export interface DashboardSummary {
  projects: ContentCounts;
  blog: ContentCounts;
  research: number;
  experiments: number;
  unread_messages: number;
}
