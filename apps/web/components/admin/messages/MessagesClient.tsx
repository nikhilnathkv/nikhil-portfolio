'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { ContactMessage } from '@/lib/admin/message-types';

type Filter = 'all' | 'unread' | 'read' | 'archived';

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function MessagesClient() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as Filter) || 'all';

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const q = filter === 'all' ? '' : `?status=${filter}`;
    try {
      setMessages(await adminFetch<ContactMessage[]>(`/messages${q}`));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const open = async (m: ContactMessage) => {
    setSelected(m);
    if (m.status === 'unread') {
      try {
        const updated = await adminFetch<ContactMessage>(`/messages/${m.id}/read`, {
          method: 'POST',
        });
        setSelected(updated);
        setMessages((list) => list.map((x) => (x.id === m.id ? updated : x)));
      } catch {
        /* non-critical */
      }
    }
  };

  const archive = async (m: ContactMessage) => {
    try {
      await adminFetch(`/messages/${m.id}/archive`, { method: 'POST' });
      push('Message archived.', 'success');
      setSelected(null);
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Action failed.', 'error');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminFetch(`/messages/${deleteTarget.id}`, { method: 'DELETE' });
      push('Message deleted.', 'success');
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const FILTERS: Filter[] = ['all', 'unread', 'read', 'archived'];

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorState onRetry={load} />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No messages" description="Your inbox is empty." />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {messages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => void open(m)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      selected?.id === m.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <span
                      aria-label={m.status === 'unread' ? 'Unread' : 'Read'}
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        m.status === 'unread' ? 'bg-indigo-500' : 'bg-gray-200'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${m.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                        >
                          {m.name}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {fmtWhen(m.created_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-gray-500">
                        {m.message}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {selected ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selected.name}</h2>
                <a href={`mailto:${selected.email}`} className="text-sm text-indigo-600 underline">
                  {selected.email}
                </a>
                <p className="mt-1 text-xs text-gray-400">
                  Received {fmtWhen(selected.created_at)}
                </p>
              </div>
              <p className="whitespace-pre-wrap border-t border-gray-100 pt-4 text-sm text-gray-700">
                {selected.message}
              </p>
              <div className="flex gap-2">
                {selected.status !== 'archived' ? (
                  <button
                    type="button"
                    onClick={() => void archive(selected)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Archive
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selected)}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Select a message to read it.</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this message?"
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => (busy ? undefined : setDeleteTarget(null))}
        onConfirm={() => void remove()}
      >
        <p>This permanently deletes the message from {deleteTarget?.name}.</p>
      </ConfirmDialog>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
