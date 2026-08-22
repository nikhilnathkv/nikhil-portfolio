import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

/* ─────────────────────────── Layout ─────────────────────────── */

/** Centered content column with the site's max width + horizontal gutters. */
export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'prose' | 'wide';
}) {
  const max = size === 'prose' ? 'max-w-2xl' : size === 'wide' ? 'max-w-7xl' : 'max-w-6xl';
  return <div className={cn('mx-auto w-full px-6', max, className)}>{children}</div>;
}

/** Vertical rhythm wrapper for a page section. */
export function Section({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
}) {
  return <Tag className={cn('py-16 sm:py-20', className)}>{children}</Tag>;
}

/** Eyebrow (mono) + title + optional intro — the standard section header. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: TitleTag = 'h2',
  align = 'start',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  align?: 'start' | 'center';
  className?: string;
}) {
  const titleSize =
    TitleTag === 'h1'
      ? 'text-4xl sm:text-5xl font-semibold tracking-tight'
      : 'text-2xl sm:text-3xl font-semibold tracking-tight';
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <TitleTag className={cn(titleSize, 'text-pub-fg text-balance')}>{title}</TitleTag>
      {intro ? (
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-pub-muted">{intro}</p>
      ) : null}
    </div>
  );
}

/** Uppercase mono label used above headings and on metadata. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('font-mono text-xs uppercase tracking-[0.2em] text-pub-accent', className)}>
      {children}
    </span>
  );
}

/** Wraps rendered Markdown / long-form content with readable prose styling. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('prose-cms max-w-none', className)}>{children}</div>;
}

/* ─────────────────────────── Actions ─────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors [transition-duration:var(--pub-duration)] disabled:cursor-not-allowed disabled:opacity-50';
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
  };
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-pub-accent text-pub-accent-contrast hover:bg-pub-accent-hover',
    secondary: 'border border-pub-border-strong text-pub-fg hover:bg-pub-surface-2',
    ghost: 'text-pub-muted hover:bg-pub-surface hover:text-pub-fg',
  };
  return cn(base, sizes[size], variants[variant], className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

/** Link styled as a button. Internal hrefs use next/link; external open safely. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const classes = buttonClasses(variant, size, className);
  const isExternal = /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}

/* ─────────────────────────── Data bits ─────────────────────────── */

/** Small pill for a technology / keyword tag. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-pub-border bg-pub-surface px-2.5 py-0.5 font-mono text-xs text-pub-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <li key={tag}>
          <Tag>{tag}</Tag>
        </li>
      ))}
    </ul>
  );
}

/** A single headline metric (value + label). */
export function MetricStat({
  value,
  label,
  unit,
  className,
}: {
  value: string;
  label: string;
  unit?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-3xl font-semibold tracking-tight text-pub-fg">
        {value}
        {unit ? <span className="ml-1 text-lg text-pub-muted">{unit}</span> : null}
      </span>
      <span className="text-sm text-pub-muted">{label}</span>
    </div>
  );
}

/* ─────────────────────────── Cards ─────────────────────────── */

/** Static surface card. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-pub-border bg-pub-surface p-6', className)}>
      {children}
    </div>
  );
}

/**
 * Card whose whole surface is a single link. Renders as an <article> with an
 * absolutely-positioned link overlay so the accessible name comes from the
 * heading — nested interactive children stay clickable via `relative z-10`.
 */
export function CardLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <article
      className={cn(
        'group relative rounded-2xl border border-pub-border bg-pub-surface p-6 transition-colors [transition-duration:var(--pub-duration)] hover:border-pub-border-strong hover:bg-pub-surface-2',
        className,
      )}
    >
      <Link href={href} aria-label={ariaLabel} className="absolute inset-0 rounded-2xl">
        <span className="sr-only">{ariaLabel ?? 'Read more'}</span>
      </Link>
      {children}
    </article>
  );
}
