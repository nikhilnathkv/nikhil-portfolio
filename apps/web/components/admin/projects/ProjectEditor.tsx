'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { MetricEditor } from '@/components/admin/projects/MetricEditor';
import { SkillSelector } from '@/components/admin/projects/SkillSelector';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type {
  ContentStatus,
  Project,
  ProjectMetric,
  ProjectWritePayload,
  Skill,
} from '@/lib/admin/project-types';
import { CATEGORIES, MAX_SHORT_DESCRIPTION, slugify } from '@/lib/admin/projects';

interface FormState {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  problem: string;
  solution: string;
  architecture: string;
  engineering_decisions: string;
  challenges: string;
  lessons_learned: string;
  category: string;
  github_url: string;
  live_url: string;
  hero_image_url: string;
  architecture_diagram_url: string;
  seo_title: string;
  seo_description: string;
  featured: boolean;
  display_order: number;
  metrics: ProjectMetric[];
  skills: Skill[];
}

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'story', label: 'Technical Story' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'technologies', label: 'Technologies' },
  { id: 'links', label: 'Links' },
  { id: 'media', label: 'Media' },
  { id: 'seo', label: 'SEO' },
] as const;

function emptyForm(): FormState {
  return {
    title: '',
    slug: '',
    short_description: '',
    description: '',
    problem: '',
    solution: '',
    architecture: '',
    engineering_decisions: '',
    challenges: '',
    lessons_learned: '',
    category: '',
    github_url: '',
    live_url: '',
    hero_image_url: '',
    architecture_diagram_url: '',
    seo_title: '',
    seo_description: '',
    featured: false,
    display_order: 0,
    metrics: [],
    skills: [],
  };
}

function fromProject(p: Project): FormState {
  return {
    title: p.title,
    slug: p.slug,
    short_description: p.short_description,
    description: p.description ?? '',
    problem: p.problem ?? '',
    solution: p.solution ?? '',
    architecture: p.architecture ?? '',
    engineering_decisions: p.engineering_decisions ?? '',
    challenges: p.challenges ?? '',
    lessons_learned: p.lessons_learned ?? '',
    category: p.category ?? '',
    github_url: p.github_url ?? '',
    live_url: p.live_url ?? '',
    hero_image_url: p.hero_image_url ?? '',
    architecture_diagram_url: p.architecture_diagram_url ?? '',
    seo_title: p.seo_title ?? '',
    seo_description: p.seo_description ?? '',
    featured: p.featured,
    display_order: p.display_order,
    metrics: p.metrics,
    skills: p.skills,
  };
}

/** '' → undefined; a plain URL/text field left blank is sent as null. */
function orNull(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}

function buildPayload(form: FormState): ProjectWritePayload {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    short_description: form.short_description.trim(),
    description: orNull(form.description),
    problem: orNull(form.problem),
    solution: orNull(form.solution),
    architecture: orNull(form.architecture),
    engineering_decisions: orNull(form.engineering_decisions),
    challenges: orNull(form.challenges),
    lessons_learned: orNull(form.lessons_learned),
    category: orNull(form.category),
    featured: form.featured,
    display_order: form.display_order,
    github_url: orNull(form.github_url),
    live_url: orNull(form.live_url),
    hero_image_url: orNull(form.hero_image_url),
    architecture_diagram_url: orNull(form.architecture_diagram_url),
    seo_title: orNull(form.seo_title),
    seo_description: orNull(form.seo_description),
    skill_ids: form.skills.map((s) => s.id),
    metrics: form.metrics
      .filter((m) => m.name.trim() && m.value.trim())
      .map((m, i) => ({
        name: m.name.trim(),
        value: m.value.trim(),
        unit: orNull(m.unit ?? ''),
        description: orNull(m.description ?? ''),
        display_order: i,
      })),
  };
}

export function ProjectEditor({ initial }: { initial?: Project }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<FormState>(() => (initial ? fromProject(initial) : emptyForm()));
  const [projectId, setProjectId] = useState<string | undefined>(initial?.id);
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [statusValue, setStatusValue] = useState<ContentStatus>(initial?.status ?? 'draft');
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);

  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  // `now` drives the "saved Ns ago" label without reading a clock during render.
  const [now, setNow] = useState(() => Date.now());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [slugConfirmOpen, setSlugConfirmOpen] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  const isDirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);
  useUnsavedChanges(isDirty);

  // Load the skill vocabulary for the technology selector.
  useEffect(() => {
    adminFetch<Skill[]>('/skills')
      .then(setAvailableSkills)
      .catch(() => setAvailableSkills([]));
  }, []);

  // Advance the clock the "saved Ns ago" label reads from, roughly every 5s.
  useEffect(() => {
    if (lastSavedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      // Auto-fill the slug from the title until the user edits it by hand.
      slug: slugManuallyEdited ? f.slug : slugify(value),
    }));
  };

  async function save(): Promise<Project | null> {
    setSaving(true);
    setSaveError(null);
    const payload = buildPayload(form);
    try {
      const project = isEdit
        ? await adminFetch<Project>(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await adminFetch<Project>('/projects', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      const nextForm = fromProject(project);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
      setProjectId(project.id);
      setSlug(project.slug);
      setStatusValue(project.status);
      setLastSavedAt(Date.now());
      setNow(Date.now());

      if (!isEdit) {
        // Move from /new to the stable edit URL without a full reload.
        router.replace(`/admin/projects/${project.id}`);
      }
      return project;
    } catch (e) {
      const message =
        e instanceof AdminApiError ? e.body.message : 'Unable to save changes. Please try again.';
      setSaveError(message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  const onSaveDraft = async () => {
    const saved = await save();
    if (saved) push('Draft saved.', 'success');
  };

  const onPreview = async () => {
    // Persist first so the preview reflects the latest edits.
    if (isDirty || !projectId) {
      const saved = await save();
      if (!saved) return;
      window.open(`/preview/projects/${saved.slug}`, '_blank');
    } else {
      window.open(`/preview/projects/${slug}`, '_blank');
    }
  };

  const doPublish = async () => {
    // Save pending edits first, then publish.
    const saved = isDirty || !projectId ? await save() : (initial ?? null);
    const id = saved?.id ?? projectId;
    if (!id) {
      setPublishOpen(false);
      return;
    }
    try {
      const published = await adminFetch<Project>(`/projects/${id}/publish`, { method: 'POST' });
      setStatusValue(published.status);
      const nextForm = fromProject(published);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
      setSlug(published.slug);
      setPublishOpen(false);
      push('Project published.', 'success');
    } catch (e) {
      const message =
        e instanceof AdminApiError ? e.body.message : 'Unable to publish. Please try again.';
      setPublishOpen(false);
      push(message, 'error');
    }
  };

  const savedAgoLabel = () => {
    if (saving) return 'Saving…';
    if (lastSavedAt === null) return null;
    const secs = Math.max(0, Math.round((now - lastSavedAt) / 1000));
    if (secs < 5) return 'Draft saved just now';
    if (secs < 60) return `Draft saved ${secs}s ago`;
    const mins = Math.round(secs / 60);
    return `Draft saved ${mins}m ago`;
  };

  const shortLen = form.short_description.length;

  return (
    <div className="pb-24">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {isEdit ? form.title || 'Untitled project' : 'New Project'}
          </h1>
          <StatusBadge status={statusValue} />
          {isDirty ? <span className="text-xs font-medium text-amber-600">Unsaved</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {savedAgoLabel() ? (
            <span className="mr-1 text-xs text-gray-400">{savedAgoLabel()}</span>
          ) : null}
          <button
            type="button"
            onClick={onPreview}
            disabled={saving}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving || !form.title.trim() || !form.short_description.trim()}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      {saveError ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{saveError} Your changes are still here.</span>
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex gap-6">
        {/* Section nav */}
        <nav className="hidden w-40 shrink-0 lg:block">
          <ul className="sticky top-24 flex flex-col gap-1 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  {i + 1}. {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Section id="overview" title="① Overview">
            <Field label="Title" required>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enterprise AI Knowledge Platform"
              />
            </Field>
            <Field label="Slug" hint="The public URL path. Auto-generated from the title.">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  set('slug', slugify(e.target.value));
                }}
                onBlur={() => {
                  if (statusValue === 'published' && form.slug !== slug) setSlugConfirmOpen(true);
                }}
                placeholder="enterprise-ai-knowledge-platform"
              />
            </Field>
            <Field
              label="Short description"
              required
              hint={`${shortLen}/${MAX_SHORT_DESCRIPTION} — used as the project card description.`}
            >
              <textarea
                className={inputClass}
                rows={2}
                maxLength={MAX_SHORT_DESCRIPTION}
                value={form.short_description}
                onChange={(e) => set('short_description', e.target.value)}
              />
            </Field>
            <Field
              label="Overview"
              required
              hint="A longer summary shown at the top of the project page. Required to publish."
            >
              <textarea
                className={inputClass}
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Display order" hint="Lower numbers appear first.">
                <input
                  type="number"
                  className={inputClass}
                  value={form.display_order}
                  onChange={(e) => set('display_order', Number(e.target.value) || 0)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              ⭐ Featured project
            </label>
            <p className="text-xs text-gray-400">
              Publishing is done with the Publish button — not by editing a status field.
            </p>
          </Section>

          <Section id="story" title="② Technical Story">
            <Field label="Problem" hint="What problem existed?">
              <textarea
                className={inputClass}
                rows={4}
                value={form.problem}
                onChange={(e) => set('problem', e.target.value)}
              />
            </Field>
            <Field label="Solution" hint="What did you build?">
              <textarea
                className={inputClass}
                rows={4}
                value={form.solution}
                onChange={(e) => set('solution', e.target.value)}
              />
            </Field>
            <Field label="Engineering decisions" hint="Why these technologies / designs?">
              <textarea
                className={inputClass}
                rows={4}
                value={form.engineering_decisions}
                onChange={(e) => set('engineering_decisions', e.target.value)}
              />
            </Field>
            <Field label="Challenges" hint="Hard problems you hit — great interview material.">
              <textarea
                className={inputClass}
                rows={4}
                value={form.challenges}
                onChange={(e) => set('challenges', e.target.value)}
              />
            </Field>
            <Field label="Lessons learned" hint="What would you do differently?">
              <textarea
                className={inputClass}
                rows={4}
                value={form.lessons_learned}
                onChange={(e) => set('lessons_learned', e.target.value)}
              />
            </Field>
          </Section>

          <Section id="architecture" title="③ Architecture">
            <Field label="Architecture description" hint="Markdown. How does it work?">
              <textarea
                className={inputClass}
                rows={6}
                value={form.architecture}
                onChange={(e) => set('architecture', e.target.value)}
              />
            </Field>
            <Field label="Architecture diagram URL" hint="Optional — link to a diagram image.">
              <input
                className={inputClass}
                value={form.architecture_diagram_url}
                onChange={(e) => set('architecture_diagram_url', e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </Section>

          <Section id="metrics" title="④ Metrics">
            <MetricEditor metrics={form.metrics} onChange={(m) => set('metrics', m)} />
          </Section>

          <Section id="technologies" title="⑤ Technologies">
            <SkillSelector
              available={availableSkills}
              selected={form.skills}
              onChange={(s) => set('skills', s)}
            />
          </Section>

          <Section id="links" title="⑥ Links">
            <Field label="GitHub repository">
              <input
                className={inputClass}
                value={form.github_url}
                onChange={(e) => set('github_url', e.target.value)}
                placeholder="https://github.com/…"
              />
            </Field>
            <Field label="Live demo">
              <input
                className={inputClass}
                value={form.live_url}
                onChange={(e) => set('live_url', e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </Section>

          <Section id="media" title="⑦ Media">
            <Field label="Hero image URL" hint="Optional — shown at the top of the project page.">
              <input
                className={inputClass}
                value={form.hero_image_url}
                onChange={(e) => set('hero_image_url', e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <p className="rounded-md border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-400">
              A media library with uploads and screenshots is coming in a later milestone. For now,
              paste image URLs above and in the Architecture section.
            </p>
          </Section>

          <Section id="seo" title="⑧ SEO">
            <Field label="SEO title">
              <input
                className={inputClass}
                value={form.seo_title}
                onChange={(e) => set('seo_title', e.target.value)}
              />
            </Field>
            <Field label="SEO description">
              <textarea
                className={inputClass}
                rows={2}
                value={form.seo_description}
                onChange={(e) => set('seo_description', e.target.value)}
              />
            </Field>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Google search preview
              </p>
              <p className="text-base text-[#1a0dab]">
                {form.seo_title || form.title || 'Project title'}
              </p>
              <p className="text-sm text-[#006621]">
                nikhilnath.dev/projects/{form.slug || 'project-slug'}
              </p>
              <p className="text-sm text-gray-600">
                {form.seo_description ||
                  form.short_description ||
                  'A short description of the project.'}
              </p>
            </div>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this project?"
        confirmLabel="Publish"
        busy={saving}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => void doPublish()}
      >
        <p>
          This will make the project publicly visible at{' '}
          <span className="font-mono text-gray-800">/projects/{form.slug || slug}</span>.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={slugConfirmOpen}
        title="Change the public URL?"
        confirmLabel="Keep change"
        cancelLabel="Revert"
        onCancel={() => {
          set('slug', slug);
          setSlugConfirmOpen(false);
        }}
        onConfirm={() => setSlugConfirmOpen(false)}
      >
        <p>
          This project is published. Changing the slug changes its public URL and can break existing
          links.
        </p>
      </ConfirmDialog>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
