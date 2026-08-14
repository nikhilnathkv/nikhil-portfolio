import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProjectEditor } from '@/components/admin/projects/ProjectEditor';
import { getAdminProject } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Edit Project' };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();
  return <ProjectEditor initial={project} />;
}
