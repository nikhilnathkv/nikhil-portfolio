"""Shared response schemas and reusable field types.

Response contract:
    Success:  {"data": {...}, "meta": {...}}
    Error:    {"error": {"code": "PROJECT_NOT_FOUND", "message": "Project not found"}}

Mirrors the TypeScript definitions in packages/types/src/api.ts. Also hosts the
reusable validated field types (URL, slug) used across the domain schemas.
"""

from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    HttpUrl,
    StringConstraints,
    TypeAdapter,
)

# --- reusable field types --------------------------------------------------

_http_url_adapter = TypeAdapter(HttpUrl)


def _validate_http_url(value: str) -> str:
    """Validate that a string is an http(s) URL, but keep it as a plain ``str``.

    Storing/serializing as ``str`` avoids Pydantic ``Url`` objects leaking into
    the ORM layer or JSON responses.
    """
    _http_url_adapter.validate_python(value)
    return value


#: A validated http(s) URL that is carried around as a plain string.
HttpUrlStr = Annotated[str, AfterValidator(_validate_http_url)]

#: A URL-safe slug: lowercase alphanumerics separated by single hyphens,
#: e.g. ``aviation-intelligence-platform``.
Slug = Annotated[
    str,
    StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=1, max_length=255),
]


# --- response envelope -----------------------------------------------------


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class Meta(BaseModel):
    pagination: PaginationMeta | None = None


class SuccessResponse[T](BaseModel):
    data: T
    meta: Meta | None = None


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, list[str]] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


def success[T](data: T, meta: Meta | None = None) -> SuccessResponse[T]:
    """Wrap a payload in the standard success envelope."""
    return SuccessResponse(data=data, meta=meta)


def paginated[T](
    items: list[T], *, page: int, page_size: int, total: int
) -> SuccessResponse[list[T]]:
    """Wrap a page of items with pagination metadata."""
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return SuccessResponse(
        data=items,
        meta=Meta(
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            )
        ),
    )
