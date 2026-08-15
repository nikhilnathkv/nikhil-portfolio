import { ButtonLink, Container, Section, SectionHeading } from '@/components/public';

/** In-shell 404 for the public site. */
export default function PublicNotFound() {
  return (
    <Section>
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="404"
          title="Page not found"
          intro="The page you’re looking for doesn’t exist or may have moved."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/projects" variant="secondary">
            Explore projects
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
