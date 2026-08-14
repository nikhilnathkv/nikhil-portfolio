import type { ContentStatus } from '@/lib/admin/project-types';

const STYLES: Record<ContentStatus, { label: string; className: string }> = {
  published: {
    label: 'Published',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  draft: { label: 'Draft', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
