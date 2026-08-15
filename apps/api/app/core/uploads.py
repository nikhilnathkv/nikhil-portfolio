"""Upload validation — never trust the client-declared MIME type.

We validate three independent signals before accepting a file:
  1. the declared MIME is on an allow-list,
  2. the filename extension matches that MIME,
  3. the file's magic bytes (content signature) match that MIME.

This rejects dangerous uploads (``.exe/.sh/.php/.js/.html``) and content whose
bytes disagree with a benign-looking name (e.g. an ``.png`` that is really a
script).
"""

from __future__ import annotations

from app.core.exceptions import BusinessRuleViolationError

# Allowed image + document types (no video).
IMAGE_MIMES = {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}
PDF_MIME = "application/pdf"
ALLOWED_MIMES = IMAGE_MIMES | {PDF_MIME}

# Per-type size caps (bytes). Images are moderate; PDFs a bit larger.
SIZE_LIMITS: dict[str, int] = {
    "image/png": 8 * 1024 * 1024,
    "image/jpeg": 8 * 1024 * 1024,
    "image/webp": 8 * 1024 * 1024,
    "image/svg+xml": 2 * 1024 * 1024,
    PDF_MIME: 15 * 1024 * 1024,
}

_EXTENSIONS: dict[str, set[str]] = {
    "image/png": {".png"},
    "image/jpeg": {".jpg", ".jpeg"},
    "image/webp": {".webp"},
    "image/svg+xml": {".svg"},
    PDF_MIME: {".pdf"},
}


def _extension(filename: str) -> str:
    return ("." + filename.rsplit(".", 1)[1].lower()) if "." in filename else ""


def _looks_like_svg(data: bytes) -> bool:
    head = data[:512].lstrip().lower()
    return head.startswith(b"<?xml") or head.startswith(b"<svg")


def _matches_signature(data: bytes, mime: str) -> bool:
    if mime == "image/png":
        return data[:8] == b"\x89PNG\r\n\x1a\n"
    if mime == "image/jpeg":
        return data[:3] == b"\xff\xd8\xff"
    if mime == "image/webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    if mime == PDF_MIME:
        return data[:5] == b"%PDF-"
    if mime == "image/svg+xml":
        return _looks_like_svg(data)
    return False


def validate_upload(
    *, data: bytes, filename: str, declared_mime: str, allowed: set[str] | None = None
) -> str:
    """Validate an upload and return the verified MIME type, or raise 422."""
    allowed = allowed if allowed is not None else ALLOWED_MIMES

    if declared_mime not in allowed:
        raise BusinessRuleViolationError(
            f"Unsupported file type '{declared_mime}'. Allowed: {', '.join(sorted(allowed))}."
        )

    ext = _extension(filename)
    if ext not in _EXTENSIONS[declared_mime]:
        raise BusinessRuleViolationError(
            f"File extension '{ext or '(none)'}' does not match {declared_mime}."
        )

    if not _matches_signature(data, declared_mime):
        raise BusinessRuleViolationError(
            "File content does not match its declared type (signature mismatch)."
        )

    limit = SIZE_LIMITS[declared_mime]
    if len(data) > limit:
        raise BusinessRuleViolationError(
            f"File exceeds the {limit // (1024 * 1024)} MB limit for {declared_mime}."
        )

    return declared_mime
