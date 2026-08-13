# Development Setup

## Prerequisites

- **Node 22** (see `.nvmrc`) with **pnpm 9** — enable via `corepack enable`
- **uv** (Astral) with Python 3.12+
- **Docker** + Docker Compose

## First-time setup

```bash
git clone https://github.com/nikhilnathkv/nikhil-portfolio.git
cd nikhil-portfolio
cp .env.example .env

# JS/TS workspace
pnpm install

# API
cd apps/api && uv sync && cd ../..
```

## Running

### Everything in Docker

```bash
docker compose up --build
```

### Host development (recommended for fast feedback)

```bash
# Backing services
docker compose up postgres storage -d

# Web — http://localhost:3000
pnpm --filter @nikhil-portfolio/web dev

# API — http://localhost:8000/docs
cd apps/api && uv run uvicorn app.main:app --reload
```

## Quality gates (what CI runs)

```bash
# Web
pnpm format:check
pnpm --filter @nikhil-portfolio/web lint
pnpm -r typecheck
pnpm --filter @nikhil-portfolio/web test
pnpm --filter @nikhil-portfolio/web build

# API (from apps/api)
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

## Git workflow

`main` is always stable. Work happens on branches:

```
feature/*   fix/*   chore/*
```

Flow: branch → open PR → CI green → review → merge. Follow it even solo — the
discipline is part of the engineering practice.

## Database migrations

```bash
cd apps/api
uv run alembic revision --autogenerate -m "add projects"
uv run alembic upgrade head
```
