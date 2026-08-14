"""Domain / application exceptions.

Services raise these instead of leaking SQLAlchemy errors. A single handler in
``app.main`` renders them as the standard ``{"error": {"code", "message"}}``
envelope with the right HTTP status; the service layer never imports FastAPI.
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


class ResourceNotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class DuplicateResourceError(AppError):
    status_code = 409
    code = "CONFLICT"


class InvalidStateTransitionError(AppError):
    """A lifecycle transition that the domain does not permit."""

    status_code = 409
    code = "INVALID_STATE_TRANSITION"


class BusinessRuleViolationError(AppError):
    """A business rule was violated (e.g. publishing an incomplete record)."""

    status_code = 422
    code = "BUSINESS_RULE_VIOLATION"


class ValidationError(AppError):
    status_code = 400
    code = "VALIDATION_ERROR"


# Backwards-compatible aliases (earlier milestones used these names).
NotFoundError = ResourceNotFoundError
ConflictError = DuplicateResourceError
