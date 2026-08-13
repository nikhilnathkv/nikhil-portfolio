"""Generic async repository.

Repositories are the only place that touches the database. They contain **no
business logic** — just parameterized data access. Business rules and
transaction boundaries (commit/rollback) live in the service layer; repositories
only ``flush`` so their writes participate in the caller's transaction.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base
from app.repositories.pagination import Page, PageRequest


class BaseRepository[ModelT: Base]:
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- read ---------------------------------------------------------------
    def _base_select(self, include_deleted: bool = False) -> Select[tuple[ModelT]]:
        stmt = select(self.model)
        if not include_deleted and hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))
        return stmt

    async def get_by_id(self, id: uuid.UUID, *, include_deleted: bool = False) -> ModelT | None:
        stmt = self._base_select(include_deleted).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        filters: list[Any] | None = None,
        order_by: Any | None = None,
        limit: int | None = None,
        offset: int | None = None,
        include_deleted: bool = False,
    ) -> list[ModelT]:
        stmt = self._base_select(include_deleted)
        for condition in filters or []:
            stmt = stmt.where(condition)
        if order_by is not None:
            if isinstance(order_by, (tuple, list)):
                stmt = stmt.order_by(*order_by)
            else:
                stmt = stmt.order_by(order_by)
        if offset is not None:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def count(
        self, *, filters: list[Any] | None = None, include_deleted: bool = False
    ) -> int:
        stmt = select(func.count()).select_from(self.model)
        if not include_deleted and hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))
        for condition in filters or []:
            stmt = stmt.where(condition)
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def paginate(
        self,
        *,
        filters: list[Any] | None = None,
        order_by: Any | None = None,
        pagination: PageRequest | None = None,
        include_deleted: bool = False,
    ) -> Page[ModelT]:
        """List one page of rows plus the total count, without HTTP concepts."""
        pagination = pagination or PageRequest()
        total = await self.count(filters=filters, include_deleted=include_deleted)
        items = await self.list(
            filters=filters,
            order_by=order_by,
            limit=pagination.limit,
            offset=pagination.offset,
            include_deleted=include_deleted,
        )
        return Page(
            items=items,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )

    # --- write --------------------------------------------------------------
    def add(self, instance: ModelT) -> ModelT:
        self.session.add(instance)
        return instance

    async def create(self, **values: Any) -> ModelT:
        instance = self.model(**values)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, instance: ModelT, **values: Any) -> ModelT:
        for key, value in values.items():
            setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        """Soft-delete when the model supports it, otherwise hard-delete."""
        if hasattr(instance, "deleted_at"):
            instance.deleted_at = datetime.now(UTC)
            await self.session.flush()
        else:
            await self.session.delete(instance)
            await self.session.flush()

    async def hard_delete(self, instance: ModelT) -> None:
        await self.session.delete(instance)
        await self.session.flush()


class SlugRepository[ModelT: Base](BaseRepository[ModelT]):
    """Base for entities addressed by a unique ``slug``."""

    async def get_by_slug(self, slug: str, *, include_deleted: bool = False) -> ModelT | None:
        stmt = self._base_select(include_deleted).where(self.model.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def exists_by_slug(self, slug: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(self.model.id).where(self.model.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(self.model.id != exclude_id)
        return (await self.session.execute(stmt)).first() is not None
