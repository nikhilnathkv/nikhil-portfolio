import { apiFetch } from '@/lib/api';
import type { Profile } from '@/lib/admin/profile-types';

/** Fetch the public profile (site identity, bio, social links). Null on error. */
export async function getProfile(): Promise<Profile | null> {
  try {
    return await apiFetch<Profile>('/profile', { cache: 'no-store' });
  } catch {
    return null;
  }
}
