"""Admin API aggregator.

All admin routes live under ``/admin`` and require an authenticated admin — the
``require_admin`` dependency is applied once here, so every included route is
protected. Public and admin routers are kept physically separate.
"""

from fastapi import APIRouter, Depends

from app.api.deps import require_admin
from app.api.v1.admin import (
    blog,
    dashboard,
    experience,
    experiments,
    media,
    messages,
    profile,
    projects,
    repositories,
    research,
    resume,
    settings,
    skills,
)

admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])
admin_router.include_router(dashboard.router)
admin_router.include_router(projects.router)
admin_router.include_router(experience.router)
admin_router.include_router(profile.router)
admin_router.include_router(skills.router)
admin_router.include_router(blog.router)
admin_router.include_router(research.router)
admin_router.include_router(experiments.router)
admin_router.include_router(repositories.router)
admin_router.include_router(resume.router)
admin_router.include_router(media.router)
admin_router.include_router(messages.router)
admin_router.include_router(settings.router)
