"""FastAPI dependencies: service providers and shared query params.

Routes obtain services through these, so the HTTP layer never wires up sessions
or repositories itself.
"""

from __future__ import annotations

from fastapi import Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.pagination import MAX_PAGE_SIZE, PageRequest
from app.services.auth import AuthService
from app.services.blog import BlogService
from app.services.contact import ContactService
from app.services.dashboard import DashboardService
from app.services.experience import ExperienceService
from app.services.experiment import ExperimentService
from app.services.github_repository import GitHubRepositoryService
from app.services.media import MediaService
from app.services.profile import ProfileService
from app.services.project import ProjectService
from app.services.research import ResearchService
from app.services.resume import ResumeService
from app.services.settings import SettingsService
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


def get_media_service(db: AsyncSession = Depends(get_db)) -> MediaService:
    return MediaService(db)


def get_settings_service(db: AsyncSession = Depends(get_db)) -> SettingsService:
    return SettingsService(db)


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(db)


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


# --- authentication / authorization -----------------------------------------
async def get_current_user(
    request: Request, auth: AuthService = Depends(get_auth_service)
) -> User | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    return await auth.authenticate_session(token)


async def require_authenticated_user(
    user: User | None = Depends(get_current_user),
) -> User:
    if user is None:
        raise AuthenticationError("Authentication required")
    return user


async def require_admin(user: User = Depends(require_authenticated_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise PermissionDeniedError("Admin privileges required")
    return user


def pagination_params(
    page: int = Query(1, ge=1, description="1-indexed page number"),
    page_size: int = Query(
        20, ge=1, le=MAX_PAGE_SIZE, description=f"Items per page (max {MAX_PAGE_SIZE})"
    ),
) -> PageRequest:
    return PageRequest(page=page, page_size=page_size)
