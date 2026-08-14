'use client';

import { useEffect, useState } from 'react';

import { adminFetch } from '@/lib/admin/client-api';
import type { Media } from '@/lib/admin/profile-types';

/**
 * Select an existing image from the media library. Upload lands in M3.5; until
 * then this only picks from whatever media already exists. Reused by Profile
 * (and later Blog/Projects) — so it takes/returns just a media id.
 */
export function MediaPicker({
  value,
  onChange,
  label = 'Select an image',
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
}) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminFetch<Media[]>('/media')
      .then((m) => active && setMedia(m))
      .catch(() => active && setMedia([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const selected = media.find((m) => m.id === value) ?? null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.url}
            alt={selected.alt_text ?? ''}
            className="h-full w-full object-cover"
          />
        ) : (
          'None'
        )}
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <p className="text-sm text-gray-400">Loading media…</p>
        ) : media.length === 0 ? (
          <p className="text-sm text-gray-400">
            No media yet — uploads arrive in a later milestone.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <select
              aria-label={label}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value || null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">None</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.filename}
                </option>
              ))}
            </select>
            {value ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-md border border-gray-200 px-2 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
