"""Aggregate router for API v1. New feature routers are included here."""

from fastapi import APIRouter

from app.api.v1 import (
    blog,
    experience,
    experiments,
    health,
    profile,
    projects,
    repositories,
    research,
    resume,
    skills,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(profile.router)
api_router.include_router(experience.router)
api_router.include_router(projects.router)
api_router.include_router(skills.router)
api_router.include_router(blog.router)
api_router.include_router(research.router)
api_router.include_router(experiments.router)
api_router.include_router(repositories.router)
api_router.include_router(resume.router)
