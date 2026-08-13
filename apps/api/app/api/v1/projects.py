"""Project endpoints — public reads plus write operations.

NOTE: write endpoints are unauthenticated for now; authentication/authorization
is added in M4. They exist here so the full CRUD pattern and its tests are in
place from the start.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=SuccessResponse[list[ProjectListResponse]])
async def list_projects(
    featured: bool | None = Query(default=None),
    category: str | None = Query(default=None),
    skill: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[ProjectListResponse]]:
    projects = await ProjectService(db).list(featured=featured, category=category, skill=skill)
    return success([ProjectListResponse.model_validate(p) for p in projects])


@router.get("/{slug}", response_model=SuccessResponse[ProjectResponse])
async def get_project(
    slug: str, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    project = await ProjectService(db).get_by_slug(slug)
    return success(ProjectResponse.model_validate(project))


@router.post(
    "",
    response_model=SuccessResponse[ProjectResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    payload: ProjectCreate, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    project = await ProjectService(db).create(payload)
    return success(ProjectResponse.model_validate(project))


@router.put("/{project_id}", response_model=SuccessResponse[ProjectResponse])
async def update_project(
    project_id: uuid.UUID, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    project = await ProjectService(db).update(project_id, payload)
    return success(ProjectResponse.model_validate(project))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    await ProjectService(db).delete(project_id)


@router.post("/{project_id}/publish", response_model=SuccessResponse[ProjectResponse])
async def publish_project(
    project_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    project = await ProjectService(db).publish(project_id)
    return success(ProjectResponse.model_validate(project))


@router.post("/{project_id}/archive", response_model=SuccessResponse[ProjectResponse])
async def archive_project(
    project_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    project = await ProjectService(db).archive(project_id)
    return success(ProjectResponse.model_validate(project))
