'use client';

import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';

import { track } from '@/lib/analytics';

/**
 * Global analytics wiring for the public site: a page_view on every route
 * change and Core Web Vitals (LCP / CLS / INP …) reporting. Both funnel through
 * the cookieless `track()`, so they are no-ops until a provider is configured.
 */
export function Analytics() {
  const pathname = usePathname();

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
