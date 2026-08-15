import { Container, Section, SectionHeading } from './primitives';

/**
 * Placeholder for public routes whose full content lands in a later M4 milestone.
 * Renders inside the public shell so navigation resolves (no 404s) and the
 * design system is exercised.
 */
export function StubPage({
  eyebrow,
  title,
  intro,
  milestone,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  milestone: string;
}) {
  return (
    <Section>
      <Container>
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} intro={intro} />
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-pub-subtle">
          Coming soon · {milestone}
        </p>
      </Container>
    </Section>
  );
}
