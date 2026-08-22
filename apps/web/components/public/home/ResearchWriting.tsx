import Link from 'next/link';

import type { BlogPostListItem } from '@/lib/admin/blog-types';
import type { ResearchListItem } from '@/lib/admin/research-types';

import { Container, Eyebrow, Section } from '@/components/public';

function PreviewList({
  eyebrow,
  items,
  cta,
  ctaHref,
}: {
  eyebrow: string;
  items: { key: string; href: string; title: string; sub?: string | null }[];
  cta: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Eyebrow>{eyebrow}</Eyebrow>
      {items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-pub-border border-y border-pub-border">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group flex flex-col gap-1 py-4 transition-colors [transition-duration:var(--pub-duration)] hover:text-pub-fg"
              >
                <span className="text-base font-medium text-pub-fg">{item.title}</span>
                {item.sub ? (
                  <span className="line-clamp-1 text-sm text-pub-muted">{item.sub}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-pub-muted">More coming soon.</p>
      )}
      <div>
        <Link
          href={ctaHref}
          className="font-mono text-xs text-pub-accent hover:text-pub-accent-hover"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

/**
 * Signals that I don't only build things — I think about them. Two columns:
 * research and writing, a few items each.
 */
export function ResearchWriting({
  research,
  writing,
}: {
  research: ResearchListItem[];
  writing: BlogPostListItem[];
}) {
  if (research.length === 0 && writing.length === 0) return null;
  return (
    <Section className="border-t border-pub-border">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <PreviewList
            eyebrow="Research"
            cta="View research"
            ctaHref="/research"
            items={research.slice(0, 3).map((r) => ({
              key: r.id,
              href: `/research/${r.slug}`,
              title: r.title,
              sub: r.abstract,
            }))}
          />
          <PreviewList
            eyebrow="Writing"
            cta="Read articles"
            ctaHref="/writing"
            items={writing.slice(0, 3).map((w) => ({
              key: w.id,
              href: `/writing/${w.slug}`,
              title: w.title,
              sub: w.excerpt,
            }))}
          />
        </div>
      </Container>
    </Section>
  );
}
