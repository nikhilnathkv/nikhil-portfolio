import type { SkillCategory } from '@/lib/admin/skill-types';

import { Container, Section, SectionHeading } from '@/components/public';

interface FocusArea {
  title: string;
  detail: string;
}

/** Curated fallback capabilities when the skills CMS is empty (temporary copy). */
const DEFAULT_FOCUS: FocusArea[] = [
  { title: 'Generative AI', detail: 'RAG · LLM applications · evaluation' },
  { title: 'Agentic AI', detail: 'Tool use · orchestration · workflows' },
  { title: 'Machine Learning', detail: 'Forecasting · anomaly detection · NLP' },
  { title: 'AI Engineering', detail: 'APIs · MLOps · Databricks · deployment' },
  { title: 'Computer Vision', detail: 'Object detection · video analytics' },
];

function toAreas(categories: SkillCategory[]): FocusArea[] {
  const derived = categories
    .filter((c) => c.skills.length > 0)
    .slice(0, 5)
    .map((c) => ({
      title: c.name,
      detail: c.skills
        .slice(0, 3)
        .map((s) => s.name)
        .join(' · '),
    }));
  return derived.length > 0 ? derived : DEFAULT_FOCUS;
}

/**
 * Capabilities, not a technology dump — the areas I work in, numbered.
 */
export function EngineeringFocus({ categories }: { categories: SkillCategory[] }) {
  const areas = toAreas(categories);
  return (
    <Section className="border-t border-pub-border">
      <Container>
        <SectionHeading eyebrow="Engineering Focus" title="Where I go deep" />
        <ol className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, i) => (
            <li key={area.title} className="flex flex-col gap-2 border-t border-pub-border pt-4">
              <span className="font-mono text-xs text-pub-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-lg font-semibold text-pub-fg">{area.title}</h3>
              <p className="text-sm text-pub-muted">{area.detail}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
