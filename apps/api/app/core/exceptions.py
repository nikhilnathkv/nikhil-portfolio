"""Domain exceptions mapped to the standard API error envelope.

Services raise these; a single handler in ``app.main`` renders them as
``{"error": {"code", "message"}}`` with the right HTTP status.
"""

from __future__ import annotations


class AppError(Exception):
    status_code: int = 400
    code: str = "ERROR"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"


class ValidationError(AppError):
    status_code = 400
    code = "VALIDATION_ERROR"
