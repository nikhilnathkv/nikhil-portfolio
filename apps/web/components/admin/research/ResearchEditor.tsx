'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ProjectSelect } from '@/components/admin/projects/ProjectSelect';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { MarkdownEditor } from '@/components/cms/MarkdownEditor';
import { PublishingActions } from '@/components/cms/PublishingActions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { ContentStatus } from '@/lib/admin/project-types';
import { slugify } from '@/lib/admin/projects';
import type { Research, ResearchWritePayload } from '@/lib/admin/research-types';

interface FormState {
  title: string;
  slug: string;
  abstract: string;
  methodology: string;
  results: string;
  conclusion: string;
  paper_url: string;
  publication_url: string;
  github_url: string;
  project_id: string | null;
}

const empty = (): FormState => ({
  title: '',
  slug: '',
  abstract: '',
  methodology: '',
  results: '',
  conclusion: '',
  paper_url: '',
  publication_url: '',
  github_url: '',
  project_id: null,
});

const fromResearch = (r: Research): FormState => ({
  title: r.title,
  slug: r.slug,
  abstract: r.abstract ?? '',
  methodology: r.methodology ?? '',
  results: r.results ?? '',
  conclusion: r.conclusion ?? '',
  paper_url: r.paper_url ?? '',
  publication_url: r.publication_url ?? '',
  github_url: r.github_url ?? '',
  project_id: r.project_id,
});

const orNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

const buildPayload = (f: FormState): ResearchWritePayload => ({
  title: f.title.trim(),
  slug: f.slug.trim() || undefined,
  abstract: orNull(f.abstract),
  methodology: orNull(f.methodology),
  results: orNull(f.results),
  conclusion: orNull(f.conclusion),
  paper_url: orNull(f.paper_url),
  publication_url: orNull(f.publication_url),
  github_url: orNull(f.github_url),
  project_id: f.project_id,
});

export function ResearchEditor({ initial }: { initial?: Research }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(() => (initial ? fromResearch(initial) : empty()));
  const [id, setId] = useState<string | undefined>(initial?.id);
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [statusValue, setStatusValue] = useState<ContentStatus>(initial?.status ?? 'draft');
  const [slugEdited, setSlugEdited] = useState(isEdit);

  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const isDirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);
  useUnsavedChanges(isDirty);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const canSave = Boolean(form.title.trim());

  const apply = (r: Research) => {
    const next = fromResearch(r);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setId(r.id);
    setSlug(r.slug);
    setStatusValue(r.status);
  };

  async function save(): Promise<Research | null> {
    setSaving(true);
    setSaveError(null);
    try {
      const r = isEdit
        ? await adminFetch<Research>(`/research/${id}`, {
            method: 'PUT',
            body: JSON.stringify(buildPayload(form)),
          })
        : await adminFetch<Research>('/research', {
            method: 'POST',
            body: JSON.stringify(buildPayload(form)),
          });
      apply(r);
      if (!isEdit) router.replace(`/admin/research/${r.id}`);
      return r;
    } catch (e) {
      setSaveError(e instanceof AdminApiError ? e.body.message : 'Unable to save.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  const onSave = async () => {
    if (await save()) push('Draft saved.', 'success');
  };
  const onPreview = async () => {
    const target = isDirty || !id ? await save() : initial;
    if (target) window.open(`/preview/research/${target.slug}`, '_blank');
  };
  const doPublish = async () => {
    const saved = isDirty || !id ? await save() : (initial ?? null);
    const rid = saved?.id ?? id;
    setPublishOpen(false);
    if (!rid) return;
    try {
      apply(await adminFetch<Research>(`/research/${rid}/publish`, { method: 'POST' }));
      push('Research published.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Unable to publish.', 'error');
    }
  };
  const transition = async (action: 'unpublish' | 'archive') => {
    if (!id) return;
    try {
      apply(await adminFetch<Research>(`/research/${id}/${action}`, { method: 'POST' }));
      push(action === 'archive' ? 'Research archived.' : 'Research unpublished.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
    }
  };
  const onDelete = async () => {
    if (!id) return;
    try {
      await adminFetch(`/research/${id}`, { method: 'DELETE' });
      router.push('/admin/research');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
      setDeleteOpen(false);
    }
  };

  return (
    <div className="pb-24">
      <PublishingActions
        title={isEdit ? form.title || 'Untitled research' : 'New Research'}
        status={statusValue}
        isDirty={isDirty}
        saving={saving}
        canSave={canSave}
        onSave={onSave}
        onPreview={onPreview}
        onPublish={() => setPublishOpen(true)}
        onUnpublish={() => void transition('unpublish')}
        onArchive={() => setArchiveOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {saveError ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{saveError} Your changes are still here.</span>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Section title="Overview">
          <Field label="Title" required>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: slugEdited ? f.slug : slugify(e.target.value),
                }))
              }
            />
          </Field>
          <Field label="Slug">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set('slug', slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Related project" hint="Links this research to a project.">
            <ProjectSelect value={form.project_id} onChange={(v) => set('project_id', v)} />
          </Field>
        </Section>

        <Section title="Abstract">
          <MarkdownEditor
            value={form.abstract}
            onChange={(v) => set('abstract', v)}
            rows={6}
            ariaLabel="Abstract"
          />
        </Section>
        <Section title="Methodology">
          <MarkdownEditor
            value={form.methodology}
            onChange={(v) => set('methodology', v)}
            rows={8}
            ariaLabel="Methodology"
          />
        </Section>
        <Section title="Results">
          <MarkdownEditor
            value={form.results}
            onChange={(v) => set('results', v)}
            rows={8}
            ariaLabel="Results"
          />
        </Section>
        <Section title="Conclusion">
          <MarkdownEditor
            value={form.conclusion}
            onChange={(v) => set('conclusion', v)}
            rows={6}
            ariaLabel="Conclusion"
          />
        </Section>

        <Section title="Links">
          <Field label="Paper URL">
            <input
              className={inputClass}
              value={form.paper_url}
              onChange={(e) => set('paper_url', e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Publication URL">
            <input
              className={inputClass}
              value={form.publication_url}
              onChange={(e) => set('publication_url', e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="GitHub URL">
            <input
              className={inputClass}
              value={form.github_url}
              onChange={(e) => set('github_url', e.target.value)}
              placeholder="https://github.com/…"
            />
          </Field>
        </Section>
      </div>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this research?"
        confirmLabel="Publish"
        busy={saving}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => void doPublish()}
      >
        <p>
          Publicly visible at{' '}
          <span className="font-mono text-gray-800">/research/{form.slug || slug}</span>.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={archiveOpen}
        title="Archive this research?"
        confirmLabel="Archive"
        destructive
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => {
          setArchiveOpen(false);
          void transition('archive');
        }}
      >
        <p>It will no longer appear publicly, but is not deleted.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this research permanently?"
        confirmLabel="Delete"
        destructive
        requireTyped="DELETE"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void onDelete()}
      >
        <p>
          This permanently deletes <strong>{form.title}</strong>.
        </p>
      </ConfirmDialog>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
