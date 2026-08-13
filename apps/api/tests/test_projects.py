"""Project API tests: happy-path CRUD and failure cases."""

from httpx import AsyncClient

BASE = "/api/v1/projects"


def _payload(**overrides) -> dict:
    data = {
        "title": "Aviation Intelligence",
        "short_description": "Forecasting aviation demand with ML.",
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
