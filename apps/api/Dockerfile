# API image for managed hosts (Render: Root Directory = apps/api, Runtime = Docker).
# Mirrors infrastructure/docker/api.Dockerfile (used by docker-compose locally)
# but is self-contained here and binds to $PORT (Render assigns it; defaults to
# 8000 for local `docker build`). No BuildKit cache mount, so it builds anywhere.
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# uv for fast, reproducible installs.
COPY --from=ghcr.io/astral-sh/uv:0.8.0 /uv /uvx /bin/

WORKDIR /app

# Install dependencies first for better layer caching.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Application source (build context is apps/api).
COPY . .

EXPOSE 8000

# Apply DB migrations (idempotent — no-ops when already at head) using the
# platform's DATABASE_URL, then start the server bound to the assigned port.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
