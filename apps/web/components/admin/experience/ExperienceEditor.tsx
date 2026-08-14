'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ProjectSelector } from '@/components/admin/projects/ProjectSelector';
import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { Experience, ExperienceWritePayload, ProjectRef } from '@/lib/admin/experience-types';

interface FormState {
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  summary: string;
  description: string;
  display_order: number;
  projects: ProjectRef[];
}

function emptyForm(): FormState {
  return {
    company: '',
    role: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    summary: '',
    description: '',
    display_order: 0,
    projects: [],
  };
}

function fromExperience(e: Experience): FormState {
  return {
    company: e.company,
    role: e.role,
    location: e.location ?? '',
    start_date: e.start_date,
    end_date: e.end_date ?? '',
    is_current: e.is_current,
    summary: e.summary ?? '',
    description: e.description ?? '',
    display_order: e.display_order,
    projects: e.projects,
  };
}

const orNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

function buildPayload(f: FormState): ExperienceWritePayload {
  return {
    company: f.company.trim(),
    role: f.role.trim(),
    location: orNull(f.location),
    start_date: f.start_date,
    end_date: f.is_current ? null : orNull(f.end_date),
    is_current: f.is_current,
    summary: orNull(f.summary),
    description: orNull(f.description),
    display_order: f.display_order,
    project_ids: f.projects.map((p) => p.id),
  };
}

export function ExperienceEditor({ initial }: { initial?: Experience }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromExperience(initial) : emptyForm(),
  );
  const [experienceId, setExperienceId] = useState<string | undefined>(initial?.id);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const isDirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);
  useUnsavedChanges(isDirty);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const dateError =
    !form.is_current && form.start_date && form.end_date && form.end_date < form.start_date
      ? 'End date cannot be earlier than start date.'
      : null;

  const canSave = Boolean(form.company.trim() && form.role.trim() && form.start_date && !dateError);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = buildPayload(form);
      const saved = isEdit
        ? await adminFetch<Experience>(`/experience/${experienceId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await adminFetch<Experience>('/experience', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      const next = fromExperience(saved);
      setForm(next);
      setSavedSnapshot(JSON.stringify(next));
      setExperienceId(saved.id);
      push('Experience saved.', 'success');
      if (!isEdit) router.replace(`/admin/experience/${saved.id}`);
    } catch (e) {
      setSaveError(
        e instanceof AdminApiError ? e.body.message : 'Unable to save. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {isEdit ? form.company || 'Experience' : 'New Experience'}
          </h1>
          {isDirty ? <span className="text-xs font-medium text-amber-600">Unsaved</span> : null}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !canSave}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saveError ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{saveError} Your changes are still here.</span>
          <button
            type="button"
            onClick={save}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Section title="Role">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company" required>
              <input
                className={inputClass}
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
              />
            </Field>
            <Field label="Role" required>
              <input
                className={inputClass}
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Location">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start date" required>
              <input
                type="date"
                className={inputClass}
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                className={inputClass}
                value={form.end_date}
                disabled={form.is_current}
                onChange={(e) => set('end_date', e.target.value)}
              />
            </Field>
          </div>
          {dateError ? <p className="text-sm text-red-600">{dateError}</p> : null}

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  is_current: e.target.checked,
                  end_date: e.target.checked ? '' : f.end_date,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            This is my current role
          </label>
          <p className="text-xs text-gray-400">
            Marking a role current clears its end date and unsets any other current role.
          </p>

          <Field label="Display order" hint="Lower numbers appear first.">
            <input
              type="number"
              className={inputClass}
              value={form.display_order}
              onChange={(e) => set('display_order', Number(e.target.value) || 0)}
            />
          </Field>
        </Section>

        <Section title="Narrative">
          <Field label="Summary" hint="A one-line summary of the role.">
            <textarea
              className={inputClass}
              rows={2}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>
          <Field label="Description" hint="What you did and delivered.">
            <textarea
              className={inputClass}
              rows={5}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Projects">
          <ProjectSelector selected={form.projects} onChange={(p) => set('projects', p)} />
        </Section>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
