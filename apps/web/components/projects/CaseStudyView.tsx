import Link from 'next/link';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import { buttonClasses, Container, Eyebrow, MetricStat, TagList, TrackedLink } from '@/components/public';
import { PublicImage } from '@/components/public/PublicImage';
import type { ContentRef, Project } from '@/lib/admin/project-types';

import { ImageLightbox } from './ImageLightbox';

/**
 * Public case-study renderer. Presentation-only: it takes a fully-resolved
 * project and renders a technical case study using the public design system.
 * Shared by the public page and the admin preview (wrapped in `.public-theme`)
 * so the two never drift. Empty sections are hidden gracefully; narrative fields
 * render as sanitized Markdown (MarkdownPreview escapes raw HTML).
 */

interface NarrativeSection {
  id: string;
  label: string;
  body: string;
}

function CaseSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-pub-border pt-8">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight text-pub-fg">{title}</h2>
      {children}
    </section>
  );
}

function RelatedList({
  title,
  items,
  hrefBase,
}: {
  title: string;
  items: ContentRef[];
  hrefBase: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow>{title}</Eyebrow>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`${hrefBase}/${item.slug}`}
              className="text-pub-fg transition-colors [transition-duration:var(--pub-duration)] hover:text-pub-accent"
            >
              {item.title} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CaseStudyView({ project }: { project: Project }) {
  const links = [
    { label: 'Live demo', href: project.live_url },
    { label: 'GitHub', href: project.github_url },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  // Narrative sections, in reading order; only those with content are shown.
  const narrative: NarrativeSection[] = (
    [
      { id: 'overview', label: 'Overview', body: project.description },
      { id: 'problem', label: 'Problem', body: project.problem },
      { id: 'solution', label: 'Solution', body: project.solution },
      { id: 'engineering', label: 'Engineering decisions', body: project.engineering_decisions },
      { id: 'evaluation', label: 'Evaluation', body: project.evaluation },
      { id: 'results', label: 'Results', body: project.results },
      { id: 'challenges', label: 'Challenges', body: project.challenges },
      { id: 'lessons', label: 'Lessons learned', body: project.lessons_learned },
    ] as { id: string; label: string; body: string | null }[]
  ).filter((s): s is NarrativeSection => Boolean(s.body && s.body.trim()));

  const hasArchitecture = Boolean(project.architecture?.trim() || project.architecture_diagram_url);
  const hasMetrics = project.metrics.length > 0;
  const hasRelated =
    project.related_research.length > 0 || project.related_experiments.length > 0;

  // On-this-page nav entries (only sections that exist).
  const toc: { id: string; label: string }[] = [];
  if (hasMetrics) toc.push({ id: 'metrics', label: 'Metrics' });
  // Insert narrative sections, placing Architecture after Solution.
  for (const s of narrative) {
    toc.push({ id: s.id, label: s.label });
    if (s.id === 'solution' && hasArchitecture) toc.push({ id: 'architecture', label: 'Architecture' });
  }
  if (hasArchitecture && !narrative.some((s) => s.id === 'solution')) {
    toc.push({ id: 'architecture', label: 'Architecture' });
  }
  if (project.skills.length > 0) toc.push({ id: 'technologies', label: 'Technologies' });
  if (hasRelated) toc.push({ id: 'related', label: 'Related work' });

  const architectureBlock = hasArchitecture ? (
    <CaseSection id="architecture" title="Architecture">
      {project.architecture?.trim() ? (
        <div className="mb-6">
          <MarkdownPreview content={project.architecture} />
        </div>
      ) : null}
      {project.architecture_diagram_url ? (
        <ImageLightbox
          src={project.architecture_diagram_url}
          alt={`${project.title} architecture diagram`}
        />
      ) : null}
    </CaseSection>
  ) : null;

  return (
    <article className="pb-8 pt-12 sm:pt-16">
      <Container>
        {/* Hero */}
        <header className="flex max-w-3xl flex-col gap-5 pub-reveal">
          {project.category ? <Eyebrow>{project.category}</Eyebrow> : null}
          <h1 className="text-4xl font-semibold tracking-tight text-pub-fg text-balance sm:text-5xl">
            {project.title}
          </h1>
          <p className="text-pretty text-xl leading-relaxed text-pub-muted">
            {project.short_description}
          </p>
          {project.skills.length > 0 ? (
            <TagList tags={project.skills.slice(0, 5).map((s) => s.name)} />
          ) : null}
          {links.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-3">
              {links.map((l, i) => (
                <TrackedLink
                  key={l.label}
                  event={l.label === 'GitHub' ? 'github_click' : 'demo_click'}
                  eventProps={{ project: project.slug }}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses(i === 0 ? 'primary' : 'secondary')}
                >
                  {l.label} ↗
                </TrackedLink>
              ))}
            </div>
          ) : null}
          {project.experience.length > 0 ? (
            <p className="text-sm text-pub-muted">
              Built at{' '}
              {project.experience.map((x, i) => (
                <span key={x.id}>
                  {i > 0 ? ', ' : ''}
                  <Link
                    href={`/experience#exp-${x.id}`}
                    className="text-pub-fg underline decoration-pub-border underline-offset-4 transition-colors [transition-duration:var(--pub-duration)] hover:decoration-pub-accent"
                  >
                    {x.company}
                  </Link>
                </span>
              ))}{' '}
              →
            </p>
          ) : null}
          {project.is_confidential ? (
            <p className="rounded-xl border border-pub-border bg-pub-surface px-4 py-3 text-sm text-pub-muted">
              🔒 Client details and proprietary implementation have been omitted for
              confidentiality.
            </p>
          ) : null}
        </header>

        {project.hero_image_url ? (
          <div className="mt-10 max-w-4xl">
            <PublicImage
              src={project.hero_image_url}
              alt={`${project.title} hero`}
              aspect="wide"
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        ) : null}

        {/* Content + on-this-page nav */}
        <div className="mt-12 gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_200px]">
          <div className="flex max-w-[70ch] flex-col gap-8">
            {hasMetrics ? (
              <section id="metrics" className="scroll-mt-24">
                <h2 className="sr-only">Key metrics</h2>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                  {project.metrics.map((m) => (
                    <MetricStat key={m.id ?? m.name} value={m.value} unit={m.unit} label={m.name} />
                  ))}
                </div>
              </section>
            ) : null}

            {narrative.map((s) => (
              <div key={s.id} className="contents">
                <CaseSection id={s.id} title={s.label}>
                  <MarkdownPreview content={s.body} />
                </CaseSection>
                {s.id === 'solution' ? architectureBlock : null}
              </div>
            ))}
            {/* Architecture when there is no Solution section to anchor it after. */}
            {architectureBlock && !narrative.some((s) => s.id === 'solution')
              ? architectureBlock
              : null}

            {project.skills.length > 0 ? (
              <CaseSection id="technologies" title="Technologies">
                <TagList tags={project.skills.map((s) => s.name)} />
              </CaseSection>
            ) : null}

            {hasRelated ? (
              <CaseSection id="related" title="Related work">
                <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
                  <RelatedList
                    title="Research"
                    items={project.related_research}
                    hrefBase="/research"
                  />
                  <RelatedList
                    title="Experiments"
                    items={project.related_experiments}
                    hrefBase="/experiments"
                  />
                </div>
              </CaseSection>
            ) : null}
          </div>

          {/* On this page (desktop only, subtle) */}
          {toc.length > 1 ? (
            <aside className="hidden lg:block">
              <nav aria-label="On this page" className="sticky top-24 flex flex-col gap-2">
                <Eyebrow>On this page</Eyebrow>
                <ul className="flex flex-col gap-1.5 border-l border-pub-border">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className="-ml-px block border-l border-transparent pl-3 text-sm text-pub-muted transition-colors [transition-duration:var(--pub-duration)] hover:border-pub-accent hover:text-pub-fg"
                      >
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          ) : null}
        </div>
      </Container>
    </article>
  );
}
