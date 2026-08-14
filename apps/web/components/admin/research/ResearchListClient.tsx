'use client';

import { ContentListShell, type Column } from '@/components/cms/ContentListShell';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import type { ResearchListItem } from '@/lib/admin/research-types';

const columns: Column<ResearchListItem>[] = [
  { header: 'Title', cell: (r) => <span className="font-medium text-gray-900">{r.title}</span> },
  { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
  {
    header: 'Project',
    cell: (r) =>
      r.project ? (
        <span className="text-gray-600">{r.project.title}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
  {
    header: 'Published',
    cell: (r) =>
      r.published_at ? (
        <span className="text-gray-500">
          {new Date(r.published_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
];

export function ResearchListClient() {
  return (
    <ContentListShell<ResearchListItem>
      basePath="/research"
      adminBase="/admin/research"
      previewBase="/preview/research"
      publicBase="/research"
      columns={columns}
      searchPlaceholder="Search research…"
      newHref="/admin/research/new"
      newLabel="+ New Research"
      emptyTitle="No research yet"
      emptyDescription="Document your research work."
    />
  );
}
