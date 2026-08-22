import { ButtonLink, Container, Section } from '@/components/public';
import type { SocialLink } from '@/components/public';

/**
 * Closing section — resume + contact CTAs and social links. Clean, not a big
 * flashy banner.
 */
export function ClosingCta({ socials }: { socials: SocialLink[] }) {
  return (
    <Section className="border-t border-pub-border">
      <Container>
        <div className="flex flex-col gap-6">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-pub-fg text-balance sm:text-4xl">
            Let&apos;s build something useful.
          </h2>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-pub-muted">
            Have an interesting AI problem, a research idea, or an opportunity? I&apos;d like to
            hear about it.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact">Get in touch</ButtonLink>
            <ButtonLink href="/resume" variant="secondary">
              View resume
            </ButtonLink>
          </div>
          {socials.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-4 text-sm">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-pub-muted transition-colors hover:text-pub-fg"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
