import type { Metadata } from 'next';

import { ProjectEditor } from '@/components/admin/projects/ProjectEditor';

export const metadata: Metadata = { title: 'New Project' };

export default function NewProjectPage() {
  return <ProjectEditor />;
}
