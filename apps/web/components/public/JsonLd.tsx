import { SITE } from '@/lib/site';

/**
 * JSON-LD structured data for the homepage: a Person and a WebSite. Only real
 * data is emitted (no fabricated fields). Rendered as a script tag; the CSP
 * allows inline scripts.
 */
export function PersonWebSiteJsonLd({
  name,
  role,
  sameAs,
}: {
  name: string;
  role: string;
  sameAs: string[];
}) {
  const graph = [
    {
      '@type': 'Person',
      '@id': `${SITE.url}/#person`,
      name,
      jobTitle: role,
      url: SITE.url,
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      publisher: { '@id': `${SITE.url}/#person` },
    },
  ];
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
