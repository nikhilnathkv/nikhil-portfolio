# Production environment (deployment contract)

The authoritative map of **where each service runs** and **every environment
variable** it needs. No real values live here — only names, ownership, and the
production source. Pair with [`deployment.md`](./deployment.md) (steps),
[`production.md`](./production.md) (what `API_ENV=production` changes), and
[`runbook.md`](./runbook.md) (operations).

## Deployment boundaries (keep the monorepo)

| Platform     | Repo               | Root directory | Runtime                                             |
| ------------ | ------------------ | -------------- | --------------------------------------------------- |
| **Vercel**   | `nikhil-portfolio` | `apps/web`     | Next.js (auto-detected)                             |
| **Render**   | `nikhil-portfolio` | `apps/api`     | **Docker** — `infrastructure/docker/api.Dockerfile` |
| **Supabase** | —                  | —              | Postgres + Storage (managed)                        |

Do **not** split the repo. Vercel builds `apps/web` (transpiling `packages/*`);
Render builds the api from the existing Dockerfile (already uses `uv`).

## API runtime facts (verified)

- **Python**: 3.12 (`requires-python = ">=3.12"`; image `python:3.12-slim`).
- **Dependencies**: `uv` with a committed `uv.lock` → `uv sync --frozen --no-dev`
  (this is what the Dockerfile already runs; Render's Docker build reuses it).
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
  (Dockerfile `CMD`). On Render, bind to its port: `--port $PORT` (or keep 8000
  and set the service port to 8000).
- **Migrations**: `alembic upgrade head` (run once per deploy that adds a
  revision; head is `0010`). Round-trip verified up→down→up in CI.
- **First admin**: `python -m app.cli create-admin --email <you> --password <pw>`.
- **Health**: `GET /api/v1/health` → `{"data":{"status":"ok","db":"up"},...}`;
  readiness `GET /api/v1/health/ready` → `{"data":{"ready":true,"db":"up"}}`.
  Point Render's health check at `/api/v1/health/ready`.

## Environment variable matrix

Legend: ✅ set here · ❌ not used here · 🔒 secret (never in the browser, never in git).

### Web — Vercel (`apps/web`)

| Variable                         | Web | Secret | Production source                                    |
| -------------------------------- | :-: | :----: | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`            | ✅  |   —    | Render api public URL + `/api/v1`                    |
| `API_INTERNAL_URL`               | ✅  |   —    | Render api URL + `/api/v1` (server-side fetch)       |
| `NEXT_PUBLIC_MEDIA_URL`          | ✅  |   —    | Supabase Storage public base (or CDN)                |
| `NEXT_PUBLIC_SITE_URL`           | ✅  |   —    | canonical origin, e.g. `https://nikhilnath.com`      |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | ✅  |   —    | `posthog` / blank (off)                              |
| `SESSION_COOKIE_NAME`            | ➕  |   —    | must **match** the api (default `portfolio_session`) |

`NEXT_PUBLIC_*` values are compiled into the browser bundle — they are public by
definition; never put a secret behind that prefix.

### API — Render (`apps/api`)

| Variable                                            | API | Secret | Production source                                                 |
| --------------------------------------------------- | :-: | :----: | ----------------------------------------------------------------- |
| `API_ENV`                                           | ✅  |   —    | `production` (forces Secure cookies, disables `/docs`)            |
| `DATABASE_URL`                                      | ✅  |   🔒   | Supabase — `postgresql+asyncpg://…` (TLS)                         |
| `CORS_ORIGINS`                                      | ✅  |   —    | exact web origin(s), comma-separated, never `*`                   |
| `SESSION_SECRET`                                    | ✅  |   🔒   | generated (`secrets.token_urlsafe(48)`)                           |
| `SESSION_COOKIE_NAME`                               | ✅  |   —    | default `portfolio_session` (match the web)                       |
| `SESSION_SECURE`                                    | ✅  |   —    | `true` (auto-on when `API_ENV=production`)                        |
| `SESSION_SAMESITE`                                  | ✅  |   —    | `lax`                                                             |
| `SESSION_MAX_AGE_DAYS`                              | ✅  |   —    | e.g. `14`                                                         |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_LOCKOUT_SECONDS`      | ✅  |   —    | defaults `5` / `300`                                              |
| `MINIO_ENDPOINT`                                    | ✅  |   —    | Supabase S3 endpoint host (S3-compatible)                         |
| `MINIO_ACCESS_KEY`                                  | ✅  |   🔒   | Supabase Storage access key                                       |
| `MINIO_SECRET_KEY`                                  | ✅  |   🔒   | Supabase Storage secret key                                       |
| `MINIO_BUCKET`                                      | ✅  |   —    | `media`                                                           |
| `MINIO_SECURE`                                      | ✅  |   —    | `true` (HTTPS endpoint)                                           |
| `MINIO_PUBLIC_URL`                                  | ✅  |   —    | public base for assets (must equal web's `NEXT_PUBLIC_MEDIA_URL`) |
| `MAX_UPLOAD_MB`                                     | ✅  |   —    | e.g. `10`                                                         |
| `CONTACT_MAX_PER_WINDOW` / `CONTACT_WINDOW_SECONDS` | ✅  |   —    | defaults `5` / `3600`                                             |

> Note: env names are `MINIO_*` (the app speaks S3; MinIO locally, **Supabase
> Storage / R2 in production** — any S3-compatible endpoint). The **S3 secret
> lives only on the API**; it never reaches Next.js or the browser.

Deferred/observability (add when wired): `NEXT_PUBLIC_POSTHOG_KEY` +
`NEXT_PUBLIC_POSTHOG_HOST` (client, public), `SENTRY_DSN` (web/api),
`RESEND_API_KEY` 🔒 (api, contact notifications). Not required for launch.

## Database migration strategy

Do **not** copy the local Docker volume. Production starts from an **empty**
Supabase database; the schema is owned entirely by Alembic:

```
migration files → fresh Supabase DB → alembic upgrade head → create-admin → author content
```

Verified in the release gate (M4.8): empty DB → `upgrade head` → `create-admin`
→ app boots (`/health/ready` ok, `/projects` `[]`, `/profile` 404, login 200).
Supabase is standard Postgres, so no abstraction differences.

## Storage strategy

- Create **one public bucket: `media`** in Supabase Storage (both images and the
  resume PDF live here; `MINIO_BUCKET=media`).
- **Pre-create the bucket as public in the Supabase UI.** The app's startup
  `ensure_bucket` is best-effort and may lack permission to set an S3 bucket
  policy on managed providers — that's fine; it won't crash (wrapped in the
  lifespan try/except). Uploads/reads (`put_object`/`get`) use the S3 endpoint.
- **S3 credentials are API-only.** Browser ❌ · Next.js ❌ · FastAPI ✅.
- `MINIO_PUBLIC_URL` (api) and `NEXT_PUBLIC_MEDIA_URL` (web) must point at the
  same public asset base, and that host must be allowed in `next.config.ts`
  (`images.remotePatterns` + CSP `img-src`). Update those once the storage host
  is known.

## CORS strategy

- `CORS_ORIGINS` is an explicit allow-list (never `*`), credentials enabled.
- Production: the exact web origin, e.g. `https://nikhilnath.com`. Add the Vercel
  preview URL temporarily while testing, then remove it.

## Cookie / session strategy (split domains — verified safe)

Architecture: web on `nikhilnath.com` (Vercel), api on `api.…` (Render). The
admin session cookie is **owned by the web origin**, not the api domain:

1. Login: browser → `POST /api/auth/login` (Next route, same-origin) → forwards
   to the api → the api returns `Set-Cookie` (HttpOnly, `Secure` in prod,
   `SameSite=lax`, `path=/`, **no `Domain`**) → the Next route relays it to the
   browser, so it is stored as a **host-only cookie on the web origin**.
2. Admin calls: browser → `/api/admin/*` (same-origin proxy) → the proxy attaches
   the cookie server-side to the api call. The browser never calls the api
   cross-site, so `SameSite=lax` is correct and `SameSite=None` is **not** needed.

Requirements for production: `API_ENV=production` (→ `Secure` cookie), web served
over HTTPS (Vercel ✅), and **do not** add a `Domain` to the api cookie (it would
be rejected on the web origin). No code change needed — confirmed in `auth.py`.

## First-production security checklist

| Check                                                       | Status                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| No `.env` / keys / DB / S3 creds / admin password committed | ✅ only `.env.example` tracked                           |
| Debug disabled; API docs not public                         | ✅ `API_ENV=production` disables `/docs`,`/openapi.json` |
| Production CORS configured (not `*`)                        | ✅ `CORS_ORIGINS` allow-list                             |
| Secure cookies                                              | ✅ forced when `API_ENV=production`                      |
| Admin authentication enforced                               | ✅ `require_admin`; anon → 401, editor → 403             |
| Draft content inaccessible                                  | ✅ public API returns published only; else 404           |
| Upload validation                                           | ✅ MIME + extension + magic-bytes + size caps            |
| Rate limiting                                               | ✅ login throttle + contact per-IP + honeypot            |
| No stack traces to clients                                  | ✅ `{error}` envelope + catch-all handler                |

## Accounts to create (you)

Required: Vercel · Supabase · Render · Cloudflare (DNS) · Namecheap (have) ·
GitHub (have). Observability (optional now): PostHog · Sentry. Later: Resend.
**Do not** create Redis / Clerk / Pinecone / Stripe — not used by this project.
