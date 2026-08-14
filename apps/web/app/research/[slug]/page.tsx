import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ResearchView } from '@/components/content/ResearchView';
import { getPublishedResearch } from '@/services/research';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const research = await getPublishedResearch(slug);
  if (!research) return { title: 'Research not found' };
  return { title: research.title, description: research.abstract ?? undefined };
}

export default async function PublicResearchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const research = await getPublishedResearch(slug);
  if (!research) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <ResearchView research={research} />
    </main>
  );
}
