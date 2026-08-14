"""FastAPI dependencies: service providers and shared query params.

Routes obtain services through these, so the HTTP layer never wires up sessions
or repositories itself.
"""

from __future__ import annotations

from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.pagination import MAX_PAGE_SIZE, PageRequest
from app.services.blog import BlogService
from app.services.contact import ContactService
from app.services.experience import ExperienceService
from app.services.experiment import ExperimentService
from app.services.github_repository import GitHubRepositoryService
from app.services.profile import ProfileService
from app.services.project import ProjectService
from app.services.research import ResearchService
from app.services.resume import ResumeService
from app.services.skill import SkillService


def get_profile_service(db: AsyncSession = Depends(get_db)) -> ProfileService:
    return ProfileService(db)


def get_experience_service(db: AsyncSession = Depends(get_db)) -> ExperienceService:
    return ExperienceService(db)


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_skill_service(db: AsyncSession = Depends(get_db)) -> SkillService:
    return SkillService(db)


def get_blog_service(db: AsyncSession = Depends(get_db)) -> BlogService:
    return BlogService(db)


def get_research_service(db: AsyncSession = Depends(get_db)) -> ResearchService:
    return ResearchService(db)


def get_experiment_service(db: AsyncSession = Depends(get_db)) -> ExperimentService:
    return ExperimentService(db)


def get_repository_service(db: AsyncSession = Depends(get_db)) -> GitHubRepositoryService:
    return GitHubRepositoryService(db)


def get_resume_service(db: AsyncSession = Depends(get_db)) -> ResumeService:
    return ResumeService(db)


def get_contact_service(db: AsyncSession = Depends(get_db)) -> ContactService:
    return ContactService(db)


def pagination_params(
    page: int = Query(1, ge=1, description="1-indexed page number"),
    page_size: int = Query(
        20, ge=1, le=MAX_PAGE_SIZE, description=f"Items per page (max {MAX_PAGE_SIZE})"
    ),
) -> PageRequest:
    return PageRequest(page=page, page_size=page_size)
