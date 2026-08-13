/**
 * Core domain entities, mirroring the PostgreSQL schema documented in
 * docs/architecture/database.md. Kept intentionally minimal for M1; fields are
 * added as each entity's endpoints come online in later milestones.
 */

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Profile {
  id: string;
  name: string;
  headline: string;
  shortBio: string;
  longBio: string;
  location: string;
  email: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  status: ContentStatus;
  featured: boolean;
  githubUrl?: string;
  liveUrl?: string;
  publishedAt?: string;
}

export interface ProjectMetric {
  id: string;
  projectId: string;
  name: string;
  value: string;
  unit?: string;
  description?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  featured: boolean;
  displayOrder: number;
}
