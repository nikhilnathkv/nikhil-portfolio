"""Security primitives: password hashing (Argon2id) and session tokens.

Passwords are never stored or logged in plaintext. Session tokens are random,
returned to the browser only via an HTTP-only cookie, and stored **hashed** in
the database — a DB leak never exposes usable tokens.
"""

from __future__ import annotations

import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error

_hasher = PasswordHasher()  # Argon2id defaults

MIN_PASSWORD_LENGTH = 12
SESSION_TOKEN_BYTES = 48


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except Argon2Error:
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


def is_strong_password(password: str) -> bool:
    """Minimal strength policy for admin passwords."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return False
    has_alpha = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_alpha and has_digit


def generate_session_token() -> str:
    """A high-entropy, URL-safe session token (the raw value; never stored)."""
    return secrets.token_urlsafe(SESSION_TOKEN_BYTES)


def hash_session_token(token: str) -> str:
    """Deterministic hash of a session token for database lookup/storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
