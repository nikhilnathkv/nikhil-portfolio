import type { Metadata } from 'next';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import {
  ButtonLink,
  Container,
  MetricStat,
  Section,
  SectionHeading,
  SkillGroup,
} from '@/components/public';
import { getProfile } from '@/services/profile';
import { listExperience } from '@/services/experience';
import { listProjects } from '@/services/projects';
import { listSkills } from '@/services/skills';

export const metadata: Metadata = {
  title: 'About',
  description:
    'AI/ML engineer building intelligent systems at the intersection of machine learning, GenAI and production engineering.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About · Nikhil Nath',
    description:
      'AI/ML engineer building intelligent systems from problem definition to production.',
    url: '/about',
  },
};

// Temporary, curated copy — refined in a later content pass.
const EXPLORING = [
  'AI evaluation',
  'Agentic systems',
  'MLOps',
  'Time-series modelling',
  'Computer vision',
];
const TRAJECTORY = [
  'Data & ML',
  'Applied AI',
  'GenAI',
  'Agentic systems',
  'Production AI engineering',
];

function yearsOfExperience(startDates: string[]): number | null {
  const earliest = startDates
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b)[0];
  if (earliest === undefined) return null;
  const years = Math.floor((Date.now() - earliest) / (365.25 * 24 * 3600 * 1000));
  return years >= 1 ? years : null;
}

export default async function AboutPage() {
  const [profile, skills, experience, projects] = await Promise.all([
    getProfile(),
    listSkills(),
    listExperience(),
    listProjects(),
  ]);

  // Concise positioning line for the hero; the full story renders below.
  const positioning =
    profile?.short_bio?.trim() ||
    'AI/ML engineer building intelligent systems at the intersection of machine learning, GenAI and production engineering.';
  const narrative = profile?.long_bio?.trim() ?? '';

  const focusAreas = skills.filter((c) => c.skills.length > 0).map((c) => c.name);
  const years = yearsOfExperience(experience.map((e) => e.start_date));
  const projectCount = projects.length;

  return (
    <>
      <Section className="pt-16 sm:pt-20">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="About"
            title="Building production AI systems"
            intro={positioning}
          />

          {/* Career highlights — only substantiated numbers. */}
          {(years || projectCount > 0) && (
            <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
              {years ? <MetricStat value={`${years}+`} label="Years experience" /> : null}
              {projectCount > 0 ? (
                <MetricStat value={`${projectCount}`} label="Case studies" />
              ) : null}
              {focusAreas.length > 0 ? (
                <MetricStat value={`${focusAreas.length}`} label="Focus areas" />
              ) : null}
            </div>
          )}
        </Container>
      </Section>

      {narrative ? (
        <Section className="border-t border-pub-border">
          <Container>
            {/* Full story at a comfortable reading width; rendered as Markdown so
                paragraphs, emphasis and lists in the CMS bio format cleanly. */}
            <div className="max-w-2xl">
              <MarkdownPreview content={narrative} />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="border-t border-pub-border">
        <Container>
          <div className="max-w-2xl">
            <SectionHeading eyebrow="Trajectory" title="Where I'm heading" />
            <ol className="mt-6 flex flex-col gap-1.5 text-pub-muted">
              {TRAJECTORY.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-pub-subtle">{i > 0 ? '↓' : '•'}</span>
                  <span className={i === TRAJECTORY.length - 1 ? 'text-pub-fg' : undefined}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {skills.length > 0 ? (
        <Section className="border-t border-pub-border">
          <Container>
            <SectionHeading eyebrow="Capabilities" title="What I work with" />
            <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {skills
                .filter((c) => c.skills.length > 0)
                .map((c) => (
                  <SkillGroup key={c.id} category={c.name} skills={c.skills.map((s) => s.name)} />
                ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="border-t border-pub-border">
        <Container>
          <SectionHeading eyebrow="Currently exploring" title="On my radar" />
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-pub-muted">
            {EXPLORING.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="text-pub-accent">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="border-t border-pub-border">
        <Container>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/resume">View resume</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Get in touch
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
