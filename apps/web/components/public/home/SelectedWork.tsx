import type { ProjectListItem } from '@/lib/admin/project-types';

import { ButtonLink, Container, ProjectCard, Section, SectionHeading } from '@/components/public';

/**
 * The centerpiece: featured projects. Falls back to a graceful public message
 * (not a CMS "no results" error) while the content database is still filling up.
 */
export function SelectedWork({
  projects,
  githubUrl,
}: {
  projects: ProjectListItem[];
  githubUrl?: string | null;
}) {
  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Selected Work"
          title="Projects I've designed, built, evaluated and deployed"
          intro="A few systems that show how I approach real AI/ML problems end to end."
        />

        {projects.length > 0 ? (
          <>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  slug={p.slug}
                  title={p.title}
                  summary={p.short_description}
                  category={p.category}
                  imageUrl={p.hero_image_url}
                  tags={p.skills.map((s) => s.name)}
                  metrics={p.metrics.map((m) => ({
                    value: m.value,
                    unit: m.unit,
                    label: m.name,
                  }))}
                />
              ))}
            </div>
            <div className="mt-10">
              <ButtonLink href="/projects" variant="secondary">
                View all projects
              </ButtonLink>
            </div>
          </>
        ) : (
          <div className="mt-10 max-w-xl">
            <p className="text-lg leading-relaxed text-pub-muted">
              I&apos;m currently documenting some of the systems I&apos;ve built. Check back soon —
              or explore the source in the meantime.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/projects" variant="secondary">
                Browse projects
              </ButtonLink>
              {githubUrl ? (
                <ButtonLink href={githubUrl} variant="ghost">
                  GitHub →
                </ButtonLink>
              ) : null}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
