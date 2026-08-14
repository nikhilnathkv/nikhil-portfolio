'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AdminApiError, adminRequest, type Pagination } from '@/lib/admin/client-api';
import type { ContentStatus } from '@/lib/admin/project-types';

export interface ContentItem {
  id: string;
  slug: string;
  status: ContentStatus;
}

export interface Column<T> {
  header: string;
  cell: (item: T) => React.ReactNode;
}

type RowAction = 'publish' | 'unpublish' | 'archive' | 'delete' | 'duplicate';

const PAGE_SIZE = 20;

function actionsFor(status: ContentStatus): RowAction[] {
  if (status === 'published') return ['unpublish', 'archive', 'duplicate'];
  if (status === 'archived') return ['publish', 'duplicate', 'delete'];
  return ['publish', 'duplicate', 'delete'];
}

const LABEL: Record<RowAction, string> = {
  publish: 'Publish',
  unpublish: 'Unpublish',
  archive: 'Archive',
  delete: 'Delete',
  duplicate: 'Duplicate',
};

function RowMenu<T extends ContentItem>({
  item,
  adminBase,
  previewBase,
  onAction,
}: {
  item: T;
  adminBase: string;
  previewBase: string;
  onAction: (action: RowAction, item: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const cls = 'block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50';
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Actions for row`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md px-2 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100"
      >
        ⋮
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          <Link href={`${adminBase}/${item.id}`} role="menuitem" className={cls}>
            Edit
          </Link>
          <Link
            href={`${previewBase}/${item.slug}`}
            target="_blank"
            role="menuitem"
            className={cls}
          >
            Preview
          </Link>
          {actionsFor(item.status).map((a) => (
            <button
              key={a}
              type="button"
              role="menuitem"
              className={`${cls} ${a === 'delete' ? 'text-red-600 hover:bg-red-50' : ''}`}
              onClick={() => {
                setOpen(false);
                onAction(a, item);
              }}
            >
              {a === 'publish' && item.status === 'archived' ? 'Republish' : LABEL[a]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ContentListShell<T extends ContentItem>({
  basePath,
  adminBase,
  previewBase,
  publicBase,
  columns,
  extraQuery,
  filterControls,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = 'Search…',
  newHref,
  newLabel,
}: {
  basePath: string;
  adminBase: string;
  previewBase: string;
  publicBase: string;
  columns: Column<T>[];
  extraQuery?: Record<string, string | undefined>;
  filterControls?: React.ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  newHref: string;
  newLabel: string;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<'all' | ContentStatus>('all');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [pending, setPending] = useState<{ action: RowAction; item: T } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const extraKey = JSON.stringify(extraQuery ?? {});
  const hasFilters = debounced !== '' || status !== 'all' || extraKey !== '{}';

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (debounced) params.set('q', debounced);
    if (status !== 'all') params.set('status', status);
    for (const [k, v] of Object.entries(extraQuery ?? {})) if (v) params.set(k, v);
    try {
      const res = await adminRequest<T[]>(`${basePath}?${params.toString()}`);
      setItems(res.data);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, page, debounced, status, extraKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const runAction = async ({ action, item }: { action: RowAction; item: T }) => {
    setActionBusy(true);
    try {
      if (action === 'delete') {
        await adminRequest(`${basePath}/${item.id}`, { method: 'DELETE' });
      } else {
        await adminRequest(`${basePath}/${item.id}/${action}`, { method: 'POST' });
      }
      push(`${LABEL[action]} done.`, 'success');
      setPending(null);
      refresh();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
      setPending(null);
    } finally {
      setActionBusy(false);
    }
  };

  const onAction = (action: RowAction, item: T) => {
    if (action === 'duplicate') {
      void runAction({ action, item });
    } else {
      setPending({ action, item });
    }
  };

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | ContentStatus);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        {filterControls}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState onRetry={refresh} />
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState title="No matching results" description="Try adjusting search or filters." />
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Link
                href={newHref}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {newLabel}
              </Link>
            }
          />
        )
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  {columns.map((c) => (
                    <th key={c.header} className="px-4 py-3 font-semibold">
                      {c.header}
                    </th>
                  ))}
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60">
                    {columns.map((c) => (
                      <td key={c.header} className="px-4 py-3">
                        {c.cell(item)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <RowMenu
                        item={item}
                        adminBase={adminBase}
                        previewBase={previewBase}
                        onAction={onAction}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {pending ? (
        <ConfirmDialog
          open
          title={`${pending.action === 'publish' && pending.item.status === 'archived' ? 'Republish' : LABEL[pending.action]} this item?`}
          confirmLabel={
            pending.action === 'publish' && pending.item.status === 'archived'
              ? 'Republish'
              : LABEL[pending.action]
          }
          destructive={pending.action === 'delete' || pending.action === 'archive'}
          requireTyped={pending.action === 'delete' ? 'DELETE' : undefined}
          busy={actionBusy}
          onCancel={() => (actionBusy ? undefined : setPending(null))}
          onConfirm={() => void runAction(pending)}
        >
          {pending.action === 'publish' ? (
            <p>
              Publicly visible at{' '}
              <span className="font-mono text-gray-800">
                {publicBase}/{pending.item.slug}
              </span>
              .
            </p>
          ) : pending.action === 'delete' ? (
            <p>This permanently deletes the item.</p>
          ) : pending.action === 'archive' ? (
            <p>It will no longer appear publicly, but is not deleted.</p>
          ) : (
            <p>It will return to draft and leave the public site.</p>
          )}
        </ConfirmDialog>
      ) : null}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
