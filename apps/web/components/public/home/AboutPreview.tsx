import { ButtonLink, Container, Section, SectionHeading } from '@/components/public';

/** Short homepage about — the full story lives on /about. */
export function AboutPreview({ bio }: { bio: string }) {
  return (
    <Section className="border-t border-pub-border">
      <Container>
        <SectionHeading eyebrow="About" title="A bit about me" />
        <p className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-pub-muted">{bio}</p>
        <div className="mt-8">
          <ButtonLink href="/about" variant="secondary">
            More about me
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
