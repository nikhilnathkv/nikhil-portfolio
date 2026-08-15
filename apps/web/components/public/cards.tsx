import { cn } from './cn';
import { CardLink, Eyebrow, MetricStat, Tag, TagList } from './primitives';
import { PublicImage } from './PublicImage';

/*
 * Content cards for the public list pages. M4.1 ships their structure + styling
 * (unit-tested); each content milestone (M4.3–M4.5) wires them to real data.
 * Props are intentionally minimal/local so cards don't couple to admin types.
 */

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface CardMetric {
  value: string;
  unit?: string | null;
  label: string;
}

/** Project case-study card. */
export function ProjectCard({
  slug,
  title,
  summary,
  category,
  imageUrl,
  imageAlt,
  tags = [],
  metrics = [],
}: {
  slug: string;
  title: string;
  summary: string;
  category?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  tags?: string[];
  metrics?: CardMetric[];
}) {
  const shown = metrics.slice(0, 2);
  return (
    <CardLink href={`/projects/${slug}`} ariaLabel={title} className="flex flex-col gap-4 p-0">
      <PublicImage src={imageUrl} alt={imageAlt ?? title} aspect="video" className="rounded-b-none" />
      <div className="flex flex-1 flex-col gap-3 p-6 pt-2">
        {category ? <Eyebrow>{category}</Eyebrow> : null}
        <h3 className="text-xl font-semibold tracking-tight text-pub-fg">{title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-pub-muted">{summary}</p>
        {tags.length > 0 ? <TagList tags={tags.slice(0, 4)} className="relative z-10" /> : null}
        {shown.length > 0 ? (
          <dl className="mt-auto flex flex-wrap gap-x-8 gap-y-3 pt-2">
            {shown.map((m) => (
              <div key={m.label} className="flex flex-col">
                <dt className="sr-only">{m.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight text-pub-fg">
                  {m.value}
                  {m.unit ? <span className="ml-0.5 text-base text-pub-muted">{m.unit}</span> : null}
                </dd>
                <span aria-hidden className="text-xs text-pub-subtle">
                  {m.label}
                </span>
              </div>
            ))}
          </dl>
        ) : null}
        <span className="mt-1 font-mono text-xs text-pub-accent">View case study →</span>
      </div>
    </CardLink>
  );
}

/** Blog / writing article card. */
export function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  publishedAt,
  tags = [],
}: {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  tags?: string[];
}) {
  const date = formatDate(publishedAt);
  return (
    <CardLink href={`/writing/${slug}`} ariaLabel={title} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {category ? <Eyebrow>{category}</Eyebrow> : null}
        {date ? <span className="font-mono text-xs text-pub-subtle">{date}</span> : null}
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-pub-fg">{title}</h3>
      {excerpt ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-pub-muted">{excerpt}</p>
      ) : null}
      {tags.length > 0 ? <TagList tags={tags.slice(0, 4)} className="relative z-10" /> : null}
    </CardLink>
  );
}

/** Research entry card. */
export function ResearchCard({
  slug,
  title,
  summary,
  publishedAt,
}: {
  slug: string;
  title: string;
  summary?: string | null;
  publishedAt?: string | null;
}) {
  const date = formatDate(publishedAt);
  return (
    <CardLink href={`/research/${slug}`} ariaLabel={title} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Eyebrow>Research</Eyebrow>
        {date ? <span className="font-mono text-xs text-pub-subtle">{date}</span> : null}
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-pub-fg">{title}</h3>
      {summary ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-pub-muted">{summary}</p>
      ) : null}
    </CardLink>
  );
}

/** Experiment card, optionally surfacing a headline metric. */
export function ExperimentCard({
  slug,
  title,
  summary,
  headlineMetric,
}: {
  slug: string;
  title: string;
  summary?: string | null;
  headlineMetric?: { value: string; label: string; unit?: string | null };
}) {
  return (
    <CardLink href={`/experiments/${slug}`} ariaLabel={title} className="flex flex-col gap-4">
      <Eyebrow>Experiment</Eyebrow>
      <h3 className="text-xl font-semibold tracking-tight text-pub-fg">{title}</h3>
      {summary ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-pub-muted">{summary}</p>
      ) : null}
      {headlineMetric ? (
        <MetricStat
          value={headlineMetric.value}
          unit={headlineMetric.unit}
          label={headlineMetric.label}
        />
      ) : null}
    </CardLink>
  );
}

/** Timeline entry for the experience list (not a link card by default). */
export function ExperienceItem({
  company,
  role,
  startDate,
  endDate,
  summary,
  current = false,
  className,
}: {
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  summary?: string | null;
  current?: boolean;
  className?: string;
}) {
  const start = formatDate(startDate);
  const end = current ? 'Present' : formatDate(endDate);
  return (
    <div className={cn('flex flex-col gap-2 border-l border-pub-border pl-6', className)}>
      <span className="font-mono text-xs text-pub-subtle">
        {start}
        {end ? ` — ${end}` : ''}
      </span>
      <h3 className="text-lg font-semibold text-pub-fg">
        {role} <span className="text-pub-muted">· {company}</span>
      </h3>
      {summary ? <p className="text-sm leading-relaxed text-pub-muted">{summary}</p> : null}
    </div>
  );
}

/** A named group of skill tags. */
export function SkillGroup({
  category,
  skills,
  className,
}: {
  category: string;
  skills: string[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Eyebrow>{category}</Eyebrow>
      <ul className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <li key={s}>
            <Tag>{s}</Tag>
          </li>
        ))}
      </ul>
    </div>
  );
}
