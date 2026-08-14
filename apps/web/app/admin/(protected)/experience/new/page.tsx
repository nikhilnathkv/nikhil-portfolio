import type { Metadata } from 'next';

import { ExperienceEditor } from '@/components/admin/experience/ExperienceEditor';

export const metadata: Metadata = { title: 'New Experience' };

export default function NewExperiencePage() {
  return <ExperienceEditor />;
}
