'use client';

import { ContentListShell, type Column } from '@/components/cms/ContentListShell';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import type { ExperimentListItem } from '@/lib/admin/experiment-types';

const columns: Column<ExperimentListItem>[] = [
  { header: 'Title', cell: (e) => <span className="font-medium text-gray-900">{e.title}</span> },
  { header: 'Status', cell: (e) => <StatusBadge status={e.status} /> },
  {
    header: 'Project',
    cell: (e) =>
      e.project ? (
        <span className="text-gray-600">{e.project.title}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
  {
    header: 'Updated',
    cell: (e) => (
      <span className="text-gray-500">
        {new Date(e.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    ),
  },
];

export function ExperimentListClient() {
  return (
    <ContentListShell<ExperimentListItem>
      basePath="/experiments"
      adminBase="/admin/experiments"
      previewBase="/preview/experiments"
      publicBase="/experiments"
      columns={columns}
      searchPlaceholder="Search experiments…"
      newHref="/admin/experiments/new"
      newLabel="+ New Experiment"
      emptyTitle="No experiments yet"
      emptyDescription="Log what you tested and learned."
    />
  );
}
