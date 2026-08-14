/** Skill / category types mirroring the API JSON (snake_case). */

import type { Skill } from '@/lib/admin/project-types';

export type { Skill };

export interface SkillCategory {
  id: string;
  name: string;
  display_order: number;
  skills: Skill[];
}
