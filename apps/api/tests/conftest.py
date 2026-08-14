"""Test fixtures: a real PostgreSQL test database with per-test isolation.

Everything is function-scoped and self-contained so each test runs on a single
event loop (avoids asyncpg's "attached to a different loop" errors). The schema
is created idempotently (``checkfirst=True``); tables are truncated after each
test. The app's ``get_db`` dependency is overridden to use the test session.
"""

import os

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import app.models  # noqa: F401  (register all tables on Base.metadata)
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio_test",
)

# Schema is created once per test session; guarded so repeated engine fixtures
# don't re-run the (connection-heavy) admin + DDL work every test.
_schema_ready = False


async def _ensure_database() -> None:
    """Create the test database if it does not already exist."""
    admin_url = TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    db_name = TEST_DATABASE_URL.rsplit("/", 1)[1]
    engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        async with engine.connect() as conn:
            exists = await conn.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": db_name}
            )
            if not exists:
                await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        await engine.dispose()


async def _init_schema() -> None:
    global _schema_ready
    if _schema_ready:
        return
    await _ensure_database()
    eng = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    await eng.dispose()
    _schema_ready = True


@pytest_asyncio.fixture
async def engine():
    await _init_schema()
    # NullPool: no connections are kept between tests / event loops.
    eng = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    yield eng
    # Clean slate for the next test.
    async with eng.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f'TRUNCATE TABLE "{table.name}" CASCADE'))
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    # The health endpoints use the app's shared engine directly (not the
    # overridden test session). Dispose it so its pooled connections don't leak
    # across per-test event loops.
    from app.core.database import engine as app_engine

    await app_engine.dispose()
