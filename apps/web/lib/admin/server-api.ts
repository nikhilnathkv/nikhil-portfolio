import 'server-only';

import { cookies } from 'next/headers';

import type { BlogPost } from '@/lib/admin/blog-types';
import type { Experience } from '@/lib/admin/experience-types';
import type { Experiment } from '@/lib/admin/experiment-types';
import type { Project } from '@/lib/admin/project-types';
import type { Profile } from '@/lib/admin/profile-types';
import type { Research } from '@/lib/admin/research-types';

/** Generic admin GET by id/slug that unwraps the envelope; null on any failure. */
async function fetchAdmin<T>(path: string): Promise<T | null> {
  try {
    const res = await serverFetch(path);
    if (!res.ok) return null;
    return ((await res.json()) as { data: T }).data;
  } catch {
    return null;
  }
}
import type { DashboardSummary, User } from '@/lib/admin/types';

/** API base for server-side calls (Next server → FastAPI). */
export const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'portfolio_session';

/**
 * Fetch the API from a Server Component / Route Handler, forwarding the caller's
 * session cookie so authenticated admin requests work.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const headers = new Headers(init?.headers);
  if (token) headers.set('cookie', `${SESSION_COOKIE}=${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}

/** The current admin user, or null when the session is missing/invalid/expired. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await serverFetch('/auth/me');
    if (!res.ok) return null;
    const body = (await res.json()) as { data: User };
    return body.data;
  } catch {
    return null;
  }
}

/** Fetch a single project (any status) by id for the admin editor. */
export async function getAdminProject(id: string): Promise<Project | null> {
  try {
    const res = await serverFetch(`/admin/projects/${id}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Project };
    return body.data;
  } catch {
    return null;
  }
}

/** Fetch a project (any status) by slug — used by the authenticated preview. */
export async function getAdminProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const res = await serverFetch(`/admin/projects/by-slug/${slug}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Project };
    return body.data;
  } catch {
    return null;
  }
}

/** Fetch a single experience entry by id for the admin editor. */
export async function getAdminExperience(id: string): Promise<Experience | null> {
  try {
    const res = await serverFetch(`/admin/experience/${id}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Experience };
    return body.data;
  } catch {
    return null;
  }
}

export const getAdminPost = (id: string) => fetchAdmin<BlogPost>(`/admin/blog/${id}`);
export const getAdminPostBySlug = (slug: string) =>
  fetchAdmin<BlogPost>(`/admin/blog/by-slug/${slug}`);

export const getAdminResearch = (id: string) => fetchAdmin<Research>(`/admin/research/${id}`);
export const getAdminResearchBySlug = (slug: string) =>
  fetchAdmin<Research>(`/admin/research/by-slug/${slug}`);

export const getAdminExperiment = (id: string) =>
  fetchAdmin<Experiment>(`/admin/experiments/${id}`);
export const getAdminExperimentBySlug = (slug: string) =>
  fetchAdmin<Experiment>(`/admin/experiments/by-slug/${slug}`);

/** The singleton profile, or null when it hasn't been configured yet (404). */
export async function getAdminProfile(): Promise<Profile | null> {
  try {
    const res = await serverFetch('/admin/profile');
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Profile };
    return body.data;
  } catch {
    return null;
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const res = await serverFetch('/admin/dashboard');
    if (!res.ok) return null;
    const body = (await res.json()) as { data: DashboardSummary };
    return body.data;
  } catch {
    return null;
  }
}
