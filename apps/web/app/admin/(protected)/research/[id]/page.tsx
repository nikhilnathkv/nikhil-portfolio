import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ResearchEditor } from '@/components/admin/research/ResearchEditor';
import { getAdminResearch } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Edit Research' };

export default async function EditResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const research = await getAdminResearch(id);
  if (!research) notFound();
  return <ResearchEditor initial={research} />;
}
