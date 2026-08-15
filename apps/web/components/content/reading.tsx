import Link from 'next/link';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import { Eyebrow } from '@/components/public';
import type { ContentRef } from '@/lib/admin/project-types';
import type { ProjectRef } from '@/lib/admin/project-refs';
import { formatMonthYear } from '@/lib/format';

/**
 * Shared reading primitives for the public writing / research / experiment
 * detail pages. All render inside the public design system and reuse the single
 * sanitized MarkdownPreview (code copy + syntax highlight + KaTeX math).
 */

const AUTHOR = 'Nikhil Nath';
const AUTHOR_ROLE = 'AI / ML Engineer';

/** Author line + published / updated dates + reading time. */
export function ContentMeta({
  publishedAt,
  updatedAt,
  readingMinutes,
}: {
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingMinutes?: number;
}) {
  const published = formatMonthYear(publishedAt);
  const updated = formatMonthYear(updatedAt);
  // Only surface "Updated" when it is a later month than publication.
  const showUpdated = updated && published && updated !== published;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-pub-muted">
      <span className="text-pub-fg">{AUTHOR}</span>
      <span className="text-pub-subtle">· {AUTHOR_ROLE}</span>
      {published ? <span aria-hidden>·</span> : null}
      {published ? <span>{published}</span> : null}
      {showUpdated ? <span className="text-pub-subtle">(updated {updated})</span> : null}
      {readingMinutes ? <span aria-hidden>·</span> : null}
      {readingMinutes ? <span>{readingMinutes} min read</span> : null}
    </div>
  );
}

/** A titled Markdown section that hides itself when there is no content. */
export function ContentSection({
  id,
  title,
  body,
}: {
  id: string;
  title: string;
  body: string | null | undefined;
}) {
  if (!body || !body.trim()) return null;
  return (
    <section id={id} className="scroll-mt-24 border-t border-pub-border pt-8">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight text-pub-fg">{title}</h2>
      <MarkdownPreview content={body} />
    </section>
  );
}

/** Conditional external-link buttons row (only shows links that exist). */
export function ExternalLinks({
  links,
}: {
  links: { label: string; href: string | null | undefined }[];
}) {
  const present = links.filter((l): l is { label: string; href: string } => Boolean(l.href));
  if (present.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {present.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-pub-border-strong px-4 py-2 text-sm font-medium text-pub-fg transition-colors [transition-duration:var(--pub-duration)] hover:bg-pub-surface-2"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}

function RefList({ title, items, hrefBase }: { title: string; items: ContentRef[]; hrefBase: string }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>{title}</Eyebrow>
      <ul className="flex flex-col gap-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <Link
              href={`${hrefBase}/${i.slug}`}
              className="text-pub-fg transition-colors [transition-duration:var(--pub-duration)] hover:text-pub-accent"
            >
              {i.title} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Related-content block: linked project + related research/experiments. */
export function RelatedContent({
  project,
  research = [],
  experiments = [],
}: {
  project?: ProjectRef | null;
  research?: ContentRef[];
  experiments?: ContentRef[];
}) {
  if (!project && research.length === 0 && experiments.length === 0) return null;
  return (
    <section id="related" className="scroll-mt-24 border-t border-pub-border pt-8">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-pub-fg">Related work</h2>
      <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
        {project ? (
          <RefList title="Project" items={[project]} hrefBase="/projects" />
        ) : null}
        <RefList title="Research" items={research} hrefBase="/research" />
        <RefList title="Experiments" items={experiments} hrefBase="/experiments" />
      </div>
    </section>
  );
}
