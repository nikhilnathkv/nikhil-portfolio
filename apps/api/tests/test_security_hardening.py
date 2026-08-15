"""M3.6 — security & robustness audit: authz, uploads, transactions, API robustness."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User

ADMIN_PROJECTS = "/api/v1/admin/projects"
MEDIA = "/api/v1/admin/media"

# A representative sample of admin routes that must never be public.
PROTECTED = [
    ("GET", "/api/v1/admin/projects"),
    ("GET", "/api/v1/admin/blog"),
    ("GET", "/api/v1/admin/media"),
    ("GET", "/api/v1/admin/messages"),
    ("GET", "/api/v1/admin/dashboard"),
    ("POST", "/api/v1/admin/projects"),
]


# --- authentication / authorization ---------------------------------------
@pytest.mark.parametrize("method,path", PROTECTED)
async def test_admin_routes_require_auth(client: AsyncClient, method: str, path: str) -> None:
    resp = await client.request(method, path, json={} if method == "POST" else None)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_non_admin_gets_403(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add(
        User(
            email="editor@example.com",
            password_hash=hash_password("EditorPass123"),
            role=UserRole.EDITOR,
            is_active=True,
        )
    )
    await db_session.commit()
    await client.post(
        "/api/v1/auth/login", json={"email": "editor@example.com", "password": "EditorPass123"}
    )
    resp = await client.get(ADMIN_PROJECTS)
    assert resp.status_code == 403


async def test_login_does_not_reveal_account_existence(client: AsyncClient, admin_user) -> None:
    # Unknown account vs. a real account with the wrong password: identical response.
    unknown = await client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever12345"}
    )
    wrong = await client.post(
        "/api/v1/auth/login", json={"email": admin_user.email, "password": "wrongpassword12"}
    )
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["error"]["message"] == wrong.json()["error"]["message"]


async def test_password_hash_never_serialized(admin_client: AsyncClient) -> None:
    me = (await admin_client.get("/api/v1/auth/me")).json()["data"]
    assert "password" not in me
    assert "password_hash" not in me


async def test_revoked_session_cannot_be_reused(admin_client: AsyncClient) -> None:
    assert (await admin_client.get("/api/v1/auth/me")).status_code == 200
    await admin_client.post("/api/v1/auth/logout")
    # Same cookie jar, now revoked.
    assert (await admin_client.get("/api/v1/auth/me")).status_code == 401


# --- upload security -------------------------------------------------------
async def test_upload_rejects_dangerous_types(admin_client: AsyncClient) -> None:
    for name, mime in [
        ("x.exe", "application/x-msdownload"),
        ("x.sh", "application/x-sh"),
        ("x.php", "application/x-httpd-php"),
        ("x.js", "text/javascript"),
        ("x.html", "text/html"),
    ]:
        resp = await admin_client.post(MEDIA, files={"file": (name, b"payload", mime)})
        assert resp.status_code == 422, f"{name} should be rejected"


async def test_upload_rejects_signature_mismatch(admin_client: AsyncClient) -> None:
    # A .png name + image/png type but the bytes are not a PNG.
    resp = await admin_client.post(
        MEDIA, files={"file": ("fake.png", b"this is not a png", "image/png")}
    )
    assert resp.status_code == 422
    assert "signature" in resp.json()["error"]["message"].lower()


async def test_upload_accepts_real_png(admin_client: AsyncClient) -> None:
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
    resp = await admin_client.post(MEDIA, files={"file": ("real.png", png, "image/png")})
    assert resp.status_code == 201


# --- transaction integrity -------------------------------------------------
async def test_invalid_publish_leaves_no_partial_row(admin_client: AsyncClient) -> None:
    """Publishing at create time with missing required fields must persist nothing
    (the whole create + publish is one transaction)."""
    before = len((await admin_client.get(ADMIN_PROJECTS)).json()["data"])
    # status=published but no description/category → publish rule fails after the
    # transient project is built; the transaction rolls back.
    resp = await admin_client.post(
        ADMIN_PROJECTS,
        json={"title": "HalfBaked", "short_description": "d", "status": "published"},
    )
    assert resp.status_code == 422
    after = (await admin_client.get(ADMIN_PROJECTS)).json()["data"]
    assert len(after) == before
    assert "HalfBaked" not in {p["title"] for p in after}


# --- API robustness --------------------------------------------------------
async def test_invalid_uuid_returns_422(admin_client: AsyncClient) -> None:
    assert (await admin_client.get(f"{ADMIN_PROJECTS}/not-a-uuid")).status_code == 422


async def test_unknown_slug_returns_404(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/projects/does-not-exist")).status_code == 404


async def test_huge_page_size_is_clamped(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/projects?page_size=999999")
    # Rejected by the `le=100` bound rather than running an unbounded query.
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_negative_page_rejected(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/projects?page=0")).status_code == 422


async def test_unknown_query_params_ignored(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/projects?bogus=1&whatever=x")).status_code == 200


async def test_request_id_header_present(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/health")
    assert resp.headers.get("x-request-id")
