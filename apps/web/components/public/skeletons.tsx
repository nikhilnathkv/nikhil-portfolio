import { cn } from './cn';

/**
 * Loading placeholders for public routes. Pulse animation is suppressed under
 * prefers-reduced-motion by the global rule in globals.css.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-pub-surface-2', className)}
    />
  );
}

/** Card-shaped skeleton for list grids. */
export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-pub-border bg-pub-surface p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

/** A responsive grid of card skeletons. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Skeleton for a long-form detail page. */
export function ArticleSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
