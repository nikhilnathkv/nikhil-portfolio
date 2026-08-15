'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { MetricEditor } from '@/components/admin/projects/MetricEditor';
import { ProjectSelect } from '@/components/admin/projects/ProjectSelect';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { MarkdownEditor } from '@/components/cms/MarkdownEditor';
import { PublishingActions } from '@/components/cms/PublishingActions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { Experiment, ExperimentWritePayload } from '@/lib/admin/experiment-types';
import type { ContentStatus, ProjectMetric } from '@/lib/admin/project-types';
import { slugify } from '@/lib/admin/projects';

interface FormState {
  title: string;
  slug: string;
  hypothesis: string;
  method: string;
  results: string;
  conclusion: string;
  project_id: string | null;
  github_url: string;
  metrics: ProjectMetric[];
}

const empty = (): FormState => ({
  title: '',
  slug: '',
  hypothesis: '',
  method: '',
  results: '',
  conclusion: '',
  project_id: null,
  github_url: '',
  metrics: [],
});

const fromExperiment = (e: Experiment): FormState => ({
  title: e.title,
  slug: e.slug,
  hypothesis: e.hypothesis ?? '',
  method: e.method ?? '',
  results: e.results ?? '',
  conclusion: e.conclusion ?? '',
  project_id: e.project_id,
  github_url: e.github_url ?? '',
  metrics: e.metrics,
});

const orNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

const buildPayload = (f: FormState): ExperimentWritePayload => ({
  title: f.title.trim(),
  slug: f.slug.trim() || undefined,
  hypothesis: orNull(f.hypothesis),
  method: orNull(f.method),
  results: orNull(f.results),
  conclusion: orNull(f.conclusion),
  project_id: f.project_id,
  github_url: orNull(f.github_url),
  metrics: f.metrics
    .filter((m) => m.name.trim() && m.value.trim())
    .map((m, i) => ({
      name: m.name.trim(),
      value: m.value.trim(),
      unit: orNull(m.unit ?? ''),
      description: orNull(m.description ?? ''),
      display_order: i,
    })),
});

export function ExperimentEditor({ initial }: { initial?: Experiment }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(() => (initial ? fromExperiment(initial) : empty()));
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

  const apply = (e: Experiment) => {
    const next = fromExperiment(e);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setId(e.id);
    setSlug(e.slug);
    setStatusValue(e.status);
  };

  async function save(): Promise<Experiment | null> {
    setSaving(true);
    setSaveError(null);
    try {
      const e = isEdit
        ? await adminFetch<Experiment>(`/experiments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(buildPayload(form)),
          })
        : await adminFetch<Experiment>('/experiments', {
            method: 'POST',
            body: JSON.stringify(buildPayload(form)),
          });
      apply(e);
      if (!isEdit) router.replace(`/admin/experiments/${e.id}`);
      return e;
    } catch (err) {
      setSaveError(err instanceof AdminApiError ? err.body.message : 'Unable to save.');
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
    if (target) window.open(`/preview/experiments/${target.slug}`, '_blank');
  };
  const doPublish = async () => {
    const saved = isDirty || !id ? await save() : (initial ?? null);
    const eid = saved?.id ?? id;
    setPublishOpen(false);
    if (!eid) return;
    try {
      apply(await adminFetch<Experiment>(`/experiments/${eid}/publish`, { method: 'POST' }));
      push('Experiment published.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Unable to publish.', 'error');
    }
  };
  const transition = async (action: 'unpublish' | 'archive') => {
    if (!id) return;
    try {
      apply(await adminFetch<Experiment>(`/experiments/${id}/${action}`, { method: 'POST' }));
      push(action === 'archive' ? 'Experiment archived.' : 'Experiment unpublished.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
    }
  };
  const onDelete = async () => {
    if (!id) return;
    try {
      await adminFetch(`/experiments/${id}`, { method: 'DELETE' });
      router.push('/admin/experiments');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
      setDeleteOpen(false);
    }
  };

  return (
    <div className="pb-24">
      <PublishingActions
        title={isEdit ? form.title || 'Untitled experiment' : 'New Experiment'}
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
        <div
          className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Related project" hint="Experiments behind a project.">
              <ProjectSelect value={form.project_id} onChange={(v) => set('project_id', v)} />
            </Field>
            <Field label="GitHub URL">
              <input
                className={inputClass}
                value={form.github_url}
                onChange={(e) => set('github_url', e.target.value)}
                placeholder="https://github.com/…"
              />
            </Field>
          </div>
        </Section>

        <Section title="Hypothesis">
          <MarkdownEditor
            value={form.hypothesis}
            onChange={(v) => set('hypothesis', v)}
            rows={4}
            ariaLabel="Hypothesis"
          />
        </Section>
        <Section title="Method">
          <MarkdownEditor
            value={form.method}
            onChange={(v) => set('method', v)}
            rows={6}
            ariaLabel="Method"
          />
        </Section>
        <Section title="Results">
          <MarkdownEditor
            value={form.results}
            onChange={(v) => set('results', v)}
            rows={6}
            ariaLabel="Results"
          />
        </Section>
        <Section title="Conclusion">
          <MarkdownEditor
            value={form.conclusion}
            onChange={(v) => set('conclusion', v)}
            rows={4}
            ariaLabel="Conclusion"
          />
        </Section>

        <Section title="Metrics">
          <MetricEditor metrics={form.metrics} onChange={(m) => set('metrics', m)} />
        </Section>
      </div>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this experiment?"
        confirmLabel="Publish"
        busy={saving}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => void doPublish()}
      >
        <p>
          Publicly visible at{' '}
          <span className="font-mono text-gray-800">/experiments/{form.slug || slug}</span>.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={archiveOpen}
        title="Archive this experiment?"
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
        title="Delete this experiment permanently?"
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
