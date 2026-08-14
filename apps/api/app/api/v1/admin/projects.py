"""Admin project management (all statuses visible)."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_project_service, pagination_params
from app.repositories.pagination import PageRequest
from app.repositories.project import ProjectFilters
from app.schemas.common import SuccessResponse, paginated, success
from app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project import ProjectService

router = APIRouter(prefix="/projects", tags=["Admin: Projects"])


@router.get(
    "", response_model=SuccessResponse[list[ProjectListResponse]], summary="List all projects"
)
async def list_projects(
    pagination: PageRequest = Depends(pagination_params),
    service: ProjectService = Depends(get_project_service),
) -> SuccessResponse[list[ProjectListResponse]]:
    page = await service.search(filters=ProjectFilters(), pagination=pagination)
    return paginated(
        [ProjectListResponse.model_validate(p) for p in page.items],
        page=page.page,
        page_size=page.page_size,
        total=page.total,
    )


@router.post(
    "",
    response_model=SuccessResponse[ProjectResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a project",
)
async def create_project(
    payload: ProjectCreate, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    project = await service.create_project(payload)
    return success(ProjectResponse.model_validate(project))


@router.get(
    "/{project_id}", response_model=SuccessResponse[ProjectResponse], summary="Get a project"
)
async def get_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    return success(ProjectResponse.model_validate(await service.get_project(project_id)))


@router.put(
    "/{project_id}", response_model=SuccessResponse[ProjectResponse], summary="Update a project"
)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
) -> SuccessResponse[ProjectResponse]:
    return success(
        ProjectResponse.model_validate(await service.update_project(project_id, payload))
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a project")
async def delete_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> None:
    await service.delete_project(project_id)


@router.post(
    "/{project_id}/publish", response_model=SuccessResponse[ProjectResponse], summary="Publish"
)
async def publish_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    return success(ProjectResponse.model_validate(await service.publish_project(project_id)))


@router.post(
    "/{project_id}/archive", response_model=SuccessResponse[ProjectResponse], summary="Archive"
)
async def archive_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    return success(ProjectResponse.model_validate(await service.archive_project(project_id)))
