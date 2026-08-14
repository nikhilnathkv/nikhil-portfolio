import Link from 'next/link';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import type { Experiment } from '@/lib/admin/experiment-types';

function ProseSection({ title, body }: { title: string; body: string | null }) {
  if (!body || !body.trim()) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <MarkdownPreview content={body} />
    </section>
  );
}

/** Shared experiment renderer — used by admin preview and the public page. */
export function ExperimentView({ experiment }: { experiment: Experiment }) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-foreground/50">Experiment</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{experiment.title}</h1>
        {experiment.project ? (
          <p className="text-sm text-foreground/60">
            Behind{' '}
            <Link href={`/projects/${experiment.project.slug}`} className="underline">
              {experiment.project.title}
            </Link>
          </p>
        ) : null}
        {experiment.github_url ? (
          <div>
            <a
              href={experiment.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md border border-foreground/15 px-3 py-1.5 text-sm font-medium text-foreground/80 hover:border-foreground/40"
            >
              Code ↗
            </a>
          </div>
        ) : null}
      </header>

      <ProseSection title="Hypothesis" body={experiment.hypothesis} />
      <ProseSection title="Method" body={experiment.method} />

      {experiment.metrics.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">Results</h2>
          <div className="overflow-x-auto rounded-xl border border-foreground/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/10 text-xs uppercase tracking-wider text-foreground/50">
                  <th className="px-4 py-2 font-semibold">Metric</th>
                  <th className="px-4 py-2 font-semibold">Value</th>
                  <th className="px-4 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {experiment.metrics.map((m) => (
                  <tr key={m.id ?? m.name} className="border-b border-foreground/5 last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-2 text-foreground/80">
                      {m.value}
                      {m.unit ? ` ${m.unit}` : ''}
                    </td>
                    <td className="px-4 py-2 text-foreground/50">{m.description ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ProseSection title="Results" body={experiment.results} />
      <ProseSection title="Conclusion" body={experiment.conclusion} />
    </article>
  );
}
