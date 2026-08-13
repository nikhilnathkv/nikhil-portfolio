"""Shared response schemas implementing the API response contract.

Success:  {"data": {...}, "meta": {...}}
Error:    {"error": {"code": "PROJECT_NOT_FOUND", "message": "Project not found"}}

Mirrors the TypeScript definitions in packages/types/src/api.ts.
"""

from pydantic import BaseModel


class Meta(BaseModel):
    total: int | None = None
    page: int | None = None
    page_size: int | None = None


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
