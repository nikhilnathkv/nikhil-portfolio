import Link from 'next/link';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import { Eyebrow } from '@/components/public';
import type { Experience } from '@/lib/admin/experience-types';
import { formatDateRange } from '@/lib/format';

/**
 * One role on the experience timeline. Achievement-oriented: a short summary
 * lead, the Markdown `description` (great for a "Selected impact" bullet list),
 * and links to the case studies built during the role.
 */
export function TimelineRole({ role }: { role: Experience }) {
  const range = formatDateRange(role.start_date, role.end_date, role.is_current);
  return (
    <li id={`exp-${role.id}`} className="relative scroll-mt-24 border-l border-pub-border pb-14 pl-8 last:pb-0">
      {/* node */}
      <span
        aria-hidden
        className="absolute -left-[6.5px] top-1.5 h-3 w-3 rounded-full border-2 border-pub-bg bg-pub-accent"
      />
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-pub-accent">
          {range}
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-pub-fg">{role.role}</h2>
          <p className="text-pub-muted">
            {role.company}
            {role.location ? <span className="text-pub-subtle"> · {role.location}</span> : null}
          </p>
        </div>

        {role.summary ? (
          <p className="max-w-2xl text-pretty leading-relaxed text-pub-muted">{role.summary}</p>
        ) : null}

        {role.description?.trim() ? (
          <div className="max-w-2xl">
            <MarkdownPreview content={role.description} />
          </div>
        ) : null}

        {role.projects.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            <Eyebrow>Selected work from this role</Eyebrow>
            <ul className="flex flex-col gap-1.5">
              {role.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="text-pub-fg transition-colors [transition-duration:var(--pub-duration)] hover:text-pub-accent"
                  >
                    {p.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
}
