"""Enumerations shared across models and schemas.

Stored as VARCHAR with a CHECK constraint (``native_enum=False``) rather than a
native PostgreSQL enum type, which keeps migrations simple and rollbacks clean.
"""

from enum import StrEnum


class ContentStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class UserRole(StrEnum):
    ADMIN = "admin"
    EDITOR = "editor"


class ContactStatus(StrEnum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"
