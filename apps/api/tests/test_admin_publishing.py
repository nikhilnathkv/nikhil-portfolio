"""M3.4 — publishing batch: experiment lifecycle + metrics, research↔project,
blog duplicate/filters, and admin list filtering for all three."""

from httpx import AsyncClient

BLOG = "/api/v1/admin/blog"
RESEARCH = "/api/v1/admin/research"
EXP = "/api/v1/admin/experiments"
PROJECTS = "/api/v1/admin/projects"


async def _project(client: AsyncClient, title: str = "Host Project") -> dict:
    return (
        await client.post(
            PROJECTS, json={"title": title, "short_description": "d", "category": "GenAI"}
        )
    ).json()["data"]


# --- experiment lifecycle + metrics ---------------------------------------
async def test_experiment_publish_cycle_and_metrics(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            EXP,
            json={
                "title": "BM25 vs Dense",
                "hypothesis": "Hybrid improves recall.",
                "metrics": [
                    {"name": "BM25 Recall@5", "value": "0.72"},
                    {"name": "Hybrid Recall@5", "value": "0.87"},
                ],
            },
        )
    ).json()["data"]
    assert created["status"] == "draft"
    assert {m["name"] for m in created["metrics"]} == {"BM25 Recall@5", "Hybrid Recall@5"}

    eid = created["id"]
    assert (await admin_client.post(f"{EXP}/{eid}/publish")).json()["data"]["status"] == "published"
    assert (await admin_client.post(f"{EXP}/{eid}/unpublish")).json()["data"]["status"] == "draft"
    assert (await admin_client.post(f"{EXP}/{eid}/archive")).json()["data"]["status"] == "archived"


async def test_experiment_update_replaces_metrics(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            EXP, json={"title": "E", "metrics": [{"name": "Old", "value": "1"}]}
        )
    ).json()["data"]
    updated = (
        await admin_client.put(
            f"{EXP}/{created['id']}", json={"metrics": [{"name": "New", "value": "2"}]}
        )
    ).json()["data"]
    assert [m["name"] for m in updated["metrics"]] == ["New"]


async def test_experiment_duplicate_is_draft(admin_client: AsyncClient) -> None:
    proj = await _project(admin_client)
    created = (
        await admin_client.post(
            EXP,
            json={
                "title": "Exp",
                "project_id": proj["id"],
                "metrics": [{"name": "A", "value": "1"}],
            },
        )
    ).json()["data"]
    await admin_client.post(f"{EXP}/{created['id']}/publish")
    dup = await admin_client.post(f"{EXP}/{created['id']}/duplicate")
    assert dup.status_code == 201
    copy = dup.json()["data"]
    assert copy["title"] == "Exp (Copy)"
    assert copy["status"] == "draft"
    assert copy["project_id"] == proj["id"]
    assert [m["name"] for m in copy["metrics"]] == ["A"]


async def test_experiment_project_link_and_filter(admin_client: AsyncClient) -> None:
    proj = await _project(admin_client, "Linked")
    created = (
        await admin_client.post(EXP, json={"title": "Linked Exp", "project_id": proj["id"]})
    ).json()["data"]
    assert created["project"]["title"] == "Linked"

    hits = (await admin_client.get(f"{EXP}?project={proj['id']}")).json()["data"]
    assert [e["id"] for e in hits] == [created["id"]]


# --- research ↔ project ----------------------------------------------------
async def test_research_project_link_and_duplicate(admin_client: AsyncClient) -> None:
    proj = await _project(admin_client, "Research Host")
    created = (
        await admin_client.post(
            RESEARCH, json={"title": "Retrieval Study", "abstract": "a", "project_id": proj["id"]}
        )
    ).json()["data"]
    assert created["project"]["title"] == "Research Host"

    dup = (await admin_client.post(f"{RESEARCH}/{created['id']}/duplicate")).json()["data"]
    assert dup["title"] == "Retrieval Study (Copy)"
    assert dup["status"] == "draft"
    assert dup["project_id"] == proj["id"]

    by_project = (await admin_client.get(f"{RESEARCH}?project={proj['id']}")).json()["data"]
    assert {r["id"] for r in by_project} == {created["id"], dup["id"]}


async def test_research_unpublish(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            RESEARCH, json={"title": "R", "abstract": "a", "status": "published"}
        )
    ).json()["data"]
    assert created["status"] == "published"
    assert (await admin_client.post(f"{RESEARCH}/{created['id']}/unpublish")).json()["data"][
        "status"
    ] == "draft"


# --- blog filters + duplicate ---------------------------------------------
async def test_blog_duplicate_copies_tags_as_draft(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            BLOG,
            json={
                "title": "RAG Eval",
                "content": "# body",
                "category": "RAG",
                "status": "published",
                "excerpt": "e",
                "tags": ["RAG", "Evaluation"],
            },
        )
    ).json()["data"]
    dup = (await admin_client.post(f"{BLOG}/{created['id']}/duplicate")).json()["data"]
    assert dup["title"] == "RAG Eval (Copy)"
    assert dup["status"] == "draft"
    assert {t["name"] for t in dup["tags"]} == {"RAG", "Evaluation"}


async def test_blog_admin_filters(admin_client: AsyncClient) -> None:
    await admin_client.post(BLOG, json={"title": "Draft A", "content": "x", "category": "Python"})
    await admin_client.post(
        BLOG,
        json={
            "title": "Pub B",
            "content": "x",
            "category": "RAG",
            "excerpt": "e",
            "status": "published",
        },
    )

    drafts = (await admin_client.get(f"{BLOG}?status=draft")).json()["data"]
    assert {p["title"] for p in drafts} == {"Draft A"}

    by_cat = (await admin_client.get(f"{BLOG}?category=RAG")).json()["data"]
    assert {p["title"] for p in by_cat} == {"Pub B"}

    by_q = (await admin_client.get(f"{BLOG}?q=draft")).json()["data"]
    assert {p["title"] for p in by_q} == {"Draft A"}


async def test_blog_by_slug_returns_draft(admin_client: AsyncClient) -> None:
    created = (await admin_client.post(BLOG, json={"title": "Slugged", "content": "x"})).json()[
        "data"
    ]
    resp = await admin_client.get(f"{BLOG}/by-slug/{created['slug']}")
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "draft"
    # Public detail 404s for the draft.
    assert (await admin_client.get(f"/api/v1/blog/{created['slug']}")).status_code == 404


async def test_admin_lists_are_paginated(admin_client: AsyncClient) -> None:
    for i in range(3):
        await admin_client.post(EXP, json={"title": f"E{i}"})
    resp = (await admin_client.get(f"{EXP}?page=1&page_size=2")).json()
    assert len(resp["data"]) == 2
    assert resp["meta"]["pagination"]["total"] == 3


# --- M4.5: expanded detail fields + project-centric related content --------
async def test_research_expanded_fields_roundtrip(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            RESEARCH,
            json={
                "title": "Retrieval Benchmark",
                "abstract": "a",
                "research_question": "Does hybrid beat dense?",
                "dataset": "100 domain queries",
                "experimental_setup": "BM25 vs dense vs hybrid",
                "analysis": "Hybrid improved recall",
                "limitations": "Small dataset",
                "references": "- Paper A",
                "status": "published",
            },
        )
    ).json()["data"]
    detail = (await admin_client.get(f"/api/v1/research/{created['slug']}")).json()["data"]
    assert detail["research_question"] == "Does hybrid beat dense?"
    assert detail["dataset"] == "100 domain queries"
    assert detail["limitations"] == "Small dataset"
    assert detail["references"] == "- Paper A"


async def test_experiment_expanded_fields_roundtrip(admin_client: AsyncClient) -> None:
    created = (
        await admin_client.post(
            EXP,
            json={
                "title": "Chunking Comparison",
                "hypothesis": "Smaller chunks help precision",
                "setup": "3 chunk sizes",
                "approach": "Grid over chunk size",
                "learnings": "512 tokens was the sweet spot",
                "status": "published",
            },
        )
    ).json()["data"]
    detail = (await admin_client.get(f"/api/v1/experiments/{created['slug']}")).json()["data"]
    assert detail["setup"] == "3 chunk sizes"
    assert detail["approach"] == "Grid over chunk size"
    assert detail["learnings"] == "512 tokens was the sweet spot"


async def test_project_centric_related_content(admin_client: AsyncClient) -> None:
    """Research and experiments sharing a project surface each other (published only)."""
    proj = await _project(admin_client, "Graph Hub")
    res = (
        await admin_client.post(
            RESEARCH,
            json={
                "title": "Shared Research",
                "abstract": "a",
                "project_id": proj["id"],
                "status": "published",
            },
        )
    ).json()["data"]
    exp = (
        await admin_client.post(
            EXP,
            json={"title": "Shared Experiment", "project_id": proj["id"], "status": "published"},
        )
    ).json()["data"]
    # A draft experiment on the same project must not leak into related content.
    await admin_client.post(EXP, json={"title": "Draft Experiment", "project_id": proj["id"]})

    research_detail = (await admin_client.get(f"/api/v1/research/{res['slug']}")).json()["data"]
    assert [e["title"] for e in research_detail["related_experiments"]] == ["Shared Experiment"]

    exp_detail = (await admin_client.get(f"/api/v1/experiments/{exp['slug']}")).json()["data"]
    assert [r["title"] for r in exp_detail["related_research"]] == ["Shared Research"]
