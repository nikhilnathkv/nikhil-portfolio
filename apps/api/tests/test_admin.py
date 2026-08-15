"""M2.7 — admin authorization and CRUD tests."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User

ADMIN_PROJECTS = "/api/v1/admin/projects"


def _project_body(**overrides) -> dict:
    body = {
        "title": "Admin Project",
        "short_description": "desc",
        "description": "long",
        "category": "genai",
    }
    body.update(overrides)
    return body


# --- authorization ---------------------------------------------------------
async def test_admin_requires_authentication(client: AsyncClient) -> None:
    resp = await client.post(ADMIN_PROJECTS, json=_project_body())
    assert resp.status_code == 401


async def test_admin_forbidden_for_non_admin(client: AsyncClient, db_session: AsyncSession) -> None:
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
    resp = await client.post(ADMIN_PROJECTS, json=_project_body())
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


async def test_admin_allowed_for_admin(admin_client: AsyncClient) -> None:
    resp = await admin_client.post(ADMIN_PROJECTS, json=_project_body())
    assert resp.status_code == 201


# --- full CRUD lifecycle ---------------------------------------------------
async def test_admin_project_full_lifecycle(admin_client: AsyncClient) -> None:
    created = (await admin_client.post(ADMIN_PROJECTS, json=_project_body())).json()["data"]
    pid = created["id"]
    assert created["status"] == "draft"

    # Read (admin can read a draft by id)
    assert (await admin_client.get(f"{ADMIN_PROJECTS}/{pid}")).status_code == 200

    # Update
    upd = await admin_client.put(f"{ADMIN_PROJECTS}/{pid}", json={"short_description": "changed"})
    assert upd.json()["data"]["short_description"] == "changed"

    # Publish → archive
    assert (await admin_client.post(f"{ADMIN_PROJECTS}/{pid}/publish")).json()["data"][
        "status"
    ] == "published"
    assert (await admin_client.post(f"{ADMIN_PROJECTS}/{pid}/archive")).json()["data"][
        "status"
    ] == "archived"

    # Delete → gone
    assert (await admin_client.delete(f"{ADMIN_PROJECTS}/{pid}")).status_code == 204
    assert (await admin_client.get(f"{ADMIN_PROJECTS}/{pid}")).status_code == 404


async def test_admin_lists_drafts_public_does_not(admin_client: AsyncClient) -> None:
    created = (await admin_client.post(ADMIN_PROJECTS, json=_project_body())).json()[
        "data"
    ]  # draft
    admin_ids = [p["id"] for p in (await admin_client.get(ADMIN_PROJECTS)).json()["data"]]
    public_ids = [p["id"] for p in (await admin_client.get("/api/v1/projects")).json()["data"]]
    assert created["id"] in admin_ids
    assert created["id"] not in public_ids


# --- dashboard & messages --------------------------------------------------
async def test_admin_dashboard(admin_client: AsyncClient) -> None:
    await admin_client.post(ADMIN_PROJECTS, json=_project_body(status="published"))
    await admin_client.post(ADMIN_PROJECTS, json=_project_body(title="Draft one"))
    data = (await admin_client.get("/api/v1/admin/dashboard")).json()["data"]
    assert data["projects"]["total"] == 2
    assert data["projects"]["published"] == 1
    assert data["projects"]["drafts"] == 1
    assert "unread_messages" in data


async def test_admin_messages_flow(admin_client: AsyncClient) -> None:
    # Public submit
    await admin_client.post(
        "/api/v1/contact", json={"name": "J", "email": "j@example.com", "message": "hi"}
    )
    listed = (await admin_client.get("/api/v1/admin/messages")).json()["data"]
    assert len(listed) == 1
    mid = listed[0]["id"]
    assert (await admin_client.post(f"/api/v1/admin/messages/{mid}/read")).json()["data"][
        "status"
    ] == "read"
    assert (await admin_client.get("/api/v1/admin/dashboard")).json()["data"][
        "unread_messages"
    ] == 0


async def test_admin_resume_activation(admin_client: AsyncClient) -> None:
    base = "/api/v1/admin/resumes"
    r1 = (
        await admin_client.post(
            base,
            json={"name": "v1", "file_url": "https://x/1.pdf", "version": "v1", "is_active": True},
        )
    ).json()["data"]
    r2 = (
        await admin_client.post(
            base, json={"name": "v2", "file_url": "https://x/2.pdf", "version": "v2"}
        )
    ).json()["data"]
    await admin_client.post(f"{base}/{r2['id']}/activate")
    resumes = {r["id"]: r["is_active"] for r in (await admin_client.get(base)).json()["data"]}
    assert resumes[r1["id"]] is False
    assert resumes[r2["id"]] is True


async def test_contact_honeypot_is_silently_dropped(admin_client: AsyncClient) -> None:
    """A filled honeypot returns success but stores nothing (M4.6 anti-spam)."""
    spam = await admin_client.post(
        "/api/v1/contact",
        json={"name": "Bot", "email": "bot@example.com", "message": "spam", "honeypot": "x"},
    )
    assert spam.status_code == 201  # looks normal to the bot
    clean = await admin_client.post(
        "/api/v1/contact",
        json={"name": "Real", "email": "real@example.com", "message": "hello"},
    )
    assert clean.status_code == 201

    listed = (await admin_client.get("/api/v1/admin/messages")).json()["data"]
    assert [m["name"] for m in listed] == ["Real"]
