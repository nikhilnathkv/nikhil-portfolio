'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Field, inputClass } from '@/components/admin/ui/form';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import {
  ACCEPT_ATTR,
  ACCEPTED_MIME,
  formatBytes,
  isImage,
  MAX_UPLOAD_MB,
  type Media,
  type MediaUsage,
} from '@/lib/admin/media-types';
import { uploadWithProgress } from '@/lib/admin/upload';

function Thumb({ media, className = '' }: { media: Media; className?: string }) {
  if (isImage(media.mime_type)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.url} alt={media.alt_text ?? ''} className={className} />;
  }
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 text-2xl text-gray-400 ${className}`}
    >
      📄
    </div>
  );
}

export function MediaLibraryClient() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await adminFetch<Media[]>('/media'));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const onFile = async (file: File) => {
    if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
      push('Unsupported file type. Use PNG, JPEG, WebP, SVG, or PDF.', 'error');
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      push(`File exceeds the ${MAX_UPLOAD_MB} MB limit.`, 'error');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    setProgress(0);
    try {
      await uploadWithProgress<Media>('/media', form, setProgress);
      push('Media uploaded.', 'success');
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
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
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? `Uploading… ${progress}%` : '+ Upload'}
        </button>
        <span className="text-xs text-gray-400">
          PNG, JPEG, WebP, SVG, PDF · up to {MAX_UPLOAD_MB} MB
        </span>
      </div>

      {uploading ? (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded bg-gray-100">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="No media yet" description="Upload an image or PDF to get started." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m)}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:border-indigo-300"
            >
              <Thumb media={m} className="aspect-square w-full object-cover" />
              <div className="p-2">
                <p className="truncate text-xs font-medium text-gray-700">{m.original_filename}</p>
                <p className="text-[11px] text-gray-400">{formatBytes(m.size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <MediaDetail
          media={selected}
          onClose={() => setSelected(null)}
          onChanged={() => void load()}
          push={push}
        />
      ) : null}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function MediaDetail({
  media,
  onClose,
  onChanged,
  push,
}: {
  media: Media;
  onClose: () => void;
  onChanged: () => void;
  push: (m: string, tone?: 'success' | 'error' | 'info') => void;
}) {
  const [alt, setAlt] = useState(media.alt_text ?? '');
  const [title, setTitle] = useState(media.title ?? '');
  const [description, setDescription] = useState(media.description ?? '');
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState<MediaUsage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    adminFetch<MediaUsage>(`/media/${media.id}/usage`)
      .then((u) => active && setUsage(u))
      .catch(() => active && setUsage({ count: 0, items: [] }));
    return () => {
      active = false;
    };
  }, [media.id]);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch(`/media/${media.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          alt_text: alt || null,
          title: title || null,
          description: description || null,
        }),
      });
      push('Media updated.', 'success');
      onChanged();
      onClose();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    const used = (usage?.count ?? 0) > 0;
    try {
      await adminFetch(`/media/${media.id}${used ? '?force=true' : ''}`, { method: 'DELETE' });
      push('Media deleted.', 'success');
      setConfirmDelete(false);
      onChanged();
      onClose();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open title={media.original_filename} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Thumb
          media={media}
          className="max-h-48 w-full rounded-lg border border-gray-200 object-contain"
        />
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 underline"
        >
          Open original ({formatBytes(media.size)})
        </a>
        <Field label="Alt text" hint="Describe the image for accessibility and SEO.">
          <input className={inputClass} value={alt} onChange={(e) => setAlt(e.target.value)} />
        </Field>
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="mb-1 font-medium text-gray-700">Used by</p>
          {usage === null ? (
            <p className="text-gray-400">Checking…</p>
          ) : usage.count === 0 ? (
            <p className="text-gray-400">Not used by any content.</p>
          ) : (
            <ul className="list-inside list-disc text-gray-600">
              {usage.items.map((it, i) => (
                <li key={i}>{it.label}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this media?"
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void doDelete()}
      >
        {usage && usage.count > 0 ? (
          <p>
            This media is used by <strong>{usage.count}</strong> piece(s) of content. Deleting it
            will remove those references.
          </p>
        ) : (
          <p>This permanently removes the file.</p>
        )}
      </ConfirmDialog>
    </Modal>
  );
}
