'use client';

import { useEffect, useRef, useState } from 'react';

import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import {
  ACCEPT_ATTR,
  ACCEPTED_MIME,
  isImage,
  MAX_UPLOAD_MB,
  type Media,
} from '@/lib/admin/media-types';
import { uploadWithProgress } from '@/lib/admin/upload';

/**
 * Select an image from the media library, or upload a new one inline. Returns
 * the chosen media id. Reused by Profile, Blog cover, and SEO defaults.
 */
export function MediaPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    adminFetch<Media[]>('/media')
      .then(setMedia)
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const selected = media.find((m) => m.id === value) ?? null;

  const onFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
      setError('Unsupported file type.');
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    try {
      const created = await uploadWithProgress<Media>('/media', form);
      await load();
      onChange(created.id);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.body.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const images = media.filter((m) => isImage(m.mime_type));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
          {selected && isImage(selected.mime_type) ? (
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-xs text-gray-400">Loading media…</p>
      ) : images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-label={`Select ${m.original_filename}`}
              aria-pressed={m.id === value}
              className={`h-14 w-14 overflow-hidden rounded-md border-2 transition ${
                m.id === value ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt_text ?? ''} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No images yet — upload one above.</p>
      )}
    </div>
  );
}
