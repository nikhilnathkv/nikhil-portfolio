'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * Architecture diagrams are dense, so the thumbnail opens an accessible
 * full-screen viewer: focus is trapped, Esc / backdrop click / the close button
 * dismiss it, and focus returns to the thumbnail. Motion is handled by the
 * global reduced-motion rule.
 */
export function ImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-pub-border bg-pub-surface-2 transition-colors [transition-duration:var(--pub-duration)] hover:border-pub-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-accent"
        aria-label={`Enlarge diagram: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- natural-size diagram, dimensions unknown */}
        <img src={src} alt={alt} className="w-full" loading="lazy" />
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-pub-bg/80 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-pub-muted">
          Click to enlarge
        </span>
      </button>

      {open ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Close ✕
          </button>
          <div
            className="relative max-h-full max-w-6xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1600}
              height={1200}
              className="h-auto w-auto max-w-full rounded-lg"
              sizes="90vw"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
