# Deployment

Target architecture: **managed split**. Each tier is a managed service so there
is no server to babysit.

```
                       Internet
                          │  HTTPS
                          ▼
                Next.js web  (Vercel)
                          │  HTTPS (server + browser)
                          ▼
                FastAPI api  (Fly.io / Railway / Render)
                    │                    │
                    ▼                    ▼
        Managed Postgres          Object storage
        (Neon / Supabase)         (Cloudflare R2 / S3)  ──► CDN (public assets)
```

Providers are interchangeable — anything that runs a container (api), serves
Next.js (web), speaks Postgres, and offers S3-compatible storage works. The
names below are the recommended defaults.

## 0. Prerequisites

- A domain (e.g. `yourdomain.com`).
- Accounts: Vercel, an api host (Fly.io / Railway / Render), a managed Postgres
  (Neon / Supabase), S3-compatible storage (Cloudflare R2 / AWS S3).
- Secrets generated locally, never committed:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(48))"   # SESSION_SECRET
  ```

See [`../.env.example`](../.env.example) for the full annotated variable list and
[`production.md`](./production.md) for the config reference.

## 1. Database (managed Postgres)

1. Create a Postgres instance; copy its connection string.
2. Convert it to the async driver the app uses:
   `postgresql+asyncpg://USER:PASS@HOST/DB` (keep `sslmode=require` / TLS on).
3. It starts **empty** — the app owns the schema via migrations (step 3).

## 2. Object storage (R2 / S3)

1. Create a bucket, e.g. `media`, with **public read** on objects (the app
   stores only non-secret public assets: project/cover/diagram images, resume PDF).
2. Create an access key/secret scoped to that bucket.
3. Note the S3 **endpoint host** and the **public base URL** (a CDN domain such
   as `https://cdn.yourdomain.com`, or the bucket's public URL).

## 3. API (FastAPI container)

Deploy `apps/api` using [`infrastructure/docker/api.Dockerfile`](../infrastructure/docker/api.Dockerfile).

Set env (see `.env.example` → "Production notes"):

```
API_ENV=production            # forces Secure cookies + disables /docs + /openapi.json
DATABASE_URL=postgresql+asyncpg://…            # managed Postgres (TLS)
SESSION_SECRET=<64+ random chars>
CORS_ORIGINS=https://yourdomain.com            # exact web origin(s), never *
MINIO_ENDPOINT=<r2/s3 endpoint host>
MINIO_ACCESS_KEY=…  MINIO_SECRET_KEY=…
MINIO_BUCKET=media  MINIO_SECURE=true
MINIO_PUBLIC_URL=https://cdn.yourdomain.com
```

Then run migrations and create the first admin **once** (see
[`runbook.md`](./runbook.md) for the exact commands on each host):

```bash
alembic upgrade head
python -m app.cli create-admin --email you@yourdomain.com --password '<strong>'
```

Expose the api at a stable origin, e.g. `https://api.yourdomain.com`. Verify
`GET /api/v1/health/ready` → `{"ready":true,"db":"up"}`.

## 4. Web (Vercel)

Import the repo; set **Root Directory = `apps/web`**. Vercel detects Next.js.

Project env vars:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
API_INTERNAL_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_MEDIA_URL=https://cdn.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible     # or blank to keep analytics off
```

> The monorepo uses pnpm workspaces; Vercel builds `apps/web` and transpiles the
> shared `packages/*`. If the build can't resolve the workspace, set the install
> command to `pnpm install` at the repo root and the build to
> `pnpm --filter @nikhil-portfolio/web build`.

## 5. Domain, HTTPS & canonical origin

- Point DNS: `yourdomain.com` → Vercel; `api.yourdomain.com` → the api host;
  `cdn.yourdomain.com` → storage/CDN.
- HTTPS is automatic on Vercel and the managed hosts; enforce HTTP→HTTPS.
- Pick **one** canonical host (`www` vs apex) and 301-redirect the other. Set
  `NEXT_PUBLIC_SITE_URL` to the canonical one — it drives canonical tags,
  OpenGraph URLs, `sitemap.xml`, and `robots.txt`.

## 6. Post-deploy

- `curl https://api.yourdomain.com/api/v1/health/ready` → ready.
- `https://yourdomain.com/robots.txt` and `/sitemap.xml` load and reference the
  canonical origin.
- Run the smoke test + critical journeys in [`release-checklist.md`](./release-checklist.md).
- Submit the sitemap to Google Search Console / Bing Webmaster.
- Verify analytics events fire (page_view, project_view, resume_download,
  github_click, contact_submitted).

Operational procedures (deploy, rollback, migrate, backup/restore, secrets,
logs) live in [`runbook.md`](./runbook.md).
