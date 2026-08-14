"""M2.7 — authentication security tests."""

from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_session_token, hash_password, hash_session_token
from app.models.enums import UserRole
from app.models.session import Session
from app.models.user import User

LOGIN = "/api/v1/auth/login"
ME = "/api/v1/auth/me"
LOGOUT = "/api/v1/auth/logout"
COOKIE = "portfolio_session"


async def test_login_success_sets_cookie(client: AsyncClient, admin_user: User) -> None:
    resp = await client.post(
        LOGIN, json={"email": "admin@example.com", "password": "AdminPass123!"}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]["user"]
    assert data["email"] == "admin@example.com"
    assert data["role"] == "admin"
    # No secrets in the body.
    assert "password" not in resp.text and "password_hash" not in resp.text
    # HttpOnly session cookie is set.
    set_cookie = resp.headers.get("set-cookie", "")
    assert COOKIE in set_cookie
    assert "httponly" in set_cookie.lower()
    assert "samesite" in set_cookie.lower()


async def test_login_wrong_password_is_generic(client: AsyncClient, admin_user: User) -> None:
    resp = await client.post(LOGIN, json={"email": "admin@example.com", "password": "wrong-one"})
    assert resp.status_code == 401
    assert resp.json()["error"]["message"] == "Invalid email or password"


async def test_login_unknown_email_is_generic(client: AsyncClient) -> None:
    resp = await client.post(LOGIN, json={"email": "nobody@example.com", "password": "whatever12"})
    assert resp.status_code == 401
    # Same message as wrong-password — no account enumeration.
    assert resp.json()["error"]["message"] == "Invalid email or password"


async def test_login_empty_credentials_rejected(client: AsyncClient) -> None:
    resp = await client.post(LOGIN, json={"email": "admin@example.com", "password": ""})
    assert resp.status_code == 422


async def test_inactive_user_cannot_login(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add(
        User(
            email="inactive@example.com",
            password_hash=hash_password("InactivePass123"),
            role=UserRole.ADMIN,
            is_active=False,
        )
    )
    await db_session.commit()
    resp = await client.post(
        LOGIN, json={"email": "inactive@example.com", "password": "InactivePass123"}
    )
    assert resp.status_code == 401


async def test_me_requires_authentication(client: AsyncClient) -> None:
    resp = await client.get(ME)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_me_returns_current_user(admin_client: AsyncClient) -> None:
    resp = await admin_client.get(ME)
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "admin@example.com"
    assert "password_hash" not in resp.text


async def test_logout_revokes_session(admin_client: AsyncClient) -> None:
    assert (await admin_client.get(ME)).status_code == 200
    assert (await admin_client.post(LOGOUT)).status_code == 200
    # Cookie cleared and session revoked → no longer authenticated.
    assert (await admin_client.get(ME)).status_code == 401


async def test_expired_session_rejected(
    client: AsyncClient, admin_user: User, db_session: AsyncSession
) -> None:
    token = generate_session_token()
    now = datetime.now(UTC)
    db_session.add(
        Session(
            user_id=admin_user.id,
            session_token_hash=hash_session_token(token),
            expires_at=now - timedelta(hours=1),  # already expired
            created_at=now - timedelta(days=1),
            last_used_at=now - timedelta(days=1),
        )
    )
    await db_session.commit()
    client.cookies.set(COOKIE, token)
    assert (await client.get(ME)).status_code == 401


async def test_revoked_session_rejected(
    client: AsyncClient, admin_user: User, db_session: AsyncSession
) -> None:
    token = generate_session_token()
    now = datetime.now(UTC)
    db_session.add(
        Session(
            user_id=admin_user.id,
            session_token_hash=hash_session_token(token),
            expires_at=now + timedelta(days=1),
            created_at=now,
            last_used_at=now,
            revoked_at=now,  # revoked
        )
    )
    await db_session.commit()
    client.cookies.set(COOKIE, token)
    assert (await client.get(ME)).status_code == 401


async def test_brute_force_lockout(client: AsyncClient, admin_user: User) -> None:
    for _ in range(5):
        r = await client.post(LOGIN, json={"email": "admin@example.com", "password": "bad"})
        assert r.status_code == 401
    # Even the *correct* password is now throttled.
    r = await client.post(LOGIN, json={"email": "admin@example.com", "password": "AdminPass123!"})
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "RATE_LIMITED"
