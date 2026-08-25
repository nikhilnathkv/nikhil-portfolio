"""Alembic environment, configured for async SQLAlchemy.

The target metadata is `app.core.database.Base.metadata`. As ORM models are
added under `app/models`, import them here (or ensure they are imported by
`app.models`) so autogenerate can see them.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.pool import NullPool

# Import models so their tables register on Base.metadata for autogenerate.
import app.models  # noqa: F401
from app.core.config import settings
from app.core.database import Base

config = context.config
# Escape `%` as `%%` so ConfigParser doesn't treat percent-encoded characters in
# the URL (e.g. a URL-encoded DB password) as interpolation syntax. The engine is
# still built from the raw `settings.database_url` below.
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        {"sqlalchemy.url": settings.database_url},
        prefix="sqlalchemy.",
        poolclass=NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
