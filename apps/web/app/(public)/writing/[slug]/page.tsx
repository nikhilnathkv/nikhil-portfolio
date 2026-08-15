import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleView } from '@/components/content/ArticleView';
import { Container } from '@/components/public';
import { getPublishedPost } from '@/services/blog';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: 'Article not found' };
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
  };
}

export default async function PublicBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  return (
    <Container size="prose" className="py-16">
      <ArticleView post={post} />
    </Container>
  );
}
