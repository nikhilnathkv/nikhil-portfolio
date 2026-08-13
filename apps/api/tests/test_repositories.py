"""M2.4 — database-backed repository tests (real PostgreSQL, not mocks).

Covers CRUD, filtering, pagination, sorting, slug uniqueness, the profile
singleton guard, and relationship persistence (project ↔ skills / metrics).
Repositories only flush; these tests own the session via the ``db_session``
fixture, mirroring how the service layer will drive them.
"""

from datetime import UTC, date, datetime

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ContactStatus, ContentStatus
from app.models.profile import Profile
from app.models.project import Project, ProjectMetric
from app.models.skill import Skill, SkillCategory
from app.repositories.blog import BlogRepository
from app.repositories.contact import ContactMessageRepository
from app.repositories.experience import ExperienceRepository
from app.repositories.experiment import ExperimentRepository
from app.repositories.media import MediaRepository
from app.repositories.pagination import PageRequest
from app.repositories.profile import ProfileRepository
from app.repositories.project import ProjectFilters, ProjectRepository
from app.repositories.repository import GitHubRepository
from app.repositories.research import ResearchRepository
from app.repositories.resume import ResumeRepository
from app.repositories.skill import SkillCategoryRepository, SkillRepository

NOW = datetime.now(UTC)


async def _make_project(session: AsyncSession, **kw) -> Project:
    kw.setdefault("title", "Project")
    kw.setdefault("short_description", "desc")
    kw.setdefault("status", ContentStatus.PUBLISHED)
    skills = kw.pop("skills", None)
    metrics = kw.pop("metrics", None)
    project = Project(**kw)
    if skills is not None:
        project.skills = skills
    if metrics is not None:
        project.metrics = metrics
    session.add(project)
    await session.flush()
    return project


# --- Project ---------------------------------------------------------------
async def test_project_crud_and_slug(db_session: AsyncSession) -> None:
    repo = ProjectRepository(db_session)

    created = await repo.create(title="Aviation", slug="aviation", short_description="d")
    assert created.id is not None

    assert (await repo.get_by_id(created.id)).slug == "aviation"
    assert (await repo.get_by_slug("aviation")).id == created.id
    assert await repo.exists_by_slug("aviation") is True
    assert await repo.exists_by_slug("aviation", exclude_id=created.id) is False

    await repo.update(created, title="Aviation v2")
    assert (await repo.get_by_id(created.id)).title == "Aviation v2"

    await repo.delete(created)  # soft delete
    assert await repo.get_by_id(created.id) is None
    assert await repo.get_by_id(created.id, include_deleted=True) is not None


async def test_project_filtering(db_session: AsyncSession) -> None:
    await _make_project(db_session, slug="a", category="ml", featured=True)
    await _make_project(db_session, slug="b", category="genai", featured=False)
    await _make_project(db_session, slug="c", category="ml", status=ContentStatus.DRAFT)

    repo = ProjectRepository(db_session)

    page = await repo.search(filters=ProjectFilters(category="ml"))
    assert {p.slug for p in page.items} == {"a", "c"}

    page = await repo.search(filters=ProjectFilters(featured=True))
    assert {p.slug for p in page.items} == {"a"}

    page = await repo.search(filters=ProjectFilters(status=ContentStatus.DRAFT))
    assert {p.slug for p in page.items} == {"c"}


async def test_project_filter_by_skill(db_session: AsyncSession) -> None:
    cat = SkillCategory(name="AI", display_order=0)
    lang = Skill(name="LangGraph", category=cat)
    db_session.add(cat)
    await db_session.flush()

    await _make_project(db_session, slug="rag", skills=[lang])
    await _make_project(db_session, slug="other")

    repo = ProjectRepository(db_session)
    page = await repo.search(filters=ProjectFilters(skill="langgraph"))
    assert [p.slug for p in page.items] == ["rag"]


async def test_project_pagination(db_session: AsyncSession) -> None:
    for i in range(25):
        await _make_project(db_session, slug=f"p{i:02d}", display_order=i)

    repo = ProjectRepository(db_session)
    page = await repo.search(pagination=PageRequest(page=2, page_size=10))
    assert page.total == 25
    assert page.page == 2
    assert page.page_size == 10
    assert page.pages == 3
    assert len(page.items) == 10


async def test_project_get_featured_published_only(db_session: AsyncSession) -> None:
    await _make_project(db_session, slug="feat-pub", featured=True)
    await _make_project(db_session, slug="feat-draft", featured=True, status=ContentStatus.DRAFT)

    repo = ProjectRepository(db_session)
    featured = await repo.get_featured()
    assert [p.slug for p in featured] == ["feat-pub"]


async def test_project_relationships_persist(db_session: AsyncSession) -> None:
    cat = SkillCategory(name="ML", display_order=0)
    py = Skill(name="Python", category=cat)
    db_session.add(cat)
    await db_session.flush()

    project = await _make_project(
        db_session,
        slug="rel",
        skills=[py],
        metrics=[ProjectMetric(name="F1", value="0.91"), ProjectMetric(name="Latency", value="42")],
    )

    reloaded = await ProjectRepository(db_session).get_by_id(project.id)
    assert [s.name for s in reloaded.skills] == ["Python"]
    assert {m.name for m in reloaded.metrics} == {"F1", "Latency"}


# --- Experience ------------------------------------------------------------
async def test_experience_crud_ordering_current(db_session: AsyncSession) -> None:
    repo = ExperienceRepository(db_session)
    await repo.create(company="Old", role="Eng", start_date=date(2019, 1, 1), display_order=2)
    await repo.create(
        company="Now", role="Lead", start_date=date(2023, 1, 1), is_current=True, display_order=1
    )

    ordered = await repo.list_ordered()
    assert [e.company for e in ordered] == ["Now", "Old"]  # display_order asc

    current = await repo.get_current()
    assert [e.company for e in current] == ["Now"]


# --- Blog ------------------------------------------------------------------
async def test_blog_crud_slug_and_published_filter(db_session: AsyncSession) -> None:
    repo = BlogRepository(db_session)
    await repo.create(
        title="Pub", slug="pub", content="x", status=ContentStatus.PUBLISHED, published_at=NOW
    )
    await repo.create(title="Draft", slug="draft", content="x", status=ContentStatus.DRAFT)

    assert (await repo.get_by_slug("pub")).title == "Pub"
    assert await repo.exists_by_slug("draft") is True
    assert [p.slug for p in await repo.get_published()] == ["pub"]
    assert [p.slug for p in await repo.list_by_status(ContentStatus.DRAFT)] == ["draft"]


# --- Research / Experiment -------------------------------------------------
async def test_research_slug(db_session: AsyncSession) -> None:
    repo = ResearchRepository(db_session)
    await repo.create(title="R", slug="r", status=ContentStatus.PUBLISHED)
    assert (await repo.get_by_slug("r")) is not None
    assert await repo.exists_by_slug("r") is True


async def test_experiment_list_by_project(db_session: AsyncSession) -> None:
    project = await _make_project(db_session, slug="host")
    erepo = ExperimentRepository(db_session)
    await erepo.create(title="E1", slug="e1", project_id=project.id)
    await erepo.create(title="E2", slug="e2")  # unrelated

    linked = await erepo.list_by_project(project.id)
    assert [e.slug for e in linked] == ["e1"]


# --- Skills ----------------------------------------------------------------
async def test_skill_by_category(db_session: AsyncSession) -> None:
    ai = await SkillCategoryRepository(db_session).create(name="AI", display_order=0)
    eng = await SkillCategoryRepository(db_session).create(name="Eng", display_order=1)
    srepo = SkillRepository(db_session)
    await srepo.create(name="PyTorch", category_id=ai.id)
    await srepo.create(name="Docker", category_id=eng.id)

    assert [s.name for s in await srepo.list_by_category(ai.id)] == ["PyTorch"]


# --- GitHub repositories ---------------------------------------------------
async def test_github_repository_crud(db_session: AsyncSession) -> None:
    repo = GitHubRepository(db_session)
    r = await repo.create(name="portfolio", url="https://github.com/x/portfolio", featured=True)
    assert (await repo.get_by_id(r.id)).name == "portfolio"
    assert [x.name for x in await repo.list_ordered(featured=True)] == ["portfolio"]
    await repo.delete(r)  # hard delete (no soft-delete column)
    assert await repo.get_by_id(r.id) is None


# --- Resume ----------------------------------------------------------------
async def test_resume_active_and_toggle(db_session: AsyncSession) -> None:
    repo = ResumeRepository(db_session)
    r1 = await repo.create(name="v1", file_url="https://x/1.pdf", version="v1", is_active=True)
    assert (await repo.get_active()).id == r1.id

    await repo.archive(r1)
    assert await repo.get_active() is None
    await repo.activate(r1)
    assert (await repo.get_active()).id == r1.id


# --- Media -----------------------------------------------------------------
async def test_media_crud(db_session: AsyncSession) -> None:
    repo = MediaRepository(db_session)
    m = await repo.create(
        filename="a.png",
        original_filename="a.png",
        mime_type="image/png",
        size=1234,
        storage_key="key/a.png",
        url="https://x/a.png",
    )
    assert (await repo.get_by_id(m.id)).filename == "a.png"
    assert len(await repo.list_recent()) == 1
    await repo.delete(m)
    assert await repo.get_by_id(m.id) is None


# --- Contact ---------------------------------------------------------------
async def test_contact_flow(db_session: AsyncSession) -> None:
    repo = ContactMessageRepository(db_session)
    msg = await repo.create(name="N", email="n@example.com", message="hi")
    assert await repo.get_unread_count() == 1

    await repo.mark_read(msg)
    assert msg.status is ContactStatus.READ
    assert msg.read_at is not None
    assert await repo.get_unread_count() == 0

    await repo.archive(msg)
    assert msg.status is ContactStatus.ARCHIVED


# --- Profile singleton guard ----------------------------------------------
async def test_profile_get_returns_single(db_session: AsyncSession) -> None:
    db_session.add(Profile(name="N", headline="H", short_bio="s", long_bio="l"))
    await db_session.flush()
    assert (await ProfileRepository(db_session).get()).name == "N"


async def test_profile_singleton_enforced_at_db(db_session: AsyncSession) -> None:
    db_session.add(Profile(name="One", headline="H", short_bio="s", long_bio="l"))
    await db_session.flush()

    db_session.add(Profile(name="Two", headline="H", short_bio="s", long_bio="l"))
    with pytest.raises(IntegrityError):
        await db_session.flush()
    await db_session.rollback()
