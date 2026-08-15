import Image from 'next/image';

import { cn } from './cn';

/**
 * `next/image` wrapper for uploaded media (served from the MinIO origin, which
 * is whitelisted in `next.config.ts` remotePatterns). Renders a rounded,
 * fixed-aspect box; shows a neutral placeholder when there is no image.
 */
export function PublicImage({
  src,
  alt,
  aspect = 'video',
  className,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  aspect?: 'video' | 'square' | 'wide';
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ratio =
    aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[21/9]' : 'aspect-video';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-pub-border bg-pub-surface-2',
        ratio,
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-pub-subtle"
        >
          No image
        </div>
      )}
    </div>
  );
}
