'use client';

import { useEffect } from 'react';

/**
 * Warns the user before they lose unsaved edits.
 *
 * - `beforeunload` covers refresh / tab-close / external navigation.
 * - A capture-phase click listener covers in-app navigation via `<a>` links
 *   (the App Router has no first-class navigation blocker). When the form is
 *   dirty and the user clicks an internal link that leaves the current page, we
 *   ask for confirmation and cancel the navigation if declined.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = 'You have unsaved changes. Are you sure you want to leave?',
) {
  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank') return;

      // Only guard navigations that actually leave the current path.
      const dest = new URL(href, window.location.href);
      if (dest.pathname === window.location.pathname) return;

      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [isDirty, message]);
}
