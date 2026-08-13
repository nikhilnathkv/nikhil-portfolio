"""Slug generation helpers."""

import re
import unicodedata

_slug_strip = re.compile(r"[^\w\s-]")
_slug_hyphen = re.compile(r"[-\s]+")


def slugify(value: str) -> str:
    """Turn arbitrary text into a URL-safe slug (ASCII, lowercase, hyphens)."""
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = _slug_strip.sub("", value).strip().lower()
    return _slug_hyphen.sub("-", value)
