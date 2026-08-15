/** Minimal className joiner (truthy strings only) for the public component set. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
