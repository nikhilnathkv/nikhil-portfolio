"""Repository layer — persistence operations only, no business logic.

Repositories receive an ``AsyncSession`` (via dependency injection) and ``flush``
their writes; the service layer owns transaction boundaries (commit/rollback).
"""

from app.repositories.base import BaseRepository, SlugRepository
from app.repositories.blog import BlogRepository
from app.repositories.contact import ContactMessageRepository
from app.repositories.experience import ExperienceRepository
from app.repositories.experiment import ExperimentRepository
from app.repositories.media import MediaRepository
from app.repositories.pagination import Page, PageRequest
from app.repositories.profile import ProfileRepository
from app.repositories.project import ProjectFilters, ProjectRepository
from app.repositories.repository import GitHubRepository
from app.repositories.research import ResearchRepository
from app.repositories.resume import ResumeRepository
from app.repositories.skill import SkillCategoryRepository, SkillRepository

__all__ = [
    "BaseRepository",
    "SlugRepository",
    "Page",
    "PageRequest",
    "ProjectRepository",
    "ProjectFilters",
    "ExperienceRepository",
    "ProfileRepository",
    "SkillRepository",
    "SkillCategoryRepository",
    "BlogRepository",
    "ResearchRepository",
    "ExperimentRepository",
    "GitHubRepository",
    "ResumeRepository",
    "MediaRepository",
    "ContactMessageRepository",
]
