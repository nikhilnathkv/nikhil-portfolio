'use client';

import { Field, inputClass } from '@/components/admin/ui/form';

/**
 * Reusable SEO fields + Google-style search preview. Shared by Project, Blog,
 * Research (and later Experiment) editors.
 */
export function SeoEditor({
  seoTitle,
  seoDescription,
  slug,
  titleFallback,
  descriptionFallback,
  pathPrefix = 'projects',
  onChangeTitle,
  onChangeDescription,
}: {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  titleFallback?: string;
  descriptionFallback?: string;
  pathPrefix?: string;
  onChangeTitle: (v: string) => void;
  onChangeDescription: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="SEO title">
        <input
          className={inputClass}
          value={seoTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
        />
      </Field>
      <Field label="SEO description">
        <textarea
          className={inputClass}
          rows={2}
          value={seoDescription}
          onChange={(e) => onChangeDescription(e.target.value)}
        />
      </Field>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Google search preview
        </p>
        <p className="text-base text-[#1a0dab]">{seoTitle || titleFallback || 'Title'}</p>
        <p className="text-sm text-[#006621]">
          nikhilnath.dev/{pathPrefix}/{slug || 'slug'}
        </p>
        <p className="text-sm text-gray-600">
          {seoDescription || descriptionFallback || 'A short description.'}
        </p>
      </div>
    </div>
  );
}
