'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { Experience } from '@/lib/admin/experience-types';

function period(e: Experience): string {
  const startYear = e.start_date.slice(0, 4);
  const endYear = e.is_current ? 'Now' : e.end_date ? e.end_date.slice(0, 4) : '—';
  return `${startYear}–${endYear}`;
}

export function ExperienceListClient() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toDelete, setToDelete] = useState<Experience | null>(null);
  const [busy, setBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await adminFetch<Experience[]>('/experience'));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next); // optimistic
    try {
      await Promise.all(
        next.map((e, i) =>
          e.display_order === i
            ? null
            : adminFetch(`/experience/${e.id}`, {
                method: 'PUT',
                body: JSON.stringify({ display_order: i }),
              }),
        ),
      );
      await load();
    } catch {
      push('Could not reorder. Reloading.', 'error');
      await load();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await adminFetch(`/experience/${toDelete.id}`, { method: 'DELETE' });
      push(`Deleted "${toDelete.company}".`, 'success');
      setToDelete(null);
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <TableSkeleton />;
  if (error) return <ErrorState onRetry={load} />;
  if (items.length === 0)
    return (
      <EmptyState
        title="No experience yet"
        description="Add your roles to build the career timeline."
        action={
          <Link
            href="/admin/experience/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Add Experience
          </Link>
        }
      />
    );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((e, i) => (
              <tr key={e.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/experience/${e.id}`}
                    className="font-medium text-gray-900 hover:text-indigo-700"
                  >
                    {e.company}
                  </Link>
                  {e.is_current ? (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Current
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-700">{e.role}</td>
                <td className="px-4 py-3 text-gray-500">{period(e)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${e.company} up`}
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded px-1.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${e.company} down`}
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      className="rounded px-1.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/experience/${e.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(e)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this experience?"
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => (busy ? undefined : setToDelete(null))}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          This permanently removes <strong>{toDelete?.company}</strong> — {toDelete?.role}.
        </p>
      </ConfirmDialog>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
