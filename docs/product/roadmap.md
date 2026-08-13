# Roadmap

## M1 — Foundation ✅

Monorepo, Next.js + FastAPI scaffolding, linting/formatting, Docker Compose
(Postgres + storage), environment config, health endpoint, CI, and architecture
documentation. First successful local build.

## M2 — Data & content model ✅

SQLAlchemy models for all 18 tables (UUID keys, timestamps, soft-delete where
appropriate) + the initial Alembic migration (`upgrade`/`downgrade` verified);
Pydantic Create/Update/Response schemas separate from the ORM; repository and
service layers; public read endpoints (`profile`, `experience`, `projects`,
`skills`, `blog`, `research`, `experiments`, `repositories`, `resume`) plus full
Project CRUD; pytest suite (happy-path CRUD + failure cases) on a real Postgres
test database.

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
