# API — FastAPI

The backend for nikhil-portfolio: a modular monolith exposing a versioned REST
API under `/api/v1`.

## Layout

```
app/
├── main.py            # App factory, CORS, error envelope, router wiring
├── api/
│   ├── router.py      # Aggregates v1 routers
│   └── v1/
│       └── health.py  # Liveness / readiness endpoint
├── core/
│   ├── config.py      # Settings (pydantic-settings, env-driven)
│   └── database.py    # Async engine, session factory, declarative Base
├── models/            # SQLAlchemy ORM models (added in M2)
├── schemas/           # Pydantic schemas (incl. response envelope)
├── services/          # Business logic
├── repositories/      # Data-access layer
└── utils/
migrations/            # Alembic (async)
tests/                 # Pytest
```

Request flow: **Route → Schema → Service → Repository → Database**.

## Response contract

Success and error responses share one envelope (mirrored in
`packages/types`):

```jsonc
// success
{ "data": { }, "meta": { } }
// error
{ "error": { "code": "NOT_FOUND", "message": "…" } }
```

## Develop

```bash
uv sync
uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
uv run ruff check .                     # lint
uv run ruff format .                    # format
uv run pytest                           # test
```

Tests run against a real PostgreSQL database (created automatically as
`portfolio_test`). Start one with `docker compose up postgres -d` and, if needed,
point the suite at it:

```bash
export TEST_DATABASE_URL=postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio_test
```

## Migrations (Alembic)

```bash
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
```

`migrations/env.py` reads `DATABASE_URL` from `app.core.config` and targets
`Base.metadata`. Import new models in `app/models/__init__.py` so autogenerate
can see them.
