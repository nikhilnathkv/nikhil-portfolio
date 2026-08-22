import type { Metadata } from 'next';
import Link from 'next/link';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import { ButtonLink, Container, SkillGroup, TrackView, TrackedLink } from '@/components/public';
import { formatDateRange } from '@/lib/format';
import { listExperience } from '@/services/experience';
import { getProfile } from '@/services/profile';
import { listProjects } from '@/services/projects';
import { getActiveResume } from '@/services/resume';
import { listSkills } from '@/services/skills';

export const metadata: Metadata = {
  title: 'Resume',
  description:
    'Resume of Nikhil Nath — AI/ML Engineer. Summary, experience, selected projects and skills.',
  alternates: { canonical: '/resume' },
  openGraph: {
    title: 'Resume · Nikhil Nath',
    description: 'AI/ML Engineer — summary, experience, selected projects and skills.',
    url: '/resume',
  },
};

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-pub-border pt-6">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-pub-subtle">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ResumePage() {
  const [profile, experience, projects, skills, resume] = await Promise.all([
    getProfile(),
    listExperience(),
    listProjects({ featured: true }),
    listSkills(),
    getActiveResume(),
  ]);

  const name = profile?.name?.trim() || 'Nikhil Nath';
  const headline = profile?.headline?.trim() || 'AI / ML Engineer';
  const skillGroups = skills.filter((c) => c.skills.length > 0);

  return (
    <Container size="prose" className="py-12 sm:py-16">
      <TrackView event="resume_view" />
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-pub-fg">{name}</h1>
            <p className="mt-1 text-lg text-pub-muted">{headline}</p>
          </div>
          {resume?.file_url ? (
            <TrackedLink
              event="resume_download"
              href={resume.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print inline-flex items-center gap-2 rounded-full bg-pub-accent px-5 py-2.5 text-sm font-medium text-pub-accent-contrast transition-colors [transition-duration:var(--pub-duration)] hover:bg-pub-accent-hover"
            >
              Download PDF ↓
            </TrackedLink>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-pub-muted">
          {profile?.location ? <span>{profile.location}</span> : null}
          {profile?.email ? (
            <a href={`mailto:${profile.email}`} className="hover:text-pub-fg">
              {profile.email}
            </a>
          ) : null}
          {profile?.linkedin_url ? (
            <a
              href={profile.linkedin_url}
              className="hover:text-pub-fg"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          ) : null}
          {profile?.github_url ? (
            <a
              href={profile.github_url}
              className="hover:text-pub-fg"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          ) : null}
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-8">
        {/* Summary */}
        {profile?.short_bio ? (
          <ResumeSection title="Professional summary">
            <p className="text-pretty leading-relaxed text-pub-muted">{profile.short_bio}</p>
          </ResumeSection>
        ) : null}

        {/* Skills */}
        {skillGroups.length > 0 ? (
          <ResumeSection title="Core competencies">
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
              {skillGroups.map((c) => (
                <SkillGroup key={c.id} category={c.name} skills={c.skills.map((s) => s.name)} />
              ))}
            </div>
          </ResumeSection>
        ) : null}

        {/* Experience — concise */}
        {experience.length > 0 ? (
          <ResumeSection title="Experience">
            <div className="flex flex-col gap-6">
              {experience.map((e) => (
                <div key={e.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-semibold text-pub-fg">
                      {e.role} · <span className="font-normal text-pub-muted">{e.company}</span>
                    </h3>
                    <span className="font-mono text-xs text-pub-subtle">
                      {formatDateRange(e.start_date, e.end_date, e.is_current)}
                    </span>
                  </div>
                  {e.summary ? (
                    <p className="text-sm leading-relaxed text-pub-muted">{e.summary}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </ResumeSection>
        ) : null}

        {/* Selected projects */}
        {projects.length > 0 ? (
          <ResumeSection title="Selected projects">
            <div className="flex flex-col gap-5">
              {projects.map((p) => (
                <div key={p.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-semibold text-pub-fg">{p.title}</h3>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="no-print font-mono text-xs text-pub-accent hover:text-pub-accent-hover"
                    >
                      Case study →
                    </Link>
                  </div>
                  <p className="text-sm leading-relaxed text-pub-muted">{p.short_description}</p>
                  {p.skills.length > 0 ? (
                    <p className="text-xs text-pub-subtle">
                      {p.skills.map((s) => s.name).join(' · ')}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </ResumeSection>
        ) : null}

        {/* Education */}
        {profile?.education?.trim() ? (
          <ResumeSection title="Education">
            <MarkdownPreview content={profile.education} />
          </ResumeSection>
        ) : null}

        {/* Certifications */}
        {profile?.certifications?.trim() ? (
          <ResumeSection title="Certifications">
            <MarkdownPreview content={profile.certifications} />
          </ResumeSection>
        ) : null}

        {/* Cross-links (screen only) */}
        <div className="no-print flex flex-wrap gap-3 border-t border-pub-border pt-8">
          <ButtonLink href="/experience" variant="secondary">
            Full experience
          </ButtonLink>
          <ButtonLink href="/projects" variant="secondary">
            All projects
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Get in touch
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
