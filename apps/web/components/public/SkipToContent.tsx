/**
 * Keyboard skip link: visually hidden until focused, then jumps to <main>.
 * First focusable element on every public page.
 */
export function SkipToContent({ targetId = 'content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-pub-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-pub-accent-contrast"
    >
      Skip to content
    </a>
  );
}
