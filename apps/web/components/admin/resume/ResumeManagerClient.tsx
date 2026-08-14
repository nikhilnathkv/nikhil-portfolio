'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import { MAX_UPLOAD_MB } from '@/lib/admin/media-types';
import type { Resume } from '@/lib/admin/resume-types';
import { uploadWithProgress } from '@/lib/admin/upload';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ResumeManagerClient() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [archiveTarget, setArchiveTarget] = useState<Resume | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setResumes(await adminFetch<Resume[]>('/resumes'));
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

  const active = resumes.find((r) => r.is_active) ?? null;
  const previous = resumes.filter((r) => !r.is_active);

  const onFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      push('Resume must be a PDF.', 'error');
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      push(`File exceeds the ${MAX_UPLOAD_MB} MB limit.`, 'error');
      return;
    }
    // Version = YYYY.MM; make the first upload active automatically.
    const now = new Date();
    const version = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name);
    form.append('version', version);
    form.append('is_active', resumes.length === 0 ? 'true' : 'false');

    setUploading(true);
    setProgress(0);
    try {
      await uploadWithProgress<Resume>('/resumes/upload', form, setProgress);
      push('Resume uploaded.', 'success');
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const activate = async (r: Resume) => {
    try {
      await adminFetch(`/resumes/${r.id}/activate`, { method: 'POST' });
      push('Resume activated.', 'success');
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
    }
  };

  const archive = async () => {
    if (!archiveTarget) return;
    setBusy(true);
    try {
      await adminFetch(`/resumes/${archiveTarget.id}/archive`, { method: 'POST' });
      push('Resume archived.', 'success');
      setArchiveTarget(null);
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
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
          {uploading ? `Uploading… ${progress}%` : '+ Upload Resume'}
        </button>
        <span className="text-xs text-gray-400">PDF only · up to {MAX_UPLOAD_MB} MB</span>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : resumes.length === 0 ? (
        <EmptyState title="No resume yet" description="Upload your resume PDF to get started." />
      ) : (
        <div className="flex flex-col gap-6">
          {active ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Current resume
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{active.name}</p>
                  <p className="text-sm text-gray-500">
                    Version {active.version} · uploaded {fmtDate(active.created_at)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    ● ACTIVE
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={active.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Preview
                </a>
                <a
                  href={active.file_url}
                  download
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setArchiveTarget(active)}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Archive
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No active resume. Activate one below.
            </p>
          )}

          {previous.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Previous versions
              </h2>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {previous.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {r.name} <span className="text-gray-400">· {r.version}</span>
                      </p>
                      <p className="text-xs text-gray-400">Uploaded {fmtDate(r.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => void activate(r)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive this resume?"
        confirmLabel="Archive"
        destructive
        busy={busy}
        onCancel={() => (busy ? undefined : setArchiveTarget(null))}
        onConfirm={() => void archive()}
      >
        <p>It will no longer be the active resume.</p>
      </ConfirmDialog>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
