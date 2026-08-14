"""M3.5 — media uploads + metadata + usage, resume upload/activate, settings,
messages filter, contact throttle. Object storage is stubbed in conftest."""

from httpx import AsyncClient

MEDIA = "/api/v1/admin/media"
RESUMES = "/api/v1/admin/resumes"
BLOG = "/api/v1/admin/blog"
SETTINGS = "/api/v1/admin/settings"
MESSAGES = "/api/v1/admin/messages"

PNG = ("diagram.png", b"\x89PNG\r\n\x1a\nfakebytes", "image/png")
PDF = ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")


# --- media -----------------------------------------------------------------
async def test_upload_image_creates_record(admin_client: AsyncClient) -> None:
    resp = await admin_client.post(MEDIA, files={"file": PNG}, data={"alt_text": "RAG diagram"})
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["mime_type"] == "image/png"
    assert data["size"] > 0
    assert data["url"].startswith("http://test-storage/")
    assert data["alt_text"] == "RAG diagram"


async def test_upload_rejects_unsupported_type(admin_client: AsyncClient) -> None:
    resp = await admin_client.post(
        MEDIA, files={"file": ("evil.exe", b"MZ", "application/x-msdownload")}
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "BUSINESS_RULE_VIOLATION"


async def test_update_media_metadata(admin_client: AsyncClient) -> None:
    created = (await admin_client.post(MEDIA, files={"file": PNG})).json()["data"]
    updated = (
        await admin_client.put(
            f"{MEDIA}/{created['id']}",
            json={"title": "Architecture", "description": "RAG pipeline", "alt_text": "diagram"},
        )
    ).json()["data"]
    assert updated["title"] == "Architecture"
    assert updated["description"] == "RAG pipeline"


async def test_media_usage_and_guarded_delete(admin_client: AsyncClient) -> None:
    media = (await admin_client.post(MEDIA, files={"file": PNG})).json()["data"]
    # Reference it from a blog post cover.
    await admin_client.post(
        BLOG, json={"title": "Post", "content": "x", "cover_image_id": media["id"]}
    )

    usage = (await admin_client.get(f"{MEDIA}/{media['id']}/usage")).json()["data"]
    assert usage["count"] == 1
    assert usage["items"][0]["kind"] == "blog"

    # Delete blocked while used…
    blocked = await admin_client.delete(f"{MEDIA}/{media['id']}")
    assert blocked.status_code == 422
    # …but allowed with force.
    forced = await admin_client.delete(f"{MEDIA}/{media['id']}?force=true")
    assert forced.status_code == 204


async def test_delete_unused_media(admin_client: AsyncClient) -> None:
    media = (await admin_client.post(MEDIA, files={"file": PNG})).json()["data"]
    assert (await admin_client.delete(f"{MEDIA}/{media['id']}")).status_code == 204


# --- resume ----------------------------------------------------------------
async def test_resume_upload_pdf_and_activate(admin_client: AsyncClient) -> None:
    first = (
        await admin_client.post(
            f"{RESUMES}/upload",
            files={"file": PDF},
            data={"name": "v1", "version": "2026.07", "is_active": "true"},
        )
    ).json()["data"]
    assert first["is_active"] is True
    assert first["file_url"].startswith("http://test-storage/")

    second = (
        await admin_client.post(
            f"{RESUMES}/upload",
            files={"file": PDF},
            data={"name": "v2", "version": "2026.08"},
        )
    ).json()["data"]
    await admin_client.post(f"{RESUMES}/{second['id']}/activate")

    resumes = {
        r["version"]: r["is_active"] for r in (await admin_client.get(RESUMES)).json()["data"]
    }
    assert resumes["2026.07"] is False
    assert resumes["2026.08"] is True


async def test_resume_rejects_non_pdf(admin_client: AsyncClient) -> None:
    resp = await admin_client.post(
        f"{RESUMES}/upload",
        files={"file": ("x.png", b"img", "image/png")},
        data={"name": "v", "version": "1"},
    )
    assert resp.status_code == 422


# --- settings --------------------------------------------------------------
async def test_settings_upsert_and_read(admin_client: AsyncClient) -> None:
    await admin_client.put(f"{SETTINGS}/site_name", json={"value": "Nikhil Nath"})
    got = (await admin_client.get(f"{SETTINGS}/site_name")).json()["data"]
    assert got["value"] == "Nikhil Nath"
    all_keys = {s["key"] for s in (await admin_client.get(SETTINGS)).json()["data"]}
    assert "site_name" in all_keys


# --- messages --------------------------------------------------------------
async def test_messages_status_filter(admin_client: AsyncClient) -> None:
    await admin_client.post(
        "/api/v1/contact", json={"name": "J", "email": "j@example.com", "message": "hi"}
    )
    listed = (await admin_client.get(MESSAGES)).json()["data"]
    mid = listed[0]["id"]
    await admin_client.post(f"{MESSAGES}/{mid}/read")

    unread = (await admin_client.get(f"{MESSAGES}?status=unread")).json()["data"]
    assert unread == []
    read = (await admin_client.get(f"{MESSAGES}?status=read")).json()["data"]
    assert len(read) == 1
