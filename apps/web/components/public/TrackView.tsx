'use client';

import { useEffect } from 'react';

import type { AnalyticsEvent, AnalyticsProps } from '@/lib/analytics';
import { track } from '@/lib/analytics';

/**
 * Fires a content-view event once on mount (e.g. project_view). Drop into a
 * server-rendered detail page as a tiny client island.
 */
export function TrackView({ event, props }: { event: AnalyticsEvent; props?: AnalyticsProps }) {
  useEffect(() => {
    track(event, props);
    // Intentionally fire once per mount; slug identifies the item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
