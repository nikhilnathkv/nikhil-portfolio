'use client';

import { useMemo, useState } from 'react';

import type { Skill } from '@/lib/admin/project-types';

export function SkillSelector({
  available,
  selected,
  onChange,
}: {
  available: Skill[];
  selected: Skill[];
  onChange: (next: Skill[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available
      .filter((s) => !selectedIds.has(s.id))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [available, selectedIds, query]);

  const add = (skill: Skill) => {
    onChange([...selected, skill]);
    setQuery('');
  };

  const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));

  return (
    <div>
      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
            >
              {s.name}
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() => remove(s.id)}
                className="text-indigo-400 hover:text-indigo-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <input
          type="text"
          value={query}
          aria-label="Search technologies"
          placeholder="Type to search technologies…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        {open && matches.length > 0 ? (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {matches.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(s)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && query.trim() && matches.length === 0 ? (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg">
            No matching skill. Add it under Skills first.
          </div>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        Reuses existing skills — manage the master list under Skills.
      </p>
    </div>
  );
}
