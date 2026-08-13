import { apiFetch } from '@/lib/api';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
}

/**
 * Fetch the API health status. Returns `null` instead of throwing so the UI can
 * render a graceful "API unreachable" state during local development.
 */
export async function getApiHealth(): Promise<HealthStatus | null> {
  try {
    return await apiFetch<HealthStatus>('/health', { cache: 'no-store' });
  } catch {
    return null;
  }
}
