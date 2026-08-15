'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { MediaPicker } from '@/components/admin/media/MediaPicker';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { MarkdownEditor } from '@/components/cms/MarkdownEditor';
import { PublishingActions } from '@/components/cms/PublishingActions';
import { SeoEditor } from '@/components/cms/SeoEditor';
import { TagInput } from '@/components/cms/TagInput';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import { BLOG_CATEGORIES } from '@/lib/admin/blog';
import type { BlogPost, BlogWritePayload } from '@/lib/admin/blog-types';
import type { ContentStatus } from '@/lib/admin/project-types';
import { slugify } from '@/lib/admin/projects';

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featured: boolean;
  cover_image_id: string | null;
  seo_title: string;
  seo_description: string;
  tags: string[];
}

const empty = (): FormState => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  featured: false,
  cover_image_id: null,
  seo_title: '',
  seo_description: '',
  tags: [],
});

const fromPost = (p: BlogPost): FormState => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt ?? '',
  content: p.content,
  category: p.category ?? '',
  featured: p.featured,
  cover_image_id: p.cover_image_id,
  seo_title: p.seo_title ?? '',
  seo_description: p.seo_description ?? '',
  tags: p.tags.map((t) => t.name),
});

const orNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

const buildPayload = (f: FormState): BlogWritePayload => ({
  title: f.title.trim(),
  slug: f.slug.trim() || undefined,
  excerpt: orNull(f.excerpt),
  content: f.content,
  category: orNull(f.category),
  featured: f.featured,
  cover_image_id: f.cover_image_id,
  seo_title: orNull(f.seo_title),
  seo_description: orNull(f.seo_description),
  tags: f.tags,
});

export function BlogEditor({ initial }: { initial?: BlogPost }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(() => (initial ? fromPost(initial) : empty()));
  const [postId, setPostId] = useState<string | undefined>(initial?.id);
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

  const canSave = Boolean(form.title.trim() && form.content.trim());

  const apply = (p: BlogPost) => {
    const next = fromPost(p);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setPostId(p.id);
    setSlug(p.slug);
    setStatusValue(p.status);
  };

  async function save(): Promise<BlogPost | null> {
    setSaving(true);
    setSaveError(null);
    try {
      const p = isEdit
        ? await adminFetch<BlogPost>(`/blog/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(buildPayload(form)),
          })
        : await adminFetch<BlogPost>('/blog', {
            method: 'POST',
            body: JSON.stringify(buildPayload(form)),
          });
      apply(p);
      if (!isEdit) router.replace(`/admin/blog/${p.id}`);
      return p;
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
    const target = isDirty || !postId ? await save() : initial;
    if (target) window.open(`/preview/blog/${target.slug}`, '_blank');
  };

  const doPublish = async () => {
    const saved = isDirty || !postId ? await save() : (initial ?? null);
    const id = saved?.id ?? postId;
    setPublishOpen(false);
    if (!id) return;
    try {
      apply(await adminFetch<BlogPost>(`/blog/${id}/publish`, { method: 'POST' }));
      push('Post published.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Unable to publish.', 'error');
    }
  };

  const transition = async (action: 'unpublish' | 'archive') => {
    if (!postId) return;
    try {
      apply(await adminFetch<BlogPost>(`/blog/${postId}/${action}`, { method: 'POST' }));
      push(action === 'archive' ? 'Post archived.' : 'Post unpublished.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
    }
  };

  const onDelete = async () => {
    if (!postId) return;
    try {
      await adminFetch(`/blog/${postId}`, { method: 'DELETE' });
      router.push('/admin/blog');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
      setDeleteOpen(false);
    }
  };

  return (
    <div className="pb-24">
      <PublishingActions
        title={isEdit ? form.title || 'Untitled post' : 'New Post'}
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
        <Section title="Metadata">
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
          <Field label="Slug" hint="The public URL path.">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set('slug', slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Excerpt" hint="Short summary for cards and previews.">
            <textarea
              className={inputClass}
              rows={2}
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                <option value="">Uncategorized</option>
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tags">
              <TagInput value={form.tags} onChange={(t) => set('tags', t)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            ⭐ Featured post
          </label>
        </Section>

        <Section title="Content">
          <MarkdownEditor value={form.content} onChange={(v) => set('content', v)} />
        </Section>

        <Section title="Cover image">
          <MediaPicker value={form.cover_image_id} onChange={(id) => set('cover_image_id', id)} />
        </Section>

        <Section title="SEO">
          <SeoEditor
            seoTitle={form.seo_title}
            seoDescription={form.seo_description}
            slug={form.slug}
            titleFallback={form.title}
            descriptionFallback={form.excerpt}
            pathPrefix="blog"
            onChangeTitle={(v) => set('seo_title', v)}
            onChangeDescription={(v) => set('seo_description', v)}
          />
        </Section>
      </div>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this post?"
        confirmLabel="Publish"
        busy={saving}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => void doPublish()}
      >
        <p>
          Publicly visible at{' '}
          <span className="font-mono text-gray-800">/blog/{form.slug || slug}</span>.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive this post?"
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
        title="Delete this post permanently?"
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
