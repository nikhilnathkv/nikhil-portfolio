# Production configuration reference

What "production" means for this app, and every setting that changes between
local and prod. Pair with [`deployment.md`](./deployment.md) (how to deploy) and
[`runbook.md`](./runbook.md) (how to operate).

## What `API_ENV=production` changes

Set on the **api** service. It flips several safety defaults automatically:

- **Secure cookies** — `cookie_secure` is forced on regardless of `SESSION_SECURE`
  (session cookie only sent over HTTPS). See `app/core/config.py`.
- **Docs disabled** — `/docs`, `/redoc` and `/openapi.json` return 404 (the API
  surface isn't advertised publicly). See `app/main.py`.
- **HSTS** — the web app emits `Strict-Transport-Security` only in production
  (`apps/web/next.config.ts`).

## Configuration matrix

| Concern | Local / dev | Production |
| --- | --- | --- |
| `API_ENV` | `development` | `production` |
| `DATABASE_URL` | local Postgres container | managed Postgres, TLS |
| `SESSION_SECRET` | `change-me…` | 64+ random chars, secret manager |
| `SESSION_SECURE` | `false` | `true` (auto via `API_ENV`) |
| `CORS_ORIGINS` | `http://localhost:3000` | `https://yourdomain.com` (exact) |
| Object storage | MinIO container | R2 / S3, `MINIO_SECURE=true` |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | CDN, e.g. `https://cdn.yourdomain.com` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | blank (off) | `plausible` / `umami` / blank |
| Interactive API docs | on | off |

## Security posture (verified in the release gate)

- **Auth**: opaque session cookie (HttpOnly, Secure in prod, SameSite);
  bcrypt/argon2 password hash; admin routes gated by `require_admin`; login
  brute-force throttle. Full model: [`architecture/security.md`](./architecture/security.md).
- **Draft protection**: public services + endpoints only ever return PUBLISHED
  content; drafts return 404. Enforced at the **API**, not the frontend.
- **CORS**: explicit allow-list from `CORS_ORIGINS`, never `*`, with credentials.
- **Uploads**: validated by declared MIME + extension + magic bytes + per-type
  size caps (`app/core/uploads.py`); dangerous types rejected 422.
- **Error leakage**: all errors coerced into the `{error}` envelope; a catch-all
  handler returns `INTERNAL_ERROR` and logs server-side — no stack traces to
  clients; FastAPI debug is off.
- **Contact**: per-IP rate limit + honeypot + max length; cookieless.
- **Secrets**: only `.env.example` is committed; `.env*` is git-ignored. Provide
  real values via each platform's secret store — never bake into images.
- **Headers/CSP**: baseline security headers + relaxed CSP in
  `apps/web/next.config.ts` (tighten to a nonce-based CSP as a later hardening).

## Performance targets (release baseline)

Run Lighthouse against the deployed URLs (`/`, `/projects`, `/projects/[slug]`,
`/writing/[slug]`, `/resume`) and record the four category scores. Targets, not
absolutes:

- LCP < 2.5s · CLS < 0.1 · INP < 200ms
- Images go through `next/image` (responsive, lazy, modern formats); fonts via
  `next/font` (no FOIT/major shift); Core Web Vitals are reported through the
  analytics layer (`web_vitals`).

## Known deferrals (not release blockers)

- Strict nonce-based CSP (currently relaxed for Tailwind + media).
- Distributed rate limiting (currently in-memory per-instance).
- Dynamic per-item OG images (a strong static default OG image ships today).
