'use client';

import { useState } from 'react';

import { ContentListShell, type Column } from '@/components/cms/ContentListShell';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { BLOG_CATEGORIES } from '@/lib/admin/blog';
import type { BlogPostListItem } from '@/lib/admin/blog-types';

const columns: Column<BlogPostListItem>[] = [
  {
    header: 'Article',
    cell: (p) => (
      <div>
        <span className="font-medium text-gray-900">{p.title}</span>
        {p.category ? <p className="mt-0.5 text-xs text-gray-400">{p.category}</p> : null}
      </div>
    ),
  },
  { header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
  {
    header: 'Published',
    cell: (p) =>
      p.published_at ? (
        <span className="text-gray-500">
          {new Date(p.published_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
];

const selectClass =
  'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export function BlogListClient() {
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');

  return (
    <ContentListShell<BlogPostListItem>
      basePath="/blog"
      adminBase="/admin/blog"
      previewBase="/preview/blog"
      publicBase="/blog"
      columns={columns}
      searchPlaceholder="Search articles…"
      newHref="/admin/blog/new"
      newLabel="+ New Article"
      emptyTitle="No articles yet"
      emptyDescription="Start writing your first post."
      extraQuery={{ category: category || undefined, tag: tag || undefined }}
      filterControls={
        <>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            <option value="">All categories</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            aria-label="Filter by tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag…"
            className={`${selectClass} w-28`}
          />
        </>
      }
    />
  );
}
