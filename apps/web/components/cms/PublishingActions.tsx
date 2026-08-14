'use client';

import { useEffect, useRef, useState } from 'react';

import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import type { ContentStatus } from '@/lib/admin/project-types';

export interface PublishingActionsProps {
  title: string;
  status: ContentStatus;
  isDirty: boolean;
  saving: boolean;
  canSave: boolean;
  savedLabel?: string | null;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function PublishingActions({
  title,
  status,
  isDirty,
  saving,
  canSave,
  savedLabel,
  onSave,
  onPreview,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
}: PublishingActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const btnGhost =
    'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50';
  const btnPrimary =
    'rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50';
  const item = 'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50';

  const overflow: { label: string; onClick: () => void; danger?: boolean }[] = [];
  if (status === 'published') {
    overflow.push({ label: 'Unpublish', onClick: onUnpublish });
    overflow.push({ label: 'Archive', onClick: onArchive });
  }
  if (status === 'draft' || status === 'archived') {
    overflow.push({ label: 'Delete', onClick: onDelete, danger: true });
  }

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <StatusBadge status={status} />
        {isDirty ? <span className="text-xs font-medium text-amber-600">Unsaved</span> : null}
      </div>
      <div className="flex items-center gap-2">
        {savedLabel ? <span className="mr-1 text-xs text-gray-400">{savedLabel}</span> : null}
        <button type="button" onClick={onPreview} disabled={saving} className={btnGhost}>
          Preview
        </button>
        <button type="button" onClick={onSave} disabled={saving || !canSave} className={btnGhost}>
          {status === 'draft' ? 'Save Draft' : 'Save Changes'}
        </button>
        {status !== 'published' ? (
          <button type="button" onClick={onPublish} disabled={saving} className={btnPrimary}>
            {status === 'archived' ? 'Republish' : 'Publish'}
          </button>
        ) : null}
        {overflow.length > 0 ? (
          <div ref={ref} className="relative">
            <button
              type="button"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-md border border-gray-300 bg-white px-2 py-2 text-lg leading-none text-gray-500 hover:bg-gray-50"
            >
              ⋮
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
              >
                {overflow.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      a.onClick();
                    }}
                    className={`${item} ${a.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
