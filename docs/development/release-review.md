# M3 Release Review — acceptance runbook

The final M3 check: from a **clean environment**, can you populate the portfolio
through the CMS and trust the whole system? Run this end-to-end.

## 1. Fresh environment (Docker)

```bash
git clone <repo> && cd nikhil-portfolio
cp .env.example .env                     # templates only — no real secrets committed

docker compose build                     # builds api + web images
docker compose up -d                     # postgres, storage (MinIO), api, web

docker compose run --rm api alembic upgrade head          # migrations
docker compose run --rm api python -m app.cli create-admin \
  --email you@example.com --password 'a-strong-password'  # first admin
```

Health checks (all should be green):

```bash
curl -s localhost:8000/api/v1/health        # {"data":{"status":"ok","db":"up"}}
curl -s localhost:8000/api/v1/health/ready  # {"data":{"ready":true}}
curl -sI localhost:3000/admin/login | head -1   # 200
docker compose ps                            # postgres/storage healthy, api/web up
```

MinIO console (optional): http://localhost:9001 (`portfolio` / `portfolio123`).

## 2. CMS acceptance journey (manual, ~10 min)

Sign in at http://localhost:3000/admin/login, then walk the flow:

1. **Dashboard** — counts render; "Unread messages" links to the inbox.
2. **Profile** → fill identity/summary/contact/social → Save.
3. **Experience** → add a role (mark current; end date disables) → Save.
4. **Skills** → add a category + a couple of skills.
5. **Project** → new → title, overview, category → add **metrics** + **technologies**
   → (hero image URL optional) → **Save Draft** → **Preview** (opens noindex preview,
   same renderer as public) → **Publish** (confirm shows the public URL).
6. **Media** → upload a PNG/JPEG and a PDF → set alt text → confirm thumbnails load
   (served from :9000) → check "Used by".
7. **Blog** → new → title, excerpt, category, tags, **Markdown** body, cover image →
   Save Draft → Preview → Publish.
8. **Research** / **Experiment** → new → fill fields, link a project (research; experiment
   also takes metrics) → Publish.
9. **Resume** → upload a PDF → it becomes ACTIVE (upload a second → Activate → first archived).
10. **Contact** — submit a message from the public API (below), then see it **unread** in
    `/admin/messages` → open (marks read) → Archive.
11. **Logout** — session is revoked (revisiting `/admin` bounces to login).

Submit a contact message:

```bash
curl -s -X POST localhost:8000/api/v1/contact -H 'content-type: application/json' \
  -d '{"name":"Recruiter","email":"r@example.com","message":"Hello"}'
```

## 3. Verify the public API (only published content, correct relationships)

```bash
curl -s "localhost:8000/api/v1/projects"                 # published only
curl -s "localhost:8000/api/v1/projects/<slug>"          # your flagship project + metrics/skills
curl -s "localhost:8000/api/v1/blog/<slug>"              # published post
curl -s "localhost:8000/api/v1/research/<slug>"          # research + linked project ref
curl -s "localhost:8000/api/v1/experiments/<slug>"       # experiment + metrics + project
curl -s "localhost:8000/api/v1/resume"                   # the ACTIVE resume
```

Then **archive** a published project in the admin and confirm it disappears from
`/api/v1/projects` and its detail returns 404 — drafts/archived never leak.

## 4. Automated equivalent + full regression

The manual journey is mirrored by an E2E test; run the whole suite to gate a release:

```bash
# API
cd apps/api && DATABASE_URL=postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio \
  .venv/bin/python -m pytest -q        # 164 passed
.venv/bin/ruff check app tests         # lint

# Web
cd ../web && pnpm typecheck && pnpm lint && pnpm test && pnpm build

# E2E (stack running; MinIO up). First run: npx playwright install chromium
PW_SKIP_WEBSERVER=1 npx playwright test   # incl. golden-journey.spec.ts

# Migration round-trip (scratch DB)
alembic upgrade head && alembic downgrade base && alembic upgrade head
```

## 5. Teardown

```bash
docker compose down            # stop containers (keep volumes)
docker compose down -v         # also drop data volumes (truly fresh next time)
```

## Sign-off

M3 is complete when: fresh Docker build + compose up is healthy, the CMS journey
works, the public API shows only published content with correct relationships/media/
active resume, and the full regression (API + web + E2E) is green.
