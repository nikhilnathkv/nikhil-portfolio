'use client';

import { useState } from 'react';

/** Free-form reusable tag chips → string[]. Enter or comma commits a tag. */
export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-medium text-indigo-700"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-indigo-400 hover:text-indigo-600"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        aria-label="Add tag"
        placeholder={value.length === 0 ? 'Add tags…' : ''}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        className="min-w-[8rem] flex-1 border-0 py-0.5 text-sm outline-none"
      />
    </div>
  );
}
