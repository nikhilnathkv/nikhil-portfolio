import type { Experience } from '@/lib/admin/experience-types';

import {
  ButtonLink,
  Container,
  ExperienceItem,
  Section,
  SectionHeading,
} from '@/components/public';

/** Compact experience teaser — the detailed story lives on /experience. */
export function ExperiencePreview({ experience }: { experience: Experience[] }) {
  if (experience.length === 0) return null;
  const recent = experience.slice(0, 2);
  return (
    <Section className="border-t border-pub-border">
      <Container>
        <SectionHeading eyebrow="Experience" title="Recent roles" />
        <div className="mt-12 flex flex-col gap-10">
          {recent.map((e) => (
            <ExperienceItem
              key={e.id}
              company={e.company}
              role={e.role}
              startDate={e.start_date}
              endDate={e.end_date}
              current={e.is_current}
              summary={e.summary}
            />
          ))}
        </div>
        <div className="mt-10">
          <ButtonLink href="/experience" variant="secondary">
            View full experience
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
