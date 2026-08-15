'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button, Container, Section, SectionHeading } from '@/components/public';

/**
 * Public route error boundary (Next 16: the recovery prop is `retry`). Rendered
 * inside the public shell, so it inherits nav/footer + the dark theme.
 */
export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section>
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Error"
          title="Something went wrong"
          intro="An unexpected error occurred while loading this page. You can try again, or head back home."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => retry()}>Try again</Button>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Go home
          </Button>
        </div>
      </Container>
    </Section>
  );
}
