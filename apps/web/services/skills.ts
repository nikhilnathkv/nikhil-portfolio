import { apiFetch } from '@/lib/api';
import type { SkillCategory } from '@/lib/admin/skill-types';

/** List skill categories with nested skills from the public API. `[]` on error. */
export async function listSkills(): Promise<SkillCategory[]> {
  try {
    return await apiFetch<SkillCategory[]>('/skills', { cache: 'no-store' });
  } catch {
    return [];
  }
}
