'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import type { ProjectListItem } from '@/lib/admin/project-types';

export type RowAction = 'publish' | 'unpublish' | 'duplicate' | 'archive' | 'delete';

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RowMenu({
  project,
  onAction,
}: {
  project: ProjectListItem;
  onAction: (action: RowAction, project: ProjectListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const item = 'block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Actions for ${project.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md px-2 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100"
      >
        ⋮
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          <Link href={`/admin/projects/${project.id}`} role="menuitem" className={item}>
            Edit
          </Link>
          <Link
            href={`/preview/projects/${project.slug}`}
            target="_blank"
            role="menuitem"
            className={item}
          >
            Preview
          </Link>
          {project.status === 'published' ? (
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                onAction('unpublish', project);
              }}
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                onAction('publish', project);
              }}
            >
              Publish
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              onAction('duplicate', project);
            }}
          >
            Duplicate
          </button>
          {project.status !== 'archived' ? (
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                onAction('archive', project);
              }}
            >
              Archive
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={`${item} text-red-600 hover:bg-red-50`}
            onClick={() => {
              setOpen(false);
              onAction('delete', project);
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ProjectTable({
  projects,
  onToggleFeatured,
  onAction,
}: {
  projects: ProjectListItem[];
  onToggleFeatured: (project: ProjectListItem) => void;
  onAction: (action: RowAction, project: ProjectListItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
            <th className="px-4 py-3 font-semibold">Project</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Featured</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="font-medium text-gray-900 hover:text-indigo-700"
                >
                  {p.title}
                </Link>
                {p.category ? <p className="mt-0.5 text-xs text-gray-400">{p.category}</p> : null}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  aria-label={p.featured ? 'Unfeature project' : 'Feature project'}
                  aria-pressed={p.featured}
                  onClick={() => onToggleFeatured(p)}
                  className={`text-lg leading-none transition ${
                    p.featured ? 'text-amber-400' : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  {p.featured ? '★' : '☆'}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-500">{formatUpdated(p.updated_at)}</td>
              <td className="px-4 py-3 text-right">
                <RowMenu project={p} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
