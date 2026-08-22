"""M3.3 — Experience↔Project association and the skill-usage indicator."""

from httpx import AsyncClient

ADMIN_EXP = "/api/v1/admin/experience"
ADMIN_PROJECTS = "/api/v1/admin/projects"
ADMIN_SKILLS = "/api/v1/admin/skills"


def _exp(**overrides) -> dict:
    body = {
        "company": "Novigo",
        "role": "AI/ML Engineer",
        "start_date": "2026-01-01",
    }
    body.update(overrides)
    return body


async def _make_project(client: AsyncClient, title: str) -> dict:
    return (
        await client.post(
            ADMIN_PROJECTS, json={"title": title, "short_description": "d", "category": "GenAI"}
        )
    ).json()["data"]


# --- experience <-> projects ----------------------------------------------
async def test_create_experience_with_projects(admin_client: AsyncClient) -> None:
    p1 = await _make_project(admin_client, "Platform A")
    p2 = await _make_project(admin_client, "Platform B")

    created = (
        await admin_client.post(ADMIN_EXP, json=_exp(project_ids=[p1["id"], p2["id"]]))
    ).json()["data"]
    assert {p["title"] for p in created["projects"]} == {"Platform A", "Platform B"}
    assert all(set(p) == {"id", "title", "slug"} for p in created["projects"])


async def test_update_replaces_project_associations(admin_client: AsyncClient) -> None:
    p1 = await _make_project(admin_client, "Keep")
    p2 = await _make_project(admin_client, "Drop")
    p3 = await _make_project(admin_client, "Add")

    created = (
        await admin_client.post(ADMIN_EXP, json=_exp(project_ids=[p1["id"], p2["id"]]))
    ).json()["data"]

    updated = (
        await admin_client.put(
            f"{ADMIN_EXP}/{created['id']}", json={"project_ids": [p1["id"], p3["id"]]}
        )
    ).json()["data"]
    assert {p["title"] for p in updated["projects"]} == {"Keep", "Add"}


async def test_update_without_project_ids_keeps_them(admin_client: AsyncClient) -> None:
    p1 = await _make_project(admin_client, "Sticky")
    created = (await admin_client.post(ADMIN_EXP, json=_exp(project_ids=[p1["id"]]))).json()["data"]

    updated = (
        await admin_client.put(f"{ADMIN_EXP}/{created['id']}", json={"role": "Lead Engineer"})
    ).json()["data"]
    assert updated["role"] == "Lead Engineer"
    assert [p["title"] for p in updated["projects"]] == ["Sticky"]


async def test_current_role_still_enforced_with_projects(admin_client: AsyncClient) -> None:
    a = (await admin_client.post(ADMIN_EXP, json=_exp(company="A", is_current=True))).json()["data"]
    await admin_client.post(ADMIN_EXP, json=_exp(company="B", is_current=True))

    items = {
        e["company"]: e["is_current"] for e in (await admin_client.get(ADMIN_EXP)).json()["data"]
    }
    assert items["A"] is False  # demoted
    assert items["B"] is True
    assert a["is_current"] is True  # at creation time, before B demoted it


# --- skill usage indicator -------------------------------------------------
async def test_skill_usage_lists_projects(admin_client: AsyncClient) -> None:
    cat = (await admin_client.post("/api/v1/admin/skill-categories", json={"name": "Lang"})).json()[
        "data"
    ]
    skill = (
        await admin_client.post(ADMIN_SKILLS, json={"category_id": cat["id"], "name": "LangGraph"})
    ).json()["data"]

    await admin_client.post(
        ADMIN_PROJECTS,
        json={
            "title": "Agentic RAG",
            "short_description": "d",
            "category": "GenAI",
            "skill_ids": [skill["id"]],
        },
    )
    await admin_client.post(
        ADMIN_PROJECTS,
        json={
            "title": "Eval Harness",
            "short_description": "d",
            "category": "GenAI",
            "skill_ids": [skill["id"]],
        },
    )

    usage = (await admin_client.get(f"{ADMIN_SKILLS}/{skill['id']}/projects")).json()["data"]
    assert {p["title"] for p in usage} == {"Agentic RAG", "Eval Harness"}


async def test_skill_usage_empty_when_unused(admin_client: AsyncClient) -> None:
    cat = (await admin_client.post("/api/v1/admin/skill-categories", json={"name": "Misc"})).json()[
        "data"
    ]
    skill = (
        await admin_client.post(ADMIN_SKILLS, json={"category_id": cat["id"], "name": "Unused"})
    ).json()["data"]
    usage = (await admin_client.get(f"{ADMIN_SKILLS}/{skill['id']}/projects")).json()["data"]
    assert usage == []


# --- M4.4: public timeline + case-study backlink ---------------------------
async def test_public_experience_list_includes_projects_and_description(
    admin_client: AsyncClient,
) -> None:
    """The public timeline renders each role fully from the list endpoint."""
    proj = await _make_project(admin_client, "Timeline Project")
    await admin_client.post(
        ADMIN_EXP,
        json=_exp(
            company="EY",
            description="- Built X\n- Designed Y",
            project_ids=[proj["id"]],
        ),
    )
    items = (await admin_client.get("/api/v1/experience")).json()["data"]
    ey = next(i for i in items if i["company"] == "EY")
    assert ey["description"] == "- Built X\n- Designed Y"
    assert [p["title"] for p in ey["projects"]] == ["Timeline Project"]


async def test_project_detail_includes_experience_backlink(admin_client: AsyncClient) -> None:
    """A published project exposes the role(s) it was built in ('Built at …')."""
    proj = await _make_project(admin_client, "Backlink Project")
    await admin_client.put(f"{ADMIN_PROJECTS}/{proj['id']}", json={"description": "full"})
    await admin_client.post(ADMIN_EXP, json=_exp(company="EY", project_ids=[proj["id"]]))
    await admin_client.post(f"{ADMIN_PROJECTS}/{proj['id']}/publish")

    detail = (await admin_client.get(f"/api/v1/projects/{proj['slug']}")).json()["data"]
    assert [(x["company"], x["role"]) for x in detail["experience"]] == [("EY", "AI/ML Engineer")]
