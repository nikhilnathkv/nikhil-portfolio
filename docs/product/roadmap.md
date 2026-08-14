# Roadmap

## M1 — Foundation ✅

Monorepo, Next.js + FastAPI scaffolding, linting/formatting, Docker Compose
(Postgres + storage), environment config, health endpoint, CI, and architecture
documentation. First successful local build.

## M2 — Data model, API & auth ✅

Delivered in sub-milestones on a real Postgres test database:

- **M2.1/2.2** — SQLAlchemy models for all tables + Alembic migrations
  (`0001`–`0003`, `upgrade`/`downgrade` verified).
- **M2.3** — Pydantic Create/Update/Response schemas, separate from the ORM,
  with URL/email/slug validation.
- **M2.4** — Repository layer (per-domain, filtering/pagination/sorting;
  transactions owned by services).
- **M2.5** — Service layer (business rules, content lifecycle, domain errors).
- **M2.6** — Public read API (versioned `/api/v1`, DI, pagination envelope,
  strict draft visibility) + `POST /contact`.
- **M2.7** — Session-based auth (Argon2id, hashed session tokens, HTTP-only
  cookies, brute-force throttling) and the full admin API under `/admin/*`
  (CRUD + publish/archive + dashboard), guarded by `require_admin`.

Create the initial admin user with:
`uv run python -m app.cli create-admin --email you@example.com --password '…'`

## M3 — Public site (next)

Build out the public pages against the API: home, projects + flagship project
page, experience, research, blog, experiments, resume, contact.

## M4 — Auth & Admin CMS

Session auth; admin CRUD for every entity; draft → preview → publish workflow;
media uploads to object storage.

## M5 — Polish & production

Playwright E2E coverage, SEO/metadata, performance, and choosing a concrete
(provider-neutral) production deployment.

## Future — AI layer

RAG over portfolio/research content, agents, and ML/CV demos — the reason the
FastAPI boundary exists from day one.
