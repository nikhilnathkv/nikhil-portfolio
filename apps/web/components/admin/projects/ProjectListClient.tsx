'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ProjectTable, type RowAction } from '@/components/admin/projects/ProjectTable';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AdminApiError, adminRequest, type Pagination } from '@/lib/admin/client-api';
import type { ContentStatus, ProjectListItem } from '@/lib/admin/project-types';
import { CATEGORIES, SORT_OPTIONS } from '@/lib/admin/projects';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | ContentStatus;
type FeaturedFilter = 'all' | 'featured';

interface PendingAction {
  action: RowAction;
  project: ProjectListItem;
}

const CONFIRM_COPY: Record<
  RowAction,
  { title: string; confirmLabel: string; destructive?: boolean; requireTyped?: string }
> = {
  publish: { title: 'Publish this project?', confirmLabel: 'Publish' },
  unpublish: { title: 'Unpublish this project?', confirmLabel: 'Unpublish' },
  archive: { title: 'Archive this project?', confirmLabel: 'Archive', destructive: true },
  delete: {
    title: 'Delete this project permanently?',
    confirmLabel: 'Delete',
    destructive: true,
    requireTyped: 'DELETE',
  },
  duplicate: { title: 'Duplicate this project?', confirmLabel: 'Duplicate' },
};

export function ProjectListClient() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('all');
  const [featured, setFeatured] = useState<FeaturedFilter>('all');
  const [sort, setSort] = useState('updated_at');
  const [page, setPage] = useState(1);

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  // Changing any filter returns to the first page.
  const onFilter =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const hasFilters =
    debouncedSearch !== '' || status !== 'all' || category !== 'all' || featured !== 'all';

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort,
    });
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (status !== 'all') params.set('status', status);
    if (category !== 'all') params.set('category', category);
    if (featured === 'featured') params.set('featured', 'true');

    try {
      const res = await adminRequest<ProjectListItem[]>(`/projects?${params.toString()}`);
      setProjects(res.data);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, status, category, featured]);

  useEffect(() => {
    // Data fetch: synchronizes the list with the API when filters/page change.
    // The loading flag is set synchronously by design (an accepted effect use).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  // Optimistic featured toggle (reliability-tolerant action).
  const toggleFeatured = async (project: ProjectListItem) => {
    const next = !project.featured;
    setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, featured: next } : p)));
    try {
      await adminRequest(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: next }),
      });
    } catch {
      // Revert on failure.
      setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, featured: !next } : p)));
      push('Could not update featured status.', 'error');
    }
  };

  const runAction = async ({ action, project }: PendingAction) => {
    setActionBusy(true);
    try {
      if (action === 'delete') {
        await adminRequest(`/projects/${project.id}`, { method: 'DELETE' });
        push(`Deleted "${project.title}".`, 'success');
      } else {
        await adminRequest(`/projects/${project.id}/${action}`, { method: 'POST' });
        const past: Record<RowAction, string> = {
          publish: 'Published',
          unpublish: 'Unpublished',
          archive: 'Archived',
          duplicate: 'Duplicated',
          delete: 'Deleted',
        };
        push(`${past[action]} "${project.title}".`, 'success');
      }
      setPending(null);
      refresh();
    } catch (e) {
      const message =
        e instanceof AdminApiError ? e.body.message : 'Action failed. Please try again.';
      push(message, 'error');
      setPending(null);
    } finally {
      setActionBusy(false);
    }
  };

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search projects…"
          aria-label="Search projects"
          className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => onFilter(setStatus)(e.target.value as StatusFilter)}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => onFilter(setCategory)(e.target.value)}
          className={selectClass}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by featured"
          value={featured}
          onChange={(e) => onFilter(setFeatured)(e.target.value as FeaturedFilter)}
          className={selectClass}
        >
          <option value="all">All</option>
          <option value="featured">Featured only</option>
        </select>
        <select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => onFilter(setSort)(e.target.value)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState onRetry={refresh} />
      ) : projects.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No matching projects"
            description="Try adjusting your search or filters."
          />
        ) : (
          <EmptyState
            title="No projects yet"
            description="Start documenting your technical work."
            action={
              <Link
                href="/admin/projects/new"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                + Create Project
              </Link>
            }
          />
        )
      ) : (
        <>
          <ProjectTable
            projects={projects}
            onToggleFeatured={toggleFeatured}
            onAction={(action, project) => setPending({ action, project })}
          />
          {pagination && pagination.total_pages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>
                Page {pagination.page} of {pagination.total_pages} · {pagination.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-gray-200 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Confirmation dialog for row actions */}
      {pending ? (
        <ConfirmDialog
          open
          title={CONFIRM_COPY[pending.action].title}
          confirmLabel={CONFIRM_COPY[pending.action].confirmLabel}
          destructive={CONFIRM_COPY[pending.action].destructive}
          requireTyped={CONFIRM_COPY[pending.action].requireTyped}
          busy={actionBusy}
          onCancel={() => (actionBusy ? undefined : setPending(null))}
          onConfirm={() => void runAction(pending)}
        >
          {pending.action === 'publish' ? (
            <p>
              This will make the project publicly visible at{' '}
              <span className="font-mono text-gray-800">/projects/{pending.project.slug}</span>.
            </p>
          ) : pending.action === 'archive' ? (
            <p>It will no longer appear publicly, but is not deleted.</p>
          ) : pending.action === 'delete' ? (
            <p>
              This permanently deletes <strong>{pending.project.title}</strong>. This cannot be
              undone.
            </p>
          ) : pending.action === 'unpublish' ? (
            <p>It will return to draft and be removed from the public site.</p>
          ) : (
            <p>
              A draft copy of <strong>{pending.project.title}</strong> will be created.
            </p>
          )}
        </ConfirmDialog>
      ) : null}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
