"""Project API tests: happy-path CRUD and failure cases."""

from httpx import AsyncClient

BASE = "/api/v1/projects"


def _payload(**overrides) -> dict:
    data = {
        "title": "Aviation Intelligence",
        "short_description": "Forecasting aviation demand with ML.",
        # description + category are required by the publish business rule (M2.5).
        "description": "A full write-up of the aviation intelligence platform.",
        "category": "ml",
    }
    data.update(overrides)
    return data


# --- happy path ------------------------------------------------------------
async def test_create_project_returns_201_and_generates_slug(client: AsyncClient) -> None:
    resp = await client.post(BASE, json=_payload())
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["slug"] == "aviation-intelligence"
    assert data["status"] == "draft"
    assert data["published_at"] is None


async def test_create_project_with_metrics(client: AsyncClient) -> None:
    resp = await client.post(
        BASE,
        json=_payload(
            status="published",
            metrics=[
                {"name": "F1 Score", "value": "0.91"},
                {"name": "Latency", "value": "420", "unit": "ms"},
            ],
        ),
    )
    assert resp.status_code == 201
    metrics = resp.json()["data"]["metrics"]
    assert {m["name"] for m in metrics} == {"F1 Score", "Latency"}

    # And they survive a fresh read.
    slug = resp.json()["data"]["slug"]
    read = await client.get(f"{BASE}/{slug}")
    assert len(read.json()["data"]["metrics"]) == 2


async def test_full_crud_lifecycle(client: AsyncClient) -> None:
    # Create
    created = (await client.post(BASE, json=_payload(status="published"))).json()["data"]
    project_id = created["id"]
    slug = created["slug"]

    # Read (public, published)
    read = await client.get(f"{BASE}/{slug}")
    assert read.status_code == 200
    assert read.json()["data"]["title"] == "Aviation Intelligence"

    # Update
    updated = await client.put(f"{BASE}/{project_id}", json={"title": "Aviation Intel v2"})
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == "Aviation Intel v2"

    # Delete (soft)
    deleted = await client.delete(f"{BASE}/{project_id}")
    assert deleted.status_code == 204

    # Gone afterwards
    assert (await client.get(f"{BASE}/{slug}")).status_code == 404


async def test_publish_moves_project_into_public_list(client: AsyncClient) -> None:
    created = (await client.post(BASE, json=_payload())).json()["data"]
    # Draft is not in the public list.
    assert created["id"] not in [p["id"] for p in (await client.get(BASE)).json()["data"]]

    published = await client.post(f"{BASE}/{created['id']}/publish")
    assert published.status_code == 200
    assert published.json()["data"]["status"] == "published"
    assert published.json()["data"]["published_at"] is not None

    ids = [p["id"] for p in (await client.get(BASE)).json()["data"]]
    assert created["id"] in ids


async def test_list_featured_filter(client: AsyncClient) -> None:
    await client.post(BASE, json=_payload(title="Plain", status="published"))
    await client.post(BASE, json=_payload(title="Star", status="published", featured=True))

    featured = (await client.get(f"{BASE}?featured=true")).json()["data"]
    assert len(featured) == 1
    assert featured[0]["title"] == "Star"


# --- failure cases ---------------------------------------------------------
async def test_duplicate_slug_returns_409(client: AsyncClient) -> None:
    await client.post(BASE, json=_payload(slug="dup"))
    resp = await client.post(BASE, json=_payload(slug="dup"))
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CONFLICT"


async def test_missing_required_field_returns_422(client: AsyncClient) -> None:
    resp = await client.post(BASE, json={"short_description": "no title"})
    assert resp.status_code == 422
    body = resp.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "title" in body["error"]["details"]


async def test_get_unknown_slug_returns_404(client: AsyncClient) -> None:
    resp = await client.get(f"{BASE}/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


async def test_update_unknown_id_returns_404(client: AsyncClient) -> None:
    resp = await client.put(f"{BASE}/00000000-0000-0000-0000-000000000000", json={"title": "x"})
    assert resp.status_code == 404


async def test_invalid_uuid_returns_422(client: AsyncClient) -> None:
    resp = await client.put(f"{BASE}/not-a-uuid", json={"title": "x"})
    assert resp.status_code == 422


async def test_list_response_includes_metrics_and_hero_image(client: AsyncClient) -> None:
    """M4.2: the homepage/list cards need metrics + hero image on the list shape."""
    await client.post(
        BASE,
        json=_payload(
            status="published",
            hero_image_url="https://cdn.example.com/hero.png",
            metrics=[{"name": "Retrieval accuracy", "value": "94", "unit": "%"}],
        ),
    )
    items = (await client.get(BASE)).json()["data"]
    assert items, "expected at least one published project"
    item = items[0]
    assert item["hero_image_url"] == "https://cdn.example.com/hero.png"
    assert [m["name"] for m in item["metrics"]] == ["Retrieval accuracy"]


async def test_case_study_fields_roundtrip(client: AsyncClient) -> None:
    """M4.3: evaluation + results + is_confidential persist and are returned."""
    created = (
        await client.post(
            BASE,
            json=_payload(
                status="published",
                evaluation="Recall@5 measured on a held-out set.",
                results="Latency dropped from 1.2s to 420ms.",
                is_confidential=True,
            ),
        )
    ).json()["data"]
    assert created["is_confidential"] is True

    detail = (await client.get(f"{BASE}/{created['slug']}")).json()["data"]
    assert detail["evaluation"] == "Recall@5 measured on a held-out set."
    assert detail["results"] == "Latency dropped from 1.2s to 420ms."
    assert detail["is_confidential"] is True
    # Related content defaults to empty lists when nothing is linked.
    assert detail["related_research"] == []
    assert detail["related_experiments"] == []


async def test_project_detail_includes_published_related_content(admin_client: AsyncClient) -> None:
    """M4.3: the case study surfaces only PUBLISHED research/experiments linked to it."""
    project = (
        await admin_client.post(
            "/api/v1/admin/projects",
            json={
                "title": "Graph Host",
                "short_description": "d",
                "description": "full",
                "category": "GenAI",
            },
        )
    ).json()["data"]

    # Published research linked to the project -> should appear.
    await admin_client.post(
        "/api/v1/admin/research",
        json={
            "title": "Retrieval Strategy Eval",
            "abstract": "a",
            "project_id": project["id"],
            "status": "published",
        },
    )
    # Draft research linked to the project -> must NOT appear.
    await admin_client.post(
        "/api/v1/admin/research",
        json={"title": "Secret WIP", "abstract": "a", "project_id": project["id"]},
    )
    # Published experiment linked to the project -> should appear.
    await admin_client.post(
        "/api/v1/admin/experiments",
        json={
            "title": "BM25 vs Dense",
            "hypothesis": "h",
            "project_id": project["id"],
            "status": "published",
        },
    )
    # Publish the project so the public detail is reachable.
    await admin_client.post(f"/api/v1/admin/projects/{project['id']}/publish")

    detail = (await admin_client.get(f"{BASE}/{project['slug']}")).json()["data"]
    assert [r["title"] for r in detail["related_research"]] == ["Retrieval Strategy Eval"]
    assert [e["title"] for e in detail["related_experiments"]] == ["BM25 vs Dense"]
