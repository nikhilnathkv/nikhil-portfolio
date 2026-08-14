"""M3.2 — admin Project CMS backend features: search, filter, sort, duplicate,
unpublish, by-slug preview reads, and the flat skills list."""

from httpx import AsyncClient

ADMIN_PROJECTS = "/api/v1/admin/projects"


def _body(**overrides) -> dict:
    body = {
        "title": "Enterprise AI Platform",
        "short_description": "A production-grade knowledge platform.",
        "description": "long form",
        "category": "GenAI",
    }
    body.update(overrides)
    return body


# --- search / filter / sort ------------------------------------------------
async def test_search_matches_title_and_category(admin_client: AsyncClient) -> None:
    await admin_client.post(ADMIN_PROJECTS, json=_body(title="Aviation Intelligence"))
    await admin_client.post(
        ADMIN_PROJECTS, json=_body(title="Vision Pipeline", category="Computer Vision")
    )

    hits = (await admin_client.get(f"{ADMIN_PROJECTS}?q=aviation")).json()["data"]
    assert [p["title"] for p in hits] == ["Aviation Intelligence"]

    by_cat = (await admin_client.get(f"{ADMIN_PROJECTS}?q=vision")).json()["data"]
    assert {p["title"] for p in by_cat} == {"Vision Pipeline"}


async def test_filter_by_status_and_featured(admin_client: AsyncClient) -> None:
    await admin_client.post(ADMIN_PROJECTS, json=_body(title="Draft one"))
    await admin_client.post(ADMIN_PROJECTS, json=_body(title="Pub", status="published"))
    await admin_client.post(ADMIN_PROJECTS, json=_body(title="Star", featured=True))

    drafts = (await admin_client.get(f"{ADMIN_PROJECTS}?status=draft")).json()["data"]
    assert {p["title"] for p in drafts} == {"Draft one", "Star"}

    published = (await admin_client.get(f"{ADMIN_PROJECTS}?status=published")).json()["data"]
    assert {p["title"] for p in published} == {"Pub"}

    featured = (await admin_client.get(f"{ADMIN_PROJECTS}?featured=true")).json()["data"]
    assert {p["title"] for p in featured} == {"Star"}


async def test_list_is_paginated(admin_client: AsyncClient) -> None:
    for i in range(3):
        await admin_client.post(ADMIN_PROJECTS, json=_body(title=f"P{i}"))
    resp = (await admin_client.get(f"{ADMIN_PROJECTS}?page=1&page_size=2")).json()
    assert len(resp["data"]) == 2
    assert resp["meta"]["pagination"]["total"] == 3
    assert resp["meta"]["pagination"]["total_pages"] == 2


# --- duplicate -------------------------------------------------------------
async def test_duplicate_creates_draft_copy(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            ADMIN_PROJECTS,
            json=_body(
                status="published",
                featured=True,
                metrics=[{"name": "Accuracy", "value": "94.2", "unit": "%"}],
            ),
        )
    ).json()["data"]

    dup = await admin_client.post(f"{ADMIN_PROJECTS}/{created['id']}/duplicate")
    assert dup.status_code == 201
    copy = dup.json()["data"]

    assert copy["id"] != created["id"]
    assert copy["title"] == "Enterprise AI Platform (Copy)"
    assert copy["slug"] != created["slug"]
    assert copy["status"] == "draft"  # never inherits published
    assert copy["published_at"] is None
    assert copy["featured"] is False
    assert {m["name"] for m in copy["metrics"]} == {"Accuracy"}


async def test_duplicate_copies_skills_without_duplicating_records(
    admin_client: AsyncClient,
) -> None:
    cat = (
        await admin_client.post("/api/v1/admin/skill-categories", json={"name": "Languages"})
    ).json()["data"]
    skill = (
        await admin_client.post(
            "/api/v1/admin/skills", json={"category_id": cat["id"], "name": "Python"}
        )
    ).json()["data"]
    created = (await admin_client.post(ADMIN_PROJECTS, json=_body(skill_ids=[skill["id"]]))).json()[
        "data"
    ]

    copy = (await admin_client.post(f"{ADMIN_PROJECTS}/{created['id']}/duplicate")).json()["data"]
    assert [s["id"] for s in copy["skills"]] == [skill["id"]]

    all_skills = (await admin_client.get("/api/v1/admin/skills")).json()["data"]
    assert len(all_skills) == 1  # no duplicate skill record was created


# --- unpublish -------------------------------------------------------------
async def test_unpublish_returns_to_draft(admin_client: AsyncClient) -> None:
    created = (await admin_client.post(ADMIN_PROJECTS, json=_body(status="published"))).json()[
        "data"
    ]
    assert created["status"] == "published"

    un = (await admin_client.post(f"{ADMIN_PROJECTS}/{created['id']}/unpublish")).json()["data"]
    assert un["status"] == "draft"

    # It disappears from the public listing.
    public_ids = [p["id"] for p in (await admin_client.get("/api/v1/projects")).json()["data"]]
    assert created["id"] not in public_ids


# --- by-slug preview reads -------------------------------------------------
async def test_by_slug_returns_draft(admin_client: AsyncClient) -> None:
    created = (await admin_client.post(ADMIN_PROJECTS, json=_body())).json()["data"]
    resp = await admin_client.get(f"{ADMIN_PROJECTS}/by-slug/{created['slug']}")
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "draft"

    # Public detail read of the same draft slug 404s.
    assert (await admin_client.get(f"/api/v1/projects/{created['slug']}")).status_code == 404


async def test_by_slug_unknown_returns_404(admin_client: AsyncClient) -> None:
    assert (await admin_client.get(f"{ADMIN_PROJECTS}/by-slug/nope")).status_code == 404


# --- new CMS fields round-trip ---------------------------------------------
async def test_cms_fields_persist(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            ADMIN_PROJECTS,
            json=_body(
                challenges="Retrieval latency grew with the corpus.",
                hero_image_url="https://cdn.example.com/hero.png",
                architecture_diagram_url="https://cdn.example.com/arch.svg",
            ),
        )
    ).json()["data"]
    assert created["challenges"].startswith("Retrieval latency")
    assert created["hero_image_url"] == "https://cdn.example.com/hero.png"
    assert created["architecture_diagram_url"] == "https://cdn.example.com/arch.svg"


# --- metric replacement on update ------------------------------------------
async def test_update_replaces_metrics(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            ADMIN_PROJECTS,
            json=_body(metrics=[{"name": "Old", "value": "1"}]),
        )
    ).json()["data"]

    updated = (
        await admin_client.put(
            f"{ADMIN_PROJECTS}/{created['id']}",
            json={"metrics": [{"name": "Accuracy", "value": "94.2", "unit": "%"}]},
        )
    ).json()["data"]
    assert [m["name"] for m in updated["metrics"]] == ["Accuracy"]

    # Omitting metrics entirely leaves them untouched.
    untouched = (
        await admin_client.put(f"{ADMIN_PROJECTS}/{created['id']}", json={"title": "Renamed"})
    ).json()["data"]
    assert [m["name"] for m in untouched["metrics"]] == ["Accuracy"]


# --- flat skills list ------------------------------------------------------
async def test_admin_skills_flat_list(admin_client: AsyncClient) -> None:
    cat = (await admin_client.post("/api/v1/admin/skill-categories", json={"name": "ML"})).json()[
        "data"
    ]
    for name in ("PyTorch", "FastAPI"):
        await admin_client.post(
            "/api/v1/admin/skills", json={"category_id": cat["id"], "name": name}
        )
    skills = (await admin_client.get("/api/v1/admin/skills")).json()["data"]
    assert {s["name"] for s in skills} == {"PyTorch", "FastAPI"}
