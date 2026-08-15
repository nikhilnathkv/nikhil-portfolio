import type { Metadata } from 'next';

import {
  ButtonLink,
  CardLink,
  Container,
  Eyebrow,
  Section,
} from '@/components/public';
import { getProfile } from '@/services/profile';

export const metadata: Metadata = {
  description:
    'Portfolio of Nikhil Nath — AI/ML engineering projects, research, experiments, and writing.',
};

const EXPLORE = [
  { href: '/projects', title: 'Projects', blurb: 'Technical case studies with architecture and metrics.' },
  { href: '/writing', title: 'Writing', blurb: 'Notes and deep-dives on ML engineering.' },
  { href: '/research', title: 'Research', blurb: 'Papers, findings, and ongoing investigations.' },
  { href: '/experiments', title: 'Experiments', blurb: 'Small builds and measured results.' },
];

export default async function HomePage() {
  const profile = await getProfile();
  const name = profile?.name?.trim() || 'Nikhil Nath';
  const headline = profile?.headline?.trim() || 'AI / ML Engineer';
  const bio =
    profile?.short_bio?.trim() ||
    'Building and shipping machine-learning systems — from research and experiments to production.';

  return (
    <>
      {/* Hero */}
      <Section as="div" className="pb-8 pt-20 sm:pt-28">
        <Container>
          <div className="flex max-w-3xl flex-col gap-6">
            <Eyebrow>{headline}</Eyebrow>
            <h1 className="text-5xl font-semibold tracking-tight text-pub-fg text-balance sm:text-6xl">
              {name}
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-pub-muted">{bio}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <ButtonLink href="/projects">View projects</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Get in touch
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Explore */}
      <Section as="div" className="pt-8">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {EXPLORE.map((item) => (
              <CardLink key={item.href} href={item.href} ariaLabel={item.title} className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-pub-fg">{item.title}</h2>
                <p className="text-sm leading-relaxed text-pub-muted">{item.blurb}</p>
              </CardLink>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
