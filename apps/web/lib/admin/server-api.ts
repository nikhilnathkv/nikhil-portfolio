import 'server-only';

import { cookies } from 'next/headers';

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
