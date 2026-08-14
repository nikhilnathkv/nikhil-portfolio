'use client';

import type { ApiError, ApiResponse } from '@nikhil-portfolio/types';
import { isApiError } from '@nikhil-portfolio/types';

/** Pagination metadata as returned by the API envelope (`meta.pagination`). */
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError['error'],
  ) {
    super(body.message);
    this.name = 'AdminApiError';
  }
}

interface Envelope<T> {
  data: T;
  meta?: { pagination?: Pagination };
}

/**
 * Client-side fetch against the authenticated admin proxy (`/api/admin/...`).
 * Returns the full envelope so callers can read pagination when present.
 * Throws {@link AdminApiError} on a non-2xx / error response.
 */
export async function adminRequest<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });

  if (res.status === 204) {
    return { data: undefined as T };
  }

  const payload = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || isApiError(payload)) {
    const error = isApiError(payload)
      ? payload.error
      : { code: 'UNKNOWN_ERROR', message: res.statusText || 'Request failed' };
    throw new AdminApiError(res.status, error);
  }
  return payload as Envelope<T>;
}

/** Convenience wrapper that unwraps `data` for callers that don't need `meta`. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return (await adminRequest<T>(path, init)).data;
}
