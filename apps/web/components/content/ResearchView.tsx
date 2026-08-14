import Link from 'next/link';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import type { Research } from '@/lib/admin/research-types';

function ProseSection({ title, body }: { title: string; body: string | null }) {
  if (!body || !body.trim()) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <MarkdownPreview content={body} />
    </section>
  );
}

/** Shared research renderer — used by admin preview and the public page. */
export function ResearchView({ research }: { research: Research }) {
  const links = [
    { label: 'Paper', href: research.paper_url },
    { label: 'Publication', href: research.publication_url },
    { label: 'Code', href: research.github_url },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-foreground/50">Research</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{research.title}</h1>
        {research.project ? (
          <p className="text-sm text-foreground/60">
            Part of{' '}
            <Link href={`/projects/${research.project.slug}`} className="underline">
              {research.project.title}
            </Link>
          </p>
        ) : null}
        {links.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-foreground/15 px-3 py-1.5 text-sm font-medium text-foreground/80 transition hover:border-foreground/40"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <ProseSection title="Abstract" body={research.abstract} />
      <ProseSection title="Methodology" body={research.methodology} />
      <ProseSection title="Results" body={research.results} />
      <ProseSection title="Conclusion" body={research.conclusion} />
    </article>
  );
}
