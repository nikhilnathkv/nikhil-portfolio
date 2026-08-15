import { SITE } from '@/lib/site';

/**
 * Article structured data for writing/research detail pages. Emits only real
 * data; the CSP allows inline scripts.
 */
export function ArticleJsonLd({
  title,
  description,
  path,
  publishedAt,
  updatedAt,
  imageUrl,
  type = 'Article',
}: {
  title: string;
  description?: string | null;
  path: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
  type?: 'Article' | 'ScholarlyArticle';
}) {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    headline: title,
    ...(description ? { description } : {}),
    url: `${SITE.url}${path}`,
    mainEntityOfPage: `${SITE.url}${path}`,
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(updatedAt ? { dateModified: updatedAt } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Person', name: SITE.name, url: SITE.url },
  });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
