'use client';

import type { AnchorHTMLAttributes } from 'react';

import type { AnalyticsEvent, AnalyticsProps } from '@/lib/analytics';
import { track } from '@/lib/analytics';

/**
 * An external anchor that records an analytics event on click (resume_download,
 * github_click, demo_click, linkedin_click …). Cookieless and a no-op until a
 * provider is configured.
 */
export function TrackedLink({
  event,
  eventProps,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: AnalyticsEvent;
  eventProps?: AnalyticsProps;
}) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        props.onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
