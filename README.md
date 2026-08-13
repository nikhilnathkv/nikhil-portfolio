# nikhil-portfolio

A portfolio platform built as a **modular monolith** — a Next.js public site and
admin CMS backed by a FastAPI service, in a single monorepo. The FastAPI
boundary exists from day one so that future AI features (RAG, agents, ML/CV) can
plug in cleanly.

> **Status:** Milestone **M1 — Foundation** complete. The scaffolding, tooling,
> health endpoint, containers, CI, and documentation are in place. Content
> entities and pages arrive in later milestones.

## Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Frontend   | Next.js 16 · TypeScript · Tailwind CSS |
| Backend    | FastAPI · Python 3.12 · SQLAlchemy 2   |
| Migrations | Alembic                                |
| Database   | PostgreSQL 16                          |
| Storage    | S3-compatible object storage (MinIO)   |
| Testing    | Vitest · Pytest · Playwright           |
| Tooling    | pnpm workspaces · uv · Ruff · ESLint   |
| CI         | GitHub Actions                         |
| Containers | Docker · Docker Compose                |

## Repository layout

```
nikhil-portfolio/
├── apps/
│   ├── web/          # Next.js public site + admin CMS
│   └── api/          # FastAPI modular monolith
├── packages/
│   ├── types/        # Shared TypeScript types (API contract, domain)
│   ├── ui/           # Shared React components
│   └── config/       # Shared tooling config
├── infrastructure/
│   └── docker/       # Dockerfiles
├── docs/             # architecture, ADRs, product, development
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- [Node.js](https://nodejs.org) 22 (`.nvmrc`) with **pnpm 9** (`corepack enable`)
- [uv](https://docs.astral.sh/uv/) (Python 3.12+)
- [Docker](https://www.docker.com/) + Docker Compose

## Quick start (Docker — everything)

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000 (Swagger at http://localhost:8000/docs)
- Postgres: `localhost:5432` · Storage console: http://localhost:9001

## Local development (host)

Run each app directly for the fastest feedback loop:

```bash
# Backing services only (Postgres + storage)
docker compose up postgres storage -d

# Web (Next.js) — http://localhost:3000
pnpm install
pnpm --filter @nikhil-portfolio/web dev

# API (FastAPI) — http://localhost:8000
cd apps/api
uv sync
uv run uvicorn app.main:app --reload
```

## Common commands

| Command               | What it does                     |
| --------------------- | -------------------------------- |
| `pnpm dev`            | Run the web app in dev mode      |
| `pnpm build`          | Production build of the web app  |
| `pnpm lint`           | Lint all JS/TS packages          |
| `pnpm typecheck`      | Typecheck all TS packages        |
| `pnpm test`           | Run JS/TS tests                  |
| `pnpm format`         | Format the repo with Prettier    |
| `uv run ruff check .` | Lint the API (run in `apps/api`) |
| `uv run pytest`       | Test the API (run in `apps/api`) |

## Documentation

- [System architecture](docs/architecture/system.md)
- [Database](docs/architecture/database.md)
- [API](docs/architecture/api.md)
- [Architecture Decision Records](docs/adr/)
- [Development setup](docs/development/setup.md)
- [Product requirements](docs/product/requirements.md) · [Roadmap](docs/product/roadmap.md)

## License

[MIT](LICENSE)
