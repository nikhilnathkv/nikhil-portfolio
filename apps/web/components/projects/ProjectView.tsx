import type { Project } from '@/lib/admin/project-types';

/**
 * Shared, presentation-only project renderer.
 *
 * Used by BOTH the authenticated admin preview (`/preview/projects/[slug]`) and
 * the public project page (`/projects/[slug]`) so the two never drift. It takes
 * a fully-resolved project and does no data fetching of its own.
 */

function Prose({ title, body }: { title: string; body: string | null }) {
  if (!body || !body.trim()) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="whitespace-pre-wrap text-foreground/70">{body}</p>
    </section>
  );
}

export function ProjectView({ project }: { project: Project }) {
  const links = [
    { label: 'GitHub', href: project.github_url },
    { label: 'Live demo', href: project.live_url },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-3">
        {project.category ? (
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/50">
            {project.category}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{project.title}</h1>
        <p className="text-lg text-foreground/70">{project.short_description}</p>
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

      {project.hero_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.hero_image_url}
          alt={`${project.title} hero`}
          className="w-full rounded-xl border border-foreground/10"
        />
      ) : null}

      {project.metrics.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {project.metrics.map((m) => (
            <div
              key={m.id ?? m.name}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4"
            >
              <p className="text-2xl font-semibold text-foreground">
                {m.value}
                {m.unit ? (
                  <span className="ml-0.5 text-base text-foreground/60">{m.unit}</span>
                ) : null}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground/80">{m.name}</p>
              {m.description ? (
                <p className="mt-0.5 text-xs text-foreground/50">{m.description}</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <Prose title="Overview" body={project.description} />
      <Prose title="Problem" body={project.problem} />
      <Prose title="Solution" body={project.solution} />

      {project.architecture || project.architecture_diagram_url ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Architecture</h2>
          {project.architecture ? (
            <p className="whitespace-pre-wrap text-foreground/70">{project.architecture}</p>
          ) : null}
          {project.architecture_diagram_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.architecture_diagram_url}
              alt={`${project.title} architecture diagram`}
              className="w-full rounded-xl border border-foreground/10"
            />
          ) : null}
        </section>
      ) : null}

      <Prose title="Engineering decisions" body={project.engineering_decisions} />
      <Prose title="Challenges" body={project.challenges} />
      <Prose title="Lessons learned" body={project.lessons_learned} />

      {project.skills.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((s) => (
              <span
                key={s.id}
                className="rounded-full border border-foreground/15 px-3 py-1 text-sm text-foreground/80"
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
