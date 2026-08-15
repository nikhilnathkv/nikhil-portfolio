import type { Metadata } from 'next';
import Link from 'next/link';

import { Container, ProjectCard, Section, SectionHeading } from '@/components/public';
import { cn } from '@/components/public/cn';
import { CATEGORIES } from '@/lib/admin/projects';
import type { ProjectListItem } from '@/lib/admin/project-types';
import { listProjects } from '@/services/projects';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Selected work across AI/ML, GenAI, agentic AI, data engineering and computer vision — technical case studies with architecture, decisions and measured results.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Projects · Nikhil Nath',
    description: 'Technical case studies across AI/ML, GenAI, agentic AI and more.',
    url: '/projects',
  },
};

function toCard(p: ProjectListItem) {
  return (
    <ProjectCard
      key={p.id}
      slug={p.slug}
      title={p.title}
      summary={p.short_description}
      category={p.category}
      imageUrl={p.hero_image_url}
      tags={p.skills.map((s) => s.name)}
      metrics={p.metrics.map((m) => ({ value: m.value, unit: m.unit, label: m.name }))}
    />
  );
}

export default async function ProjectsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await listProjects();

  // Category filter chips: only categories that actually have published projects,
  // ordered by the canonical vocabulary.
  const present = new Set(all.map((p) => p.category).filter(Boolean) as string[]);
  const categories = CATEGORIES.filter((c) => present.has(c));

  const active = category && present.has(category) ? category : null;
  const filtered = active ? all.filter((p) => p.category === active) : all;
  const featured = !active ? all.filter((p) => p.featured) : [];

  return (
    <>
      <Section className="pt-16 sm:pt-20">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Work"
            title="Projects"
            intro="Selected work across AI/ML, GenAI, agentic AI, data engineering and computer vision. Each one is a technical case study — the problem, the architecture, the decisions, and the measured results."
          />

          {categories.length > 0 ? (
            <nav aria-label="Filter projects by category" className="mt-10 flex flex-wrap gap-2">
              <FilterChip href="/projects" label="All" active={!active} />
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  href={`/projects?category=${encodeURIComponent(c)}`}
                  label={c}
                  active={active === c}
                />
              ))}
            </nav>
          ) : null}
        </Container>
      </Section>

      <Container className="pb-24">
        {all.length === 0 ? (
          <p className="max-w-xl text-lg leading-relaxed text-pub-muted">
            Case studies are on the way — I&apos;m currently writing up several of the systems
            I&apos;ve built. Check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-16">
            {featured.length > 0 ? (
              <section>
                <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-pub-subtle">
                  Featured
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featured.map(toCard)}
                </div>
              </section>
            ) : null}

            <section>
              {featured.length > 0 ? (
                <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-pub-subtle">
                  {active ? active : 'All projects'}
                </h2>
              ) : null}
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(toCard)}
                </div>
              ) : (
                <p className="text-pub-muted">No projects in this category yet.</p>
              )}
            </section>
          </div>
        )}
      </Container>
    </>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors [transition-duration:var(--pub-duration)]',
        active
          ? 'border-pub-accent bg-pub-accent-soft text-pub-fg'
          : 'border-pub-border text-pub-muted hover:border-pub-border-strong hover:text-pub-fg',
      )}
    >
      {label}
    </Link>
  );
}
