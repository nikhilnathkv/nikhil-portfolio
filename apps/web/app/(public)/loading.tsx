import { ArticleSkeleton, Container, Section } from '@/components/public';

/** Route-group loading fallback for public pages. */
export default function PublicLoading() {
  return (
    <Section>
      <Container size="prose">
        <ArticleSkeleton />
      </Container>
    </Section>
  );
}
