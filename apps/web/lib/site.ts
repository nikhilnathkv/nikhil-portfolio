/**
 * Public site constants. `url` is the canonical production origin used for
 * metadataBase (canonical + OpenGraph URLs); override with NEXT_PUBLIC_SITE_URL
 * per environment. No trailing slash.
 */
export const SITE = {
  name: 'Nikhil Nath',
  title: 'Nikhil Nath — AI/ML Engineer',
  description:
    'AI/ML engineer building production-grade intelligent systems across GenAI, agentic AI, machine learning, and data platforms.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;
