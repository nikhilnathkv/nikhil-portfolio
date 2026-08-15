'use client';

import { useRef, useState, type ComponentPropsWithoutRef } from 'react';

/**
 * `<pre>` renderer for Markdown code blocks with an accessible copy button.
 * Used by MarkdownPreview via react-markdown's `components` map. `node` (passed
 * by react-markdown) is stripped so it never lands on the DOM element.
 */
export function CodeBlock({
  children,
  ...props
}: ComponentPropsWithoutRef<'pre'> & { node?: unknown }) {
  // react-markdown injects a `node` prop; strip it so it never lands on the DOM.
  delete (props as { node?: unknown }).node;
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-md border border-current/20 bg-current/5 px-2 py-1 text-[0.7rem] font-medium opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre ref={ref} {...props}>
        {children}
      </pre>
    </div>
  );
}
