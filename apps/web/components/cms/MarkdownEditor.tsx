'use client';

import { useState } from 'react';

import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import { inputClass } from '@/components/admin/ui/form';

/**
 * Markdown authoring: a plain textarea with a live preview tab that renders via
 * the same {@link MarkdownPreview} used by the public page (so what you see is
 * what ships). Deliberately not a WYSIWYG editor.
 */
export function MarkdownEditor({
  value,
  onChange,
  rows = 16,
  ariaLabel = 'Markdown content',
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  ariaLabel?: string;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1 text-sm font-medium transition ${
      active ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 p-1.5">
        <button type="button" className={tabClass(tab === 'write')} onClick={() => setTab('write')}>
          Write
        </button>
        <button
          type="button"
          className={tabClass(tab === 'preview')}
          onClick={() => setTab('preview')}
        >
          Preview
        </button>
        <span className="ml-auto pr-2 text-xs text-gray-400">
          Markdown · headings, lists, code, tables, links
        </span>
      </div>
      {tab === 'write' ? (
        <textarea
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={`${inputClass} rounded-t-none border-0 font-mono text-[13px] focus:ring-0`}
          placeholder="Write your content in Markdown…"
        />
      ) : (
        <div className="min-h-[8rem] px-4 py-3">
          {value.trim() ? (
            <MarkdownPreview content={value} />
          ) : (
            <p className="text-sm text-gray-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
