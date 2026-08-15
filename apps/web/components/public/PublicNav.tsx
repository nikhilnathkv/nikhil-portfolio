'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useFocusTrap } from '@/hooks/useFocusTrap';

import { cn } from './cn';
import { Container } from './primitives';
import { NAV_LINKS, isActivePath } from './nav-links';

/**
 * Sticky public site header. Desktop: brand + inline links with active state.
 * Mobile: a hamburger toggles a full-width drawer whose focus is trapped
 * (reusing {@link useFocusTrap}) and which closes on Esc, route change, or
 * backdrop click.
 */
export function PublicNav({ siteName = 'Nikhil Nath' }: { siteName?: string }) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(drawerRef, open);

  // Esc closes; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-pub-border bg-pub-bg/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-pub-fg"
            aria-label={`${siteName} — home`}
          >
            {siteName}
          </Link>

          {/* Desktop links */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm transition-colors [transition-duration:var(--pub-duration)]',
                        active
                          ? 'bg-pub-surface text-pub-fg'
                          : 'text-pub-muted hover:bg-pub-surface hover:text-pub-fg',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-pub-fg md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-nav"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            tabIndex={-1}
            className="relative border-b border-pub-border bg-pub-bg outline-none"
          >
            <Container>
              <nav aria-label="Primary mobile">
                <ul className="flex flex-col py-4">
                  {NAV_LINKS.map((link) => {
                    const active = isActivePath(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'block rounded-lg px-3 py-3 text-base transition-colors',
                            active
                              ? 'bg-pub-surface text-pub-fg'
                              : 'text-pub-muted hover:bg-pub-surface hover:text-pub-fg',
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Container>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
