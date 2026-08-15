/**
 * Privacy-first, pluggable analytics (M4.7).
 *
 * Cookieless and OFF by default: `track()` is a no-op until a provider is named
 * via `NEXT_PUBLIC_ANALYTICS_PROVIDER`. No personal data, no cookies, no vendor
 * lock-in — wire a real provider (Plausible / Umami / Vercel) at deploy time by
 * implementing one dispatch branch below. Because nothing is collected until a
 * provider is configured, no consent banner is required in the default state.
 */

export type AnalyticsEvent =
  | 'page_view'
  | 'project_view'
  | 'article_view'
  | 'research_view'
  | 'experiment_view'
  | 'resume_view'
  | 'resume_download'
  | 'github_click'
  | 'demo_click'
  | 'linkedin_click'
  | 'contact_started'
  | 'contact_submitted'
  | 'web_vitals';

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

/** The configured provider, or null when analytics is disabled (the default). */
export function analyticsProvider(): string | null {
  const p = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.trim();
  return p ? p.toLowerCase() : null;
}

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: AnalyticsProps }) => void;
    umami?: { track: (event: string, props?: AnalyticsProps) => void };
  }
}

/**
 * Record an analytics event. Safe to call from anywhere (guards SSR) and does
 * nothing unless a provider is configured, so instrumentation can be added
 * freely without shipping tracking prematurely.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;
  const provider = analyticsProvider();
  if (!provider) return;

  const clean: AnalyticsProps = {};
  if (props) for (const [k, v] of Object.entries(props)) if (v !== undefined) clean[k] = v;

  switch (provider) {
    case 'plausible':
      window.plausible?.(event, Object.keys(clean).length ? { props: clean } : undefined);
      break;
    case 'umami':
      window.umami?.track(event, clean);
      break;
    default:
      // Unknown provider configured — stay silent rather than throw.
      break;
  }
}
