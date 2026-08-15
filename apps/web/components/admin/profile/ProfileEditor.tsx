'use client';

import { useEffect, useMemo, useState } from 'react';

import { MediaPicker } from '@/components/admin/media/MediaPicker';
import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { Profile, ProfileWritePayload, Resume } from '@/lib/admin/profile-types';

interface FormState {
  name: string;
  headline: string;
  location: string;
  short_bio: string;
  long_bio: string;
  email: string;
  linkedin_url: string;
  github_url: string;
  education: string;
  certifications: string;
  profile_image_id: string | null;
  resume_id: string | null;
}

function emptyForm(): FormState {
  return {
    name: '',
    headline: '',
    location: '',
    short_bio: '',
    long_bio: '',
    email: '',
    linkedin_url: '',
    github_url: '',
    education: '',
    certifications: '',
    profile_image_id: null,
    resume_id: null,
  };
}

function fromProfile(p: Profile): FormState {
  return {
    name: p.name,
    headline: p.headline,
    location: p.location ?? '',
    short_bio: p.short_bio,
    long_bio: p.long_bio,
    email: p.email ?? '',
    linkedin_url: p.linkedin_url ?? '',
    github_url: p.github_url ?? '',
    education: p.education ?? '',
    certifications: p.certifications ?? '',
    profile_image_id: p.profile_image_id,
    resume_id: p.resume_id,
  };
}

const orNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

function buildPayload(f: FormState): ProfileWritePayload {
  return {
    name: f.name.trim(),
    headline: f.headline.trim(),
    short_bio: f.short_bio.trim(),
    long_bio: f.long_bio.trim(),
    location: orNull(f.location),
    email: orNull(f.email),
    linkedin_url: orNull(f.linkedin_url),
    github_url: orNull(f.github_url),
    education: orNull(f.education),
    certifications: orNull(f.certifications),
    profile_image_id: f.profile_image_id,
    resume_id: f.resume_id,
  };
}

function ResumeSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminFetch<Resume[]>('/resumes')
      .then((r) => active && setResumes(r))
      .catch(() => active && setResumes([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading resumes…</p>;
  if (resumes.length === 0)
    return <p className="text-sm text-gray-400">No resumes yet — add one under Resume (M3.5).</p>;

  return (
    <select
      aria-label="Select resume"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={inputClass}
    >
      <option value="">None</option>
      {resumes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name} ({r.version}){r.is_active ? ' · active' : ''}
        </option>
      ))}
    </select>
  );
}

export function ProfileEditor({ initial }: { initial: Profile | null }) {
  const [form, setForm] = useState<FormState>(() => (initial ? fromProfile(initial) : emptyForm()));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const isDirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);
  useUnsavedChanges(isDirty);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSave =
    form.name.trim() && form.headline.trim() && form.short_bio.trim() && form.long_bio.trim();

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await adminFetch<Profile>('/profile', {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      const next = fromProfile(saved);
      setForm(next);
      setSavedSnapshot(JSON.stringify(next));
      push('Profile saved.', 'success');
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
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
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
        <div
          className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
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
        <Section id="identity" title="Identity">
          <Field label="Name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
          <Field
            label="Headline"
            required
            hint="e.g. AI/ML Engineer | GenAI • Agentic AI • ML Systems"
          >
            <input
              className={inputClass}
              value={form.headline}
              onChange={(e) => set('headline', e.target.value)}
            />
          </Field>
          <Field label="Location">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>
        </Section>

        <Section id="summary" title="Professional Summary">
          <Field label="Short bio" required hint="Homepage, project cards, metadata.">
            <textarea
              className={inputClass}
              rows={3}
              value={form.short_bio}
              onChange={(e) => set('short_bio', e.target.value)}
            />
          </Field>
          <Field label="Long bio" required hint="About page, recruiter view.">
            <textarea
              className={inputClass}
              rows={6}
              value={form.long_bio}
              onChange={(e) => set('long_bio', e.target.value)}
            />
          </Field>
        </Section>

        <Section id="contact" title="Contact">
          <Field label="Professional email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
        </Section>

        <Section id="social" title="Social Links">
          <Field label="LinkedIn">
            <input
              className={inputClass}
              value={form.linkedin_url}
              onChange={(e) => set('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
          <Field label="GitHub">
            <input
              className={inputClass}
              value={form.github_url}
              onChange={(e) => set('github_url', e.target.value)}
              placeholder="https://github.com/…"
            />
          </Field>
        </Section>

        <Section id="resume-content" title="Resume content">
          <Field label="Education" hint="Markdown list — shown on /resume. e.g. - BSc, University (Year)">
            <textarea
              className={inputClass}
              rows={4}
              value={form.education}
              onChange={(e) => set('education', e.target.value)}
            />
          </Field>
          <Field label="Certifications" hint="Markdown list — shown on /resume.">
            <textarea
              className={inputClass}
              rows={4}
              value={form.certifications}
              onChange={(e) => set('certifications', e.target.value)}
            />
          </Field>
        </Section>

        <Section id="image" title="Profile Image">
          <MediaPicker
            value={form.profile_image_id}
            onChange={(id) => set('profile_image_id', id)}
          />
        </Section>

        <Section id="resume" title="Resume">
          <ResumeSelect value={form.resume_id} onChange={(id) => set('resume_id', id)} />
        </Section>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
