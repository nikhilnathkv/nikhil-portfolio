"""SQLAlchemy models.

Importing this package registers every table on ``Base.metadata`` so that
Alembic autogenerate and ``metadata.create_all`` see the full schema.
"""

from app.models.blog import BlogPost, BlogTag, blog_post_tags
from app.models.contact_message import ContactMessage
from app.models.enums import ContactStatus, ContentStatus, UserRole
from app.models.experience import Experience, experience_projects
from app.models.experiment import Experiment
from app.models.media import Media
from app.models.profile import Profile
from app.models.project import Project, ProjectMetric, project_skills
from app.models.repository import Repository
from app.models.research import Research
from app.models.resume import Resume
from app.models.session import Session
from app.models.site_settings import SiteSetting
from app.models.skill import Skill, SkillCategory
from app.models.user import User

__all__ = [
    "BlogPost",
    "BlogTag",
    "blog_post_tags",
    "ContactMessage",
    "ContactStatus",
    "ContentStatus",
    "Experience",
    "experience_projects",
    "Experiment",
    "Media",
    "Profile",
    "Project",
    "ProjectMetric",
    "project_skills",
    "Repository",
    "Research",
    "Resume",
    "Session",
    "SiteSetting",
    "Skill",
    "SkillCategory",
    "User",
    "UserRole",
]
