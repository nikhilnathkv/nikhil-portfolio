"""M2.5 — business-logic tests, exercised against a real PostgreSQL test DB.

These drive the service layer (which owns transactions) end-to-end through the
repositories, catching integration issues that mocks would hide.
"""

import uuid
from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BusinessRuleViolationError,
    DuplicateResourceError,
    InvalidStateTransitionError,
    ResourceNotFoundError,
)
from app.models.enums import ContactStatus, ContentStatus
from app.schemas.blog import BlogPostCreate
from app.schemas.contact import ContactMessageCreate
from app.schemas.experience import ExperienceCreate
from app.schemas.experiment import ExperimentCreate
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.schemas.project import ProjectCreate, ProjectMetricCreate, ProjectUpdate
from app.schemas.resume import ResumeCreate
from app.schemas.skill import SkillCategoryCreate, SkillCreate
from app.services.blog import BlogService
from app.services.contact import ContactService
from app.services.experience import ExperienceService
from app.services.experiment import ExperimentService
from app.services.profile import ProfileService
from app.services.project import ProjectService
from app.services.resume import ResumeService
from app.services.skill import SkillService


def _project(**kw) -> ProjectCreate:
    kw.setdefault("title", "Enterprise AI Copilot")
    kw.setdefault("short_description", "An AI copilot")
    kw.setdefault("description", "Long form description")
    kw.setdefault("category", "genai")
    return ProjectCreate(**kw)


# --- Project ---------------------------------------------------------------
async def test_create_project_generates_slug(db_session: AsyncSession) -> None:
    project = await ProjectService(db_session).create_project(_project())
    assert project.slug == "enterprise-ai-copilot"
    assert project.status is ContentStatus.DRAFT


async def test_supplied_duplicate_slug_rejected(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    await svc.create_project(_project(slug="copilot"))
    with pytest.raises(DuplicateResourceError):
        await svc.create_project(_project(title="Other", slug="copilot"))


async def test_generated_slug_auto_suffixes(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    a = await svc.create_project(_project())
    b = await svc.create_project(_project())  # same title, no slug supplied
    assert a.slug == "enterprise-ai-copilot"
    assert b.slug == "enterprise-ai-copilot-2"


async def test_partial_update(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    project = await svc.create_project(_project())
    updated = await svc.update_project(project.id, ProjectUpdate(short_description="Changed"))
    assert updated.short_description == "Changed"
    assert updated.title == "Enterprise AI Copilot"  # untouched


async def test_publish_and_republish(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    project = await svc.create_project(_project())
    published = await svc.publish_project(project.id)
    assert published.status is ContentStatus.PUBLISHED
    assert published.published_at is not None

    archived = await svc.archive_project(project.id)
    assert archived.status is ContentStatus.ARCHIVED

    republished = await svc.publish_project(project.id)  # ARCHIVED -> PUBLISHED
    assert republished.status is ContentStatus.PUBLISHED


async def test_invalid_publish_rejected(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    # Missing description/category.
    project = await svc.create_project(ProjectCreate(title="Bare", short_description="x"))
    with pytest.raises(BusinessRuleViolationError):
        await svc.publish_project(project.id)


async def test_create_with_relationships_is_atomic(db_session: AsyncSession) -> None:
    # Seed a skill.
    skills = SkillService(db_session)
    cat = await skills.create_category(SkillCategoryCreate(name="AI"))
    skill = await skills.create_skill(SkillCreate(category_id=cat.id, name="LangGraph"))

    svc = ProjectService(db_session)
    project = await svc.create_project(
        _project(
            skill_ids=[skill.id],
            metrics=[ProjectMetricCreate(name="F1", value="0.9")],
        )
    )
    assert [s.name for s in project.skills] == ["LangGraph"]
    assert [m.name for m in project.metrics] == ["F1"]


async def test_failed_publish_at_create_persists_nothing(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    with pytest.raises(BusinessRuleViolationError):
        await svc.create_project(
            ProjectCreate(title="Incomplete", short_description="x", status=ContentStatus.PUBLISHED)
        )
    # Rollback path: nothing persisted.
    page = await svc.search()
    assert page.total == 0


async def test_set_and_unset_featured(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    project = await svc.create_project(_project())
    assert (await svc.set_featured(project.id)).featured is True
    assert (await svc.unset_featured(project.id)).featured is False


# --- Experience ------------------------------------------------------------
async def test_experience_current_clears_end_date(db_session: AsyncSession) -> None:
    svc = ExperienceService(db_session)
    exp = await svc.create_experience(
        ExperienceCreate(
            company="Novigo",
            role="Lead",
            start_date=date(2024, 1, 1),
            end_date=date(2025, 1, 1),
            is_current=True,
        )
    )
    assert exp.end_date is None


async def test_new_current_role_demotes_previous(db_session: AsyncSession) -> None:
    svc = ExperienceService(db_session)
    await svc.create_experience(
        ExperienceCreate(company="EY", role="Eng", start_date=date(2020, 1, 1), is_current=True)
    )
    await svc.create_experience(
        ExperienceCreate(
            company="Novigo", role="Lead", start_date=date(2024, 1, 1), is_current=True
        )
    )
    current = await svc.get_current_experience()
    assert [e.company for e in current] == ["Novigo"]


async def test_experience_invalid_dates_rejected(db_session: AsyncSession) -> None:
    svc = ExperienceService(db_session)
    with pytest.raises(BusinessRuleViolationError):
        await svc.create_experience(
            ExperienceCreate(
                company="X",
                role="Y",
                start_date=date(2024, 1, 1),
                end_date=date(2023, 1, 1),
            )
        )


# --- Blog ------------------------------------------------------------------
async def test_blog_lifecycle(db_session: AsyncSession) -> None:
    svc = BlogService(db_session)
    post = await svc.create_post(
        BlogPostCreate(title="Hello", content="body", excerpt="e", category="eng")
    )
    assert post.status is ContentStatus.DRAFT

    published = await svc.publish_post(post.id)
    assert published.status is ContentStatus.PUBLISHED
    assert published.published_at is not None

    archived = await svc.archive_post(post.id)
    assert archived.status is ContentStatus.ARCHIVED


async def test_blog_invalid_publish_rejected(db_session: AsyncSession) -> None:
    svc = BlogService(db_session)
    post = await svc.create_post(BlogPostCreate(title="NoMeta", content="body"))  # no excerpt/cat
    with pytest.raises(BusinessRuleViolationError):
        await svc.publish_post(post.id)


# --- Resume ----------------------------------------------------------------
async def test_resume_single_active_invariant(db_session: AsyncSession) -> None:
    svc = ResumeService(db_session)
    r1 = await svc.upload_resume(
        ResumeCreate(name="v1", file_url="https://x/1.pdf", version="v1", is_active=True)
    )
    assert (await svc.get_active_resume()).id == r1.id

    r2 = await svc.upload_resume(
        ResumeCreate(name="v2", file_url="https://x/2.pdf", version="v2", is_active=True)
    )
    active = await svc.get_active_resume()
    assert active.id == r2.id
    resumes = {r.id: r.is_active for r in await svc.list_resumes()}
    assert resumes[r1.id] is False and resumes[r2.id] is True


# --- Contact ---------------------------------------------------------------
async def test_contact_flow(db_session: AsyncSession) -> None:
    svc = ContactService(db_session)
    msg = await svc.submit_contact_message(
        ContactMessageCreate(name="  Nikhil  ", email="a@b.com", message="  hello  ")
    )
    assert msg.status is ContactStatus.UNREAD
    assert msg.name == "Nikhil"  # normalized

    read = await svc.mark_read(msg.id)
    assert read.status is ContactStatus.READ

    archived = await svc.archive_message(msg.id)
    assert archived.status is ContactStatus.ARCHIVED


async def test_contact_mark_read_on_archived_rejected(db_session: AsyncSession) -> None:
    svc = ContactService(db_session)
    msg = await svc.submit_contact_message(
        ContactMessageCreate(name="N", email="a@b.com", message="hi")
    )
    await svc.archive_message(msg.id)
    with pytest.raises(InvalidStateTransitionError):
        await svc.mark_read(msg.id)


# --- Skill -----------------------------------------------------------------
async def test_skill_uniqueness_and_delete_guard(db_session: AsyncSession) -> None:
    svc = SkillService(db_session)
    cat = await svc.create_category(SkillCategoryCreate(name="AI"))
    with pytest.raises(DuplicateResourceError):
        await svc.create_category(SkillCategoryCreate(name="AI"))

    await svc.create_skill(SkillCreate(category_id=cat.id, name="PyTorch"))
    with pytest.raises(DuplicateResourceError):
        await svc.create_skill(SkillCreate(category_id=cat.id, name="PyTorch"))

    skill = await svc.create_skill(SkillCreate(category_id=cat.id, name="LangGraph"))
    # Reference it from a project, then deletion should be guarded.
    await ProjectService(db_session).create_project(_project(skill_ids=[skill.id]))
    with pytest.raises(BusinessRuleViolationError):
        await svc.delete_skill(skill.id)
    await svc.delete_skill(skill.id, force=True)  # explicit override


# --- Profile ---------------------------------------------------------------
async def test_profile_singleton_service(db_session: AsyncSession) -> None:
    svc = ProfileService(db_session)
    with pytest.raises(ResourceNotFoundError):
        await svc.get_profile()

    await svc.initialize_profile(
        ProfileCreate(name="Nikhil", headline="AI", short_bio="s", long_bio="l")
    )
    with pytest.raises(BusinessRuleViolationError):
        await svc.initialize_profile(
            ProfileCreate(name="Dup", headline="AI", short_bio="s", long_bio="l")
        )

    updated = await svc.update_profile(ProfileUpdate(headline="Senior AI Engineer"))
    assert updated.headline == "Senior AI Engineer"


# --- Experiment ------------------------------------------------------------
async def test_experiment_project_validation(db_session: AsyncSession) -> None:
    svc = ExperimentService(db_session)
    with pytest.raises(ResourceNotFoundError):
        await svc.create_experiment(
            ExperimentCreate(title="E", project_id=uuid.uuid4())  # non-existent project
        )

    project = await ProjectService(db_session).create_project(_project())
    exp = await svc.create_experiment(ExperimentCreate(title="E", project_id=project.id))
    assert exp.project_id == project.id
