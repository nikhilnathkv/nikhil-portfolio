"""Public read-endpoint tests for the non-project entities."""

from datetime import UTC, date, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog import BlogPost
from app.models.enums import ContentStatus
from app.models.experience import Experience
from app.models.experiment import Experiment
from app.models.profile import Profile
from app.models.repository import Repository
from app.models.research import Research
from app.models.resume import Resume
from app.models.skill import Skill, SkillCategory

NOW = datetime.now(UTC)


# --- profile ---------------------------------------------------------------
async def test_profile_404_when_unset(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 404


async def test_profile_returns_seeded(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add(
        Profile(
            name="Nikhil",
            headline="AI Engineer",
            short_bio="Short",
            long_bio="Long",
        )
    )
    await db_session.commit()

    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 200
    assert resp.json()["data"]["name"] == "Nikhil"


# --- experience ------------------------------------------------------------
async def test_experience_list_and_get(client: AsyncClient, db_session: AsyncSession) -> None:
    exp = Experience(company="Acme", role="ML Engineer", start_date=date(2023, 1, 1))
    db_session.add(exp)
    await db_session.commit()
    await db_session.refresh(exp)

    listed = await client.get("/api/v1/experience")
    assert listed.status_code == 200
    assert len(listed.json()["data"]) == 1

    detail = await client.get(f"/api/v1/experience/{exp.id}")
    assert detail.status_code == 200
    assert detail.json()["data"]["company"] == "Acme"


# --- skills ----------------------------------------------------------------
async def test_skills_nested(client: AsyncClient, db_session: AsyncSession) -> None:
    cat = SkillCategory(name="AI / ML", display_order=0)
    cat.skills = [Skill(name="Python", display_order=0)]
    db_session.add(cat)
    await db_session.commit()

    resp = await client.get("/api/v1/skills")
    data = resp.json()["data"]
    assert data[0]["name"] == "AI / ML"
    assert data[0]["skills"][0]["name"] == "Python"


# --- blog ------------------------------------------------------------------
async def test_blog_hides_drafts(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add_all(
        [
            BlogPost(
                title="Published",
                slug="pub",
                content="x",
                status=ContentStatus.PUBLISHED,
                published_at=NOW,
            ),
            BlogPost(title="Draft", slug="draft", content="x", status=ContentStatus.DRAFT),
        ]
    )
    await db_session.commit()

    listed = await client.get("/api/v1/blog")
    slugs = [p["slug"] for p in listed.json()["data"]]
    assert slugs == ["pub"]

    assert (await client.get("/api/v1/blog/pub")).status_code == 200
    assert (await client.get("/api/v1/blog/draft")).status_code == 404


# --- research / experiments -----------------------------------------------
async def test_research_and_experiments(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add_all(
        [
            Research(title="R", slug="r", status=ContentStatus.PUBLISHED, published_at=NOW),
            Experiment(title="E", slug="e", status=ContentStatus.PUBLISHED),
        ]
    )
    await db_session.commit()

    assert (await client.get("/api/v1/research")).json()["data"][0]["slug"] == "r"
    assert (await client.get("/api/v1/research/r")).status_code == 200
    assert (await client.get("/api/v1/experiments")).json()["data"][0]["slug"] == "e"
    assert (await client.get("/api/v1/experiments/e")).status_code == 200


# --- repositories ----------------------------------------------------------
async def test_repositories(client: AsyncClient, db_session: AsyncSession) -> None:
    db_session.add(Repository(name="portfolio", url="https://github.com/x/portfolio"))
    await db_session.commit()

    resp = await client.get("/api/v1/repositories")
    assert resp.json()["data"][0]["name"] == "portfolio"


# --- resume ----------------------------------------------------------------
async def test_resume_active(client: AsyncClient, db_session: AsyncSession) -> None:
    assert (await client.get("/api/v1/resume")).status_code == 404

    db_session.add(Resume(name="CV", file_url="https://x/cv.pdf", version="v1", is_active=True))
    await db_session.commit()

    resp = await client.get("/api/v1/resume")
    assert resp.status_code == 200
    assert resp.json()["data"]["version"] == "v1"


async def test_profile_education_and_certifications(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M4.6: the resume reads education + certifications from the profile."""
    db_session.add(
        Profile(
            name="Nikhil",
            headline="AI Engineer",
            short_bio="Short",
            long_bio="Long",
            education="- BSc, Example University",
            certifications="- Azure AI Engineer",
        )
    )
    await db_session.commit()
    data = (await client.get("/api/v1/profile")).json()["data"]
    assert data["education"] == "- BSc, Example University"
    assert data["certifications"] == "- Azure AI Engineer"
