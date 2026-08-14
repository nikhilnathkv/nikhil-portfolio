"""Authentication business logic: login, logout, session validation.

Session-based auth (not JWT): the raw token is delivered only via an HTTP-only
cookie and stored hashed. Login is throttled per email to slow brute force, and
authentication errors are deliberately generic to avoid account enumeration.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError, RateLimitedError
from app.core.security import (
    generate_session_token,
    hash_session_token,
    verify_password,
)
from app.models.session import Session
from app.models.user import User
from app.repositories.session import SessionRepository
from app.repositories.user import UserRepository


@dataclass
class _LoginThrottle:
    """In-memory per-email failed-login tracker.

    Deliberately simple (no Redis yet). Process-local, but the infrastructure is
    in place to swap in a shared store later.
    """

    _state: dict[str, tuple[int, float]] = field(default_factory=dict)

    def is_locked(self, email: str) -> bool:
        entry = self._state.get(email)
        if not entry:
            return False
        count, locked_until = entry
        return count >= settings.login_max_attempts and time.monotonic() < locked_until

    def record_failure(self, email: str) -> None:
        count = self._state.get(email, (0, 0.0))[0] + 1
        locked_until = time.monotonic() + settings.login_lockout_seconds
        self._state[email] = (count, locked_until)

    def reset(self, email: str) -> None:
        self._state.pop(email, None)

    def clear(self) -> None:
        self._state.clear()


login_throttle = _LoginThrottle()


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.sessions = SessionRepository(session)

    async def login(self, email: str, password: str) -> tuple[User, str]:
        """Validate credentials and create a session. Returns (user, raw_token)."""
        email = email.strip().lower()
        if login_throttle.is_locked(email):
            raise RateLimitedError("Too many failed attempts. Please try again later.")

        user = await self.users.get_by_email(email)
        valid = (
            user is not None and user.is_active and verify_password(password, user.password_hash)
        )
        if not valid:
            login_throttle.record_failure(email)
            raise AuthenticationError("Invalid email or password")

        login_throttle.reset(email)
        now = datetime.now(UTC)
        user.last_login_at = now

        raw_token = generate_session_token()
        session_obj = Session(
            user_id=user.id,
            session_token_hash=hash_session_token(raw_token),
            expires_at=now + timedelta(seconds=settings.session_max_age_seconds),
            created_at=now,
            last_used_at=now,
        )
        self.session.add(session_obj)
        await self.session.commit()
        return user, raw_token

    async def authenticate_session(self, raw_token: str) -> User | None:
        """Return the user for a valid, unexpired, unrevoked session, else None."""
        session_obj = await self.sessions.get_by_token_hash(hash_session_token(raw_token))
        now = datetime.now(UTC)
        if (
            session_obj is None
            or session_obj.revoked_at is not None
            or session_obj.expires_at <= now
        ):
            return None
        user = await self.users.get_by_id(session_obj.user_id)
        if user is None or not user.is_active:
            return None
        await self.sessions.touch(session_obj)
        await self.session.commit()
        return user

    async def logout(self, raw_token: str) -> None:
        session_obj = await self.sessions.get_by_token_hash(hash_session_token(raw_token))
        if session_obj is not None and session_obj.revoked_at is None:
            await self.sessions.revoke(session_obj)
            await self.session.commit()

    async def revoke_all(self, user_id: uuid.UUID) -> None:
        await self.sessions.revoke_all_for_user(user_id)
        await self.session.commit()
