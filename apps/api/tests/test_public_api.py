"""M2.6 — public API tests (HTTP → route → schema → service → repo → DB).

Emphasis on the envelope, pagination, filtering, and — most importantly — that
drafts/archived content never leak through the public endpoints.
"""

from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog import BlogPost
from app.models.enums import ContentStatus
from app.models.experience import Experience
from app.models.research import Research
from app.models.skill import Skill, SkillCategory

NOW = datetime.now(UTC)
PROJECTS = "/api/v1/projects"


def _project_body(**overrides) -> dict:
    body = {
        "title": "Enterprise AI Copilot",
        "short_description": "An AI copilot",
        "description": "Full write-up",
        "category": "genai",
    }
    body.update(overrides)
    return body


# --- Projects: visibility --------------------------------------------------
async def test_projects_list_excludes_drafts_and_archived(client: AsyncClient) -> None:
    pub = (await client.post(PROJECTS, json=_project_body(title="Pub", status="published"))).json()
    await client.post(PROJECTS, json=_project_body(title="Draft"))  # draft
    arch = (
        await client.post(PROJECTS, json=_project_body(title="Arch", status="published"))
    ).json()
    await client.post(f"{PROJECTS}/{arch['data']['id']}/archive")

    data = (await client.get(PROJECTS)).json()["data"]
    slugs = {p["slug"] for p in data}
    assert slugs == {pub["data"]["slug"]}


async def test_projects_status_draft_query_returns_nothing(client: AsyncClient) -> None:
    await client.post(PROJECTS, json=_project_body(status="published"))
    # Even explicitly asking for drafts must not leak them.
    data = (await client.get(f"{PROJECTS}?status=DRAFT")).json()["data"]
    assert data == []


async def test_project_detail_and_404(client: AsyncClient) -> None:
    created = (await client.post(PROJECTS, json=_project_body(status="published"))).json()
    slug = created["data"]["slug"]
    detail = await client.get(f"{PROJECTS}/{slug}")
    assert detail.status_code == 200
    body = detail.json()["data"]
    # Detail carries the full project page in one request.
    for field in ("problem", "solution", "architecture", "skills", "metrics"):
        assert field in body

    missing = await client.get(f"{PROJECTS}/nope")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NOT_FOUND"


async def test_projects_pagination_meta(client: AsyncClient) -> None:
    for i in range(3):
        await client.post(PROJECTS, json=_project_body(title=f"P{i}", status="published"))
    resp = await client.get(f"{PROJECTS}?page=1&page_size=2")
    payload = resp.json()
    assert len(payload["data"]) == 2
    assert payload["meta"]["pagination"] == {
        "page": 1,
        "page_size": 2,
        "total": 3,
        "total_pages": 2,
    }


async def test_projects_page_size_upper_bound(client: AsyncClient) -> None:
    resp = await client.get(f"{PROJECTS}?page_size=999999999")
    assert resp.status_code == 422  # exceeds max page_size


async def test_projects_category_and_featured_filters(client: AsyncClient) -> None:
    await client.post(PROJECTS, json=_project_body(title="A", category="ml", status="published"))
    await client.post(
        PROJECTS, json=_project_body(title="B", category="genai", featured=True, status="published")
    )
    ml = (await client.get(f"{PROJECTS}?category=ml")).json()["data"]
    assert [p["title"] for p in ml] == ["A"]
    featured = (await client.get(f"{PROJECTS}?featured=true")).json()["data"]
    assert [p["title"] for p in featured] == ["B"]


# --- Integration: draft never visible --------------------------------------
async def test_create_draft_then_publish_visibility(client: AsyncClient) -> None:
    created = (await client.post(PROJECTS, json=_project_body())).json()["data"]  # draft
    assert created["id"] not in [p["id"] for p in (await client.get(PROJECTS)).json()["data"]]

    await client.post(f"{PROJECTS}/{created['id']}/publish")
    assert created["id"] in [p["id"] for p in (await client.get(PROJECTS)).json()["data"]]


# --- Blog ------------------------------------------------------------------
async def test_blog_public(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add_all(
        [
            BlogPost(
                title="Pub",
                slug="pub",
                content="x",
                category="genai",
                status=ContentStatus.PUBLISHED,
                published_at=NOW,
            ),
            BlogPost(title="Draft", slug="draft", content="x", status=ContentStatus.DRAFT),
        ]
    )
    await db_session.commit()

    listed = await client.get("/api/v1/blog")
    assert [p["slug"] for p in listed.json()["data"]] == ["pub"]
    assert listed.json()["meta"]["pagination"]["total"] == 1
    assert (await client.get("/api/v1/blog/pub")).status_code == 200
    assert (await client.get("/api/v1/blog/draft")).status_code == 404
    assert [
        p["slug"] for p in (await client.get("/api/v1/blog?category=genai")).json()["data"]
    ] == ["pub"]


# --- Experience ------------------------------------------------------------
async def test_experience_ordering(client: AsyncClient, db_session: AsyncSession) -> None:
    from datetime import date

    db_session.add_all(
        [
            Experience(company="Old", role="Eng", start_date=date(2019, 1, 1), display_order=1),
            Experience(company="New", role="Lead", start_date=date(2024, 1, 1), display_order=0),
        ]
    )
    await db_session.commit()
    data = (await client.get("/api/v1/experience")).json()["data"]
    assert [e["company"] for e in data] == ["New", "Old"]


# --- Skills ----------------------------------------------------------------
async def test_skills_list_and_filter(client: AsyncClient, db_session: AsyncSession) -> None:
    ai = SkillCategory(name="AI", display_order=0)
    ai.skills = [Skill(name="RAG", display_order=0)]
    eng = SkillCategory(name="Eng", display_order=1)
    db_session.add_all([ai, eng])
    await db_session.commit()

    all_cats = (await client.get("/api/v1/skills")).json()["data"]
    assert [c["name"] for c in all_cats] == ["AI", "Eng"]
    filtered = (await client.get("/api/v1/skills?category=AI")).json()["data"]
    assert [c["name"] for c in filtered] == ["AI"]
    assert filtered[0]["skills"][0]["name"] == "RAG"


# --- Research --------------------------------------------------------------
async def test_research_draft_excluded(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add_all(
        [
            Research(title="R", slug="r", status=ContentStatus.PUBLISHED, published_at=NOW),
            Research(title="D", slug="d", status=ContentStatus.DRAFT),
        ]
    )
    await db_session.commit()
    assert [r["slug"] for r in (await client.get("/api/v1/research")).json()["data"]] == ["r"]
    assert (await client.get("/api/v1/research/r")).status_code == 200
    assert (await client.get("/api/v1/research/d")).status_code == 404


# --- Contact ---------------------------------------------------------------
async def test_contact_valid_submission(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/contact",
        json={"name": "John Doe", "email": "john@example.com", "message": "Let's talk"},
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["message"] == "Message received successfully."


async def test_contact_no_public_get(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/contact")
    assert resp.status_code in (404, 405)  # no public read of messages


async def test_contact_invalid_email(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/contact", json={"name": "J", "email": "not-email", "message": "hi"}
    )
    assert resp.status_code == 422


async def test_contact_missing_name(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/contact", json={"email": "a@b.com", "message": "hi"})
    assert resp.status_code == 422


async def test_contact_missing_message(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/contact", json={"name": "J", "email": "a@b.com"})
    assert resp.status_code == 422


# --- Health ----------------------------------------------------------------
async def test_health_ready(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/health/ready")
    assert resp.status_code == 200
    assert resp.json()["data"]["ready"] is True
