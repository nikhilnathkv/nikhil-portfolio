import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ExperienceEditor } from '@/components/admin/experience/ExperienceEditor';
import { getAdminExperience } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Edit Experience' };

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experience = await getAdminExperience(id);
  if (!experience) notFound();
  return <ExperienceEditor initial={experience} />;
}
