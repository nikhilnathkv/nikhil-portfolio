import type { Metadata } from 'next';

import { ContactForm } from '@/components/public/ContactForm';
import { Container, Eyebrow, Section, SectionHeading } from '@/components/public';
import { getProfile } from '@/services/profile';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Get in touch about AI/ML engineering, GenAI, research, or an interesting technical problem.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact · Nikhil Nath',
    description: 'Get in touch about AI/ML engineering, GenAI and research.',
    url: '/contact',
  },
};

export default async function ContactPage() {
  const profile = await getProfile();

  const directLinks = [
    profile?.email ? { label: 'Email', href: `mailto:${profile.email}`, text: profile.email } : null,
    profile?.linkedin_url ? { label: 'LinkedIn', href: profile.linkedin_url, text: 'LinkedIn' } : null,
    profile?.github_url ? { label: 'GitHub', href: profile.github_url, text: 'GitHub' } : null,
  ].filter((l): l is { label: string; href: string; text: string } => l !== null);

  return (
    <Section className="pt-16 sm:pt-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Contact"
          title="Let's build something useful"
          intro="I'm open to conversations around AI/ML engineering, GenAI, agentic systems, research, and interesting technical problems."
        />

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="max-w-xl">
            <ContactForm />
          </div>

          {directLinks.length > 0 ? (
            <aside className="flex flex-col gap-3">
              <Eyebrow>Or reach me directly</Eyebrow>
              <ul className="flex flex-col gap-2">
                {directLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-pub-fg transition-colors [transition-duration:var(--pub-duration)] hover:text-pub-accent"
                    >
                      {l.label} <span className="text-pub-subtle">· {l.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
