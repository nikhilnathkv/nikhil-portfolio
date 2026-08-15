import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleView } from '@/components/content/ArticleView';
import { ArticleJsonLd } from '@/components/content/ContentJsonLd';
import { TrackView } from '@/components/public';
import { getPublishedPost } from '@/services/blog';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: 'Article not found' };
  const title = post.seo_title ?? post.title;
  const description = post.seo_description ?? post.excerpt ?? undefined;
  const path = `/writing/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: ['Nikhil Nath'],
      ...(post.cover_image?.url ? { images: [{ url: post.cover_image.url }] } : {}),
    },
  };
}

export default async function PublicBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  return (
    <>
      <TrackView event="article_view" props={{ slug: post.slug }} />
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        path={`/writing/${post.slug}`}
        publishedAt={post.published_at}
        updatedAt={post.updated_at}
        imageUrl={post.cover_image?.url}
      />
      <ArticleView post={post} />
    </>
  );
}
