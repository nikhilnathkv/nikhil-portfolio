"""Session data access (server-side sessions)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select, update

from app.models.session import Session
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    model = Session

    async def get_by_token_hash(self, token_hash: str) -> Session | None:
        result = await self.session.execute(
            select(Session).where(Session.session_token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(self, session_obj: Session) -> None:
        session_obj.revoked_at = datetime.now(UTC)
        await self.session.flush()

    async def revoke_all_for_user(self, user_id) -> None:
        await self.session.execute(
            update(Session)
            .where(Session.user_id == user_id, Session.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.flush()

    async def touch(self, session_obj: Session) -> None:
        session_obj.last_used_at = datetime.now(UTC)
        await self.session.flush()
