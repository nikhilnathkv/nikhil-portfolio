'use client';

import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';

import { analyticsProvider, track } from '@/lib/analytics';

/**
 * Global analytics wiring for the public site: a page_view on every route
 * change and Core Web Vitals (LCP / CLS / INP …) reporting. Both funnel through
 * the cookieless `track()`, so they are no-ops until a provider is configured.
 *
 * When the provider is PostHog, this also lazily boots the SDK once, in a
 * cookieless posture (localStorage persistence, no autocapture, no session
 * replay) so no consent banner is required.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (analyticsProvider() !== 'posthog' || window.posthog) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    if (!key) return;

    let cancelled = false;
    void import('posthog-js').then(({ default: posthog }) => {
      if (cancelled || window.posthog) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
        persistence: 'localStorage', // cookieless: no cross-site cookies
        person_profiles: 'identified_only',
        autocapture: false, // we emit an explicit, curated event taxonomy
        capture_pageview: false, // route-change $pageview is sent via track()
        capture_pageleave: true,
        disable_session_recording: true,
      });
      window.posthog = posthog;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    track('page_view', { path: pathname });
  }, [pathname]);

  useReportWebVitals((metric) => {
    track('web_vitals', {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  });

  return null;
}
