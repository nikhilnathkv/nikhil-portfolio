"""Framework-agnostic pagination primitives for the repository layer.

Deliberately independent of FastAPI and Pydantic: repositories must not know
that a request came over HTTP. Services translate these to/from API schemas.
"""

from __future__ import annotations

from dataclasses import dataclass

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


@dataclass(frozen=True)
class PageRequest:
    """A request for one page of results."""

    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE

    def __post_init__(self) -> None:
        object.__setattr__(self, "page", max(1, self.page))
        object.__setattr__(self, "page_size", max(1, min(self.page_size, MAX_PAGE_SIZE)))

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


@dataclass
class Page[T]:
    """One page of results plus the metadata needed to render pagination."""

    items: list[T]
    total: int
    page: int
    page_size: int

    @property
    def pages(self) -> int:
        if self.page_size == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size
