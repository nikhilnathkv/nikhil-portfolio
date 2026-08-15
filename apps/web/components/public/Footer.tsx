import Link from 'next/link';

import { cn } from './cn';
import { Container } from './primitives';
import { NAV_LINKS } from './nav-links';

export interface SocialLink {
  label: string;
  href: string;
}

/**
 * Site footer: brand, the same IA links as the nav, social links, and a
 * built-with line. `siteName` / `socials` are wired to the settings service by
 * the public layout; sensible defaults keep it renderable standalone.
 */
export function Footer({
  siteName = 'Nikhil Nath',
  socials = [],
  className,
}: {
  siteName?: string;
  socials?: SocialLink[];
  className?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className={cn('mt-auto border-t border-pub-border', className)}>
      <Container className="flex flex-col gap-10 py-12">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-lg font-semibold tracking-tight text-pub-fg">
              {siteName}
            </Link>
            <p className="max-w-xs text-sm text-pub-muted">
              AI / ML engineering — projects, research, experiments, and writing.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-pub-muted transition-colors hover:text-pub-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col-reverse items-start justify-between gap-4 border-t border-pub-border pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-pub-subtle">
            © {year} {siteName}. Built with Next.js &amp; FastAPI.
          </p>
          {socials.length > 0 ? (
            <ul className="flex flex-wrap gap-4 text-sm">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
    </footer>
  );
}
