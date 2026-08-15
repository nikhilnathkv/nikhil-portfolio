import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

/** Allow public pages; keep the admin, API and preview surfaces out of indexes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/preview'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
