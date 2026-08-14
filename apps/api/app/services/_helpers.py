"""Reusable service helpers (pure functions, not a base class).

Shared business logic that several services genuinely reuse: slug resolution
and content lifecycle transitions. Kept as free functions so each service stays
a plain class without an imposed inheritance hierarchy.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Protocol

from app.core.exceptions import BusinessRuleViolationError, DuplicateResourceError
from app.models.enums import ContentStatus
from app.utils.slug import slugify


class _SlugRepo(Protocol):
    async def exists_by_slug(self, slug: str, *, exclude_id: Any = None) -> bool: ...


async def resolve_slug(repo: _SlugRepo, requested: str | None, title: str) -> str:
    """Deterministic slug policy.

    - Admin-supplied slug: use it as-is; reject duplicates (predictable).
    - No slug supplied: derive from title and auto-suffix to stay unique.
    """
    if requested:
        if await repo.exists_by_slug(requested):
            raise DuplicateResourceError(f"Slug '{requested}' already exists")
        return requested

    base = slugify(title)
    if not base:
        raise BusinessRuleViolationError("Could not derive a slug from the title")
    candidate, suffix = base, 2
    while await repo.exists_by_slug(candidate):
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate


def require_publishable(obj: Any, fields: list[str]) -> None:
    """Raise if any required field is empty/None before publishing."""
    missing = [f for f in fields if not getattr(obj, f, None)]
    if missing:
        raise BusinessRuleViolationError(
            "Cannot publish: missing required field(s): " + ", ".join(missing)
        )


def mark_published(obj: Any) -> None:
    obj.status = ContentStatus.PUBLISHED
    if hasattr(obj, "published_at") and obj.published_at is None:
        obj.published_at = datetime.now(UTC)


def mark_archived(obj: Any) -> None:
    obj.status = ContentStatus.ARCHIVED
