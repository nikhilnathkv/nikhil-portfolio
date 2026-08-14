'use client';

import { useEffect, useMemo, useState } from 'react';

import { adminFetch } from '@/lib/admin/client-api';
import type { ProjectListItem } from '@/lib/admin/project-types';
import type { ProjectRef } from '@/lib/admin/experience-types';

/**
 * Searchable multi-select over existing projects — mirrors SkillSelector, but
 * fetches its own options and works with light {id,title,slug} refs.
 */
export function ProjectSelector({
  selected,
  onChange,
}: {
  selected: ProjectRef[];
  onChange: (next: ProjectRef[]) => void;
}) {
  const [options, setOptions] = useState<ProjectRef[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    adminFetch<ProjectListItem[]>('/projects?page_size=100&sort=updated_at')
      .then(
        (list) =>
          active && setOptions(list.map((p) => ({ id: p.id, title: p.title, slug: p.slug }))),
      )
      .catch(() => active && setOptions([]));
    return () => {
      active = false;
    };
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !selectedIds.has(o.id))
      .filter((o) => (q ? o.title.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [options, selectedIds, query]);

  const add = (p: ProjectRef) => {
    onChange([...selected, p]);
    setQuery('');
  };
  const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));

  return (
    <div>
      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
            >
              {p.title}
              <button
                type="button"
                aria-label={`Remove ${p.title}`}
                onClick={() => remove(p.id)}
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
          aria-label="Search projects"
          placeholder="Type to search projects…"
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
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(p)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">Projects you built in this role.</p>
    </div>
  );
}
