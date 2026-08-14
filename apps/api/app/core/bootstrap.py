"""Bootstrapping helpers — creating the initial admin user.

There is no public registration; the first admin is created out-of-band (CLI or
seed), which is why this lives in core rather than behind an API route.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleViolationError, DuplicateResourceError
from app.core.security import hash_password, is_strong_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user import UserRepository


async def create_admin_user(session: AsyncSession, *, email: str, password: str) -> User:
    email = email.strip().lower()
    if not is_strong_password(password):
        raise BusinessRuleViolationError(
            "Password must be at least 12 characters and include letters and digits"
        )
    users = UserRepository(session)
    if await users.get_by_email(email) is not None:
        raise DuplicateResourceError(f"User '{email}' already exists")
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
