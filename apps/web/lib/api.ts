import type { ApiError, ApiResponse } from '@nikhil-portfolio/types';
import { isApiError } from '@nikhil-portfolio/types';

/**
 * Base URL for the API. In the browser we use the public URL; on the server
 * (inside docker-compose) we prefer the internal service URL when available.
 */
export const API_BASE_URL =
  (typeof window === 'undefined' ? process.env.API_INTERNAL_URL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8000/api/v1';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError['error'],
  ) {
    super(body.message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Thin typed fetch wrapper that understands the API response envelope and
 * unwraps `data` on success or throws an {@link ApiRequestError} on failure.
 */
export async function apiFetch<TData>(path: string, init?: RequestInit): Promise<TData> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || isApiError(payload)) {
    const error = isApiError(payload)
      ? payload.error
      : { code: 'UNKNOWN_ERROR', message: response.statusText };
    throw new ApiRequestError(response.status, error);
  }

  return payload.data;
}
