# Release checklist (M4.8)

The gate between "the feature works" and "I'd put this URL on my LinkedIn today."
Work top to bottom; don't ship with an unchecked box in **Pre-flight** or
**Security**.

## Pre-flight — local, before deploy

Run from the repo root (Postgres reachable):

```bash
# API
cd apps/api
DATABASE_URL=postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio \
  .venv/bin/python -m pytest -q          # all green (174+)
.venv/bin/ruff check app tests           # clean
# migration round-trip on a scratch DB
alembic upgrade head && alembic downgrade base && alembic upgrade head

# Web
cd ../web && pnpm typecheck && pnpm lint && pnpm test && pnpm build   # all green
pnpm audit --prod                        # 0 known vulns
```

- [ ] API pytest green · ruff clean · migration up→down→up clean
- [ ] Web typecheck · lint · test · build green
- [ ] `pnpm audit --prod` + `pip-audit` clean (note, don't blindly upgrade)
- [ ] Fresh-DB dry-run: empty DB → `alembic upgrade head` → `create-admin` →
      app boots, `/health/ready` ok, `/projects` `[]`, `/profile` 404 (no
      dependence on local state)

## Infrastructure

- [ ] Managed Postgres provisioned (TLS), empty
- [ ] Object storage bucket (public-read) + scoped access key
- [ ] API deployed with production env (`API_ENV=production`, secrets set)
- [ ] Web deployed (Vercel) with `NEXT_PUBLIC_*` + `API_INTERNAL_URL`
- [ ] DNS + HTTPS for web, api, cdn; HTTP→HTTPS; one canonical origin
- [ ] `NEXT_PUBLIC_SITE_URL` = canonical origin

## Security sanity (all must be ❌ = "no")

- [ ] Secrets committed to git? **No** — only `.env.example` is tracked
- [ ] Debug mode / API docs public? **No** — `API_ENV=production` disables
      `/docs`, `/redoc`, `/openapi.json` (verified: 404)
- [ ] Admin publicly accessible? **No** — `/api/v1/admin/*` → 401 without a
      session; non-admin → 403
- [ ] Draft/unpublished content exposed? **No** — public API returns published
      only; unknown/unpublished slug → 404
- [ ] CORS `*`? **No** — explicit `CORS_ORIGINS` allow-list
- [ ] Database publicly exposed? **No** — managed DB restricted to the api
- [ ] Stack traces to clients? **No** — `{error}` envelope + catch-all handler
- [ ] Unvalidated uploads? **No** — MIME + extension + magic-byte + size checks

## Smoke test — every route in production

- [ ] `/` · `/projects` · `/projects/[slug]`
- [ ] `/experience` · `/about`
- [ ] `/writing` · `/writing/[slug]` · `/research` · `/research/[slug]` ·
      `/experiments` · `/experiments/[slug]`
- [ ] `/resume` (page renders; **Download PDF** returns the active resume)
- [ ] `/contact` (form submits → success; message appears in `/admin/messages`)
- [ ] `/admin` → login required; after login, dashboard loads
- [ ] Media renders (project/cover/diagram images, profile, resume) from the CDN

## Critical journeys

- [ ] **Recruiter**: home → projects → case study → experience → resume
- [ ] **Technical reader**: article → research → experiment → GitHub link
- [ ] **Client/employer**: home → projects → contact → message submitted

## Discovery & analytics

- [ ] `https://domain/robots.txt` reachable, disallows `/admin`,`/api`,`/preview`
- [ ] `https://domain/sitemap.xml` reachable, canonical origin, published only
- [ ] Sitemap submitted to Search Console / Bing
- [ ] Analytics events fire live: page_view, project_view, resume_download,
      github_click, contact_submitted (or intentionally left off)

## Performance & accessibility

- [ ] Lighthouse recorded for `/`, `/projects`, `/projects/[slug]`,
      `/writing/[slug]`, `/resume` (Perf / A11y / Best Practices / SEO)
- [ ] Keyboard-only pass of the primary journeys; visible focus throughout
- [ ] `prefers-reduced-motion` honored; mobile (375/768/1024/1440) has no
      overflow / horizontal scroll

## Operations

- [ ] Postgres automated backups on + a manual `pg_dump` taken
- [ ] Storage bucket versioning on
- [ ] Rollback verified (promote previous web build; redeploy previous api image)
- [ ] Health check + uptime monitor on `/api/v1/health/ready`
- [ ] Deploy / rollback / migrate / restore / secrets documented ([`runbook.md`](./runbook.md))

## Sign-off

Release when Pre-flight + Security are fully checked, the three journeys work in
production, and discovery (robots/sitemap) is live. Cut a tag:
`git tag -a vX.Y.Z -m "…" && git push origin vX.Y.Z`.
