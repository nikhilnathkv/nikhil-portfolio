'use client';

import { useEffect, useState } from 'react';

import { inputClass } from '@/components/admin/ui/form';
import { adminFetch } from '@/lib/admin/client-api';
import type { ProjectListItem } from '@/lib/admin/project-types';

/** Single related-project picker (a dropdown over existing projects). */
export function ProjectSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    let active = true;
    adminFetch<ProjectListItem[]>('/projects?page_size=100&sort=updated_at')
      .then((list) => active && setProjects(list.map((p) => ({ id: p.id, title: p.title }))))
      .catch(() => active && setProjects([]));
    return () => {
      active = false;
    };
  }, []);

  return (
    <select
      aria-label="Related project"
      className={inputClass}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">None</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.title}
        </option>
      ))}
    </select>
  );
}
