'use client';

import { useEffect, useRef } from 'react';

import { useFocusTrap } from '@/hooks/useFocusTrap';

/** Minimal modal shell (overlay + centered panel). Callers supply the body/footer. */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

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
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl outline-none"
      >
        <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
