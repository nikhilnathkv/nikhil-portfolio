'use client';

import { useEffect, useState } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body content — description, the affected URL, etc. */
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Danger styling for destructive actions. */
  destructive?: boolean;
  /**
   * When set, the user must type this exact string (e.g. "DELETE") before the
   * confirm button enables — a stronger barrier for permanent actions.
   */
  requireTyped?: string;
  /** Disables the confirm button + shows busy state while the action runs. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  requireTyped,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // `typed` is fresh each time the dialog mounts (callers render it conditionally),
  // so no reset-on-open effect is needed.
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const typedOk = !requireTyped || typed === requireTyped;
  const confirmDisabled = busy || !typedOk;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-gray-900/40"
        onClick={() => (busy ? undefined : onCancel())}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {children ? <div className="mt-2 text-sm text-gray-600">{children}</div> : null}

        {requireTyped ? (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Type <span className="font-mono font-semibold text-gray-700">{requireTyped}</span> to
              confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
