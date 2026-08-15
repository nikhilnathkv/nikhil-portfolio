import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleJsonLd } from '@/components/content/ContentJsonLd';
import { ResearchView } from '@/components/content/ResearchView';
import { TrackView } from '@/components/public';
import { getPublishedResearch } from '@/services/research';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const research = await getPublishedResearch(slug);
  if (!research) return { title: 'Research not found' };
  const description = research.abstract ?? undefined;
  const path = `/research/${research.slug}`;
  return {
    title: research.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: research.title,
      description,
      url: path,
      publishedTime: research.published_at ?? undefined,
      modifiedTime: research.updated_at,
      authors: ['Nikhil Nath'],
    },
  };
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
    <>
      <TrackView event="research_view" props={{ slug: research.slug }} />
      <ArticleJsonLd
        type="ScholarlyArticle"
        title={research.title}
        description={research.abstract}
        path={`/research/${research.slug}`}
        publishedAt={research.published_at}
        updatedAt={research.updated_at}
      />
      <ResearchView research={research} />
    </>
  );
}
