# Security

How the portfolio CMS protects itself. Scope: the admin CMS + public API. This
reflects the M3.6 hardening pass; production-grade extras (strict CSP, distributed
rate limiting, WAF) are tracked for M5.

## Authentication

- **Session cookies, not JWTs.** Login (`POST /api/v1/auth/login`) verifies the
  password (Argon2, `app/core/security.py`) and issues an opaque session token
  stored hashed in the `sessions` table. The token is returned **only** as a
  cookie — it never reaches client JavaScript.
- **Cookie flags** (`app/api/v1/auth.py`): `HttpOnly`, `SameSite` (configurable,
  default `lax`), and `Secure` in production (`settings.cookie_secure` is forced on
  when `API_ENV=production`).
- **Login does not reveal account existence** — unknown account and wrong password
  return an identical 401 body.
- **Brute-force throttle**: `login_throttle` locks an email after
  `LOGIN_MAX_ATTEMPTS` (default 5) for `LOGIN_LOCKOUT_SECONDS` (default 300).

## Sessions

- Every request validates the session (`AuthService.authenticate_session`):
  rejected if missing, expired (`expires_at`), or revoked (`revoked_at`).
- **Logout revokes** the session server-side; a revoked token can never be reused.
- Session lifetime: `SESSION_MAX_AGE_DAYS` (default 14).
- **Session expiry UX**: a 401 from the admin proxy surfaces as
  `SessionExpiredError` → an inline "session expired" banner (`role="alert"`); the
  editor keeps its in-memory form so no work is lost. (Auto-redirect-and-restore is M5.)

## Authorization

- All admin routes live under `admin_router` with a single
  `Depends(require_admin)` — the boundary is the **API**, not the hidden frontend
  route. An unauthenticated `curl` to any `/api/v1/admin/*` → **401**; a non-admin
  (editor) → **403**.
- The Next.js protected layout redirect is UX only; it is not a security control.
- Admin calls from the browser go through the same-origin proxy
  (`/api/admin/[...path]`) which attaches the HTTP-only cookie server-side.

## File uploads

Validated in `app/core/uploads.py` — the client-declared MIME is **never trusted**:

1. declared MIME must be on the allow-list (PNG/JPEG/WebP/SVG images, PDF);
2. the filename extension must match that MIME;
3. the content **magic bytes** must match (a `.png` whose bytes aren't a PNG is rejected);
4. per-type size caps (images ≤ 8 MB, SVG ≤ 2 MB, PDF ≤ 15 MB).

Dangerous types (`.exe/.sh/.php/.js/.html`) fail step 1/2/3 → **422**. Files are
stored in MinIO (object storage), never in Postgres; only metadata is in the DB.
SVGs are served from the MinIO origin with `image/svg+xml` and are never inlined
into the admin document.

## Markdown / XSS

Blog/Research/Experiment content is authored in Markdown and rendered by the single
`MarkdownPreview` (react-markdown + remark-gfm + rehype-highlight). **Raw HTML is not
enabled**, so `<script>` / `<img onerror=…>` are escaped to text — injection is
impossible by construction, on both the admin preview and the public page. (Unit-tested.)

## Rate limiting

Basic in-memory, per-target (upgrade to Redis in M5):

- `POST /auth/login` — see brute-force throttle above.
- `POST /contact` — per-IP: `CONTACT_MAX_PER_WINDOW` (default 5) per
  `CONTACT_WINDOW_SECONDS` (default 3600); message length capped at 5000 chars.

## CORS

`allow_origins` is an explicit list from `CORS_ORIGINS` (never `*`), with
`allow_credentials=True`. Configure per environment (localhost / staging / prod).

## Security headers (web)

Set in `apps/web/next.config.ts` for all routes: `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (camera/mic/geo disabled), and a relaxed **Content-Security-Policy**
allowing `'self'`, MinIO images, `data:` images, and inline styles (Tailwind).
`Strict-Transport-Security` is emitted only in production. A strict nonce-based CSP
is deferred to M5.

## Observability

Each API request gets an `X-Request-ID` (propagated if provided) and one structured
log line: `request_id, method, path, status, latency_ms`. Logs **never** contain
bodies, cookies, tokens, or passwords. Health: `/api/v1/health` and `/health/ready`.

## Data & concurrency

- Writes are transactional (service layer owns commit/rollback); a failed
  relationship/publish rolls the whole operation back — no half-created rows.
- **Concurrent edits: last-write-wins** (documented, intentional for V1). No
  optimistic locking yet.

## Secrets

Only `.env.example` is committed; real `.env*` files are git-ignored. Never commit
secrets or bake them into Docker images — provide them via the environment.
