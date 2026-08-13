from httpx import AsyncClient


async def test_health_returns_envelope(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()

    # Standard success envelope.
    assert "data" in body
    data = body["data"]
    assert data["service"] == "nikhil-portfolio-api"
    assert data["status"] in {"ok", "degraded"}
    assert data["db"] in {"up", "down"}


async def test_unknown_route_uses_error_envelope(client: AsyncClient) -> None:
    response = await client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"
