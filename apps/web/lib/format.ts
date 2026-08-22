/** Shared, locale-stable date + text formatting for public pages. */

/** Estimated reading time in minutes (≈200 wpm), min 1, from Markdown/text. */
export function readingTimeMinutes(...parts: (string | null | undefined)[]): number {
  const words = parts.filter(Boolean).join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "Aug 2026" from an ISO date; null-safe. */
export function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/** Just the year ("2026") from an ISO date; null-safe. */
export function formatYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getUTCFullYear());
}

/**
 * A role date range: "Aug 2020 — Aug 2026", or "Aug 2026 — Present" when the
 * role is current (or has no end date).
 */
export function formatDateRange(
  start: string,
  end: string | null | undefined,
  isCurrent: boolean,
): string {
  const from = formatMonthYear(start) ?? '';
  const to = isCurrent || !end ? 'Present' : (formatMonthYear(end) ?? 'Present');
  return `${from} — ${to}`;
}
