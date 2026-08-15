"""Project endpoints.

Public reads (list + detail) never expose drafts or archived projects. The write
endpoints remain unauthenticated for now — authentication is added with the
admin API in M2.7.
"""

import uuid
from enum import StrEnum

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_experiment_service,
    get_project_service,
    get_research_service,
    pagination_params,
)
from app.repositories.pagination import PageRequest
from app.schemas.common import SuccessResponse, paginated, success
from app.schemas.project import (
    ContentRef,
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.experiment import ExperimentService
from app.services.project import ProjectService
from app.services.research import ResearchService

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectSort(StrEnum):
    display_order = "display_order"
    created_at = "created_at"
    published_at = "published_at"


@router.get(
    "",
    response_model=SuccessResponse[list[ProjectListResponse]],
    summary="List published projects",
)
async def list_projects(
    featured: bool | None = Query(default=None),
    category: str | None = Query(default=None),
    status_filter: str | None = Query(
        default=None, alias="status", description="Public API only ever returns PUBLISHED."
    ),
    skill: str | None = Query(default=None),
    sort: ProjectSort = Query(default=ProjectSort.display_order),
    pagination: PageRequest = Depends(pagination_params),
    service: ProjectService = Depends(get_project_service),
) -> SuccessResponse[list[ProjectListResponse]]:
    page = await service.list_public(
        featured=featured,
        category=category,
        skill=skill,
        status=status_filter,
        sort=sort.value,
        pagination=pagination,
    )
    return paginated(
        [ProjectListResponse.model_validate(p) for p in page.items],
        page=page.page,
        page_size=page.page_size,
        total=page.total,
    )


@router.get(
    "/{slug}",
    response_model=SuccessResponse[ProjectResponse],
    summary="Get a published project by slug",
)
async def get_project(
    slug: str,
    service: ProjectService = Depends(get_project_service),
    research: ResearchService = Depends(get_research_service),
    experiments: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[ProjectResponse]:
    project = await service.get_by_slug(slug)
    # Related content graph: only published research/experiments linked to this
    # project (drafts never leak into the public case study).
    related_research = await research.list(project_id=project.id)
    related_experiments = await experiments.list(project_id=project.id)
    response = ProjectResponse.model_validate(project)
    response.related_research = [ContentRef.model_validate(r) for r in related_research]
    response.related_experiments = [ContentRef.model_validate(e) for e in related_experiments]
    return success(response)


# --- write endpoints (unauthenticated for now; secured in M2.7) -------------
@router.post(
    "",
    response_model=SuccessResponse[ProjectResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a project (admin — unauthenticated until M2.7)",
)
async def create_project(
    payload: ProjectCreate, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    project = await service.create_project(payload)
    return success(ProjectResponse.model_validate(project))


@router.put(
    "/{project_id}",
    response_model=SuccessResponse[ProjectResponse],
    summary="Update a project",
)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
) -> SuccessResponse[ProjectResponse]:
    project = await service.update_project(project_id, payload)
    return success(ProjectResponse.model_validate(project))


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a project (soft)"
)
async def delete_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> None:
    await service.delete_project(project_id)


@router.post(
    "/{project_id}/publish",
    response_model=SuccessResponse[ProjectResponse],
    summary="Publish a project",
)
async def publish_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    project = await service.publish_project(project_id)
    return success(ProjectResponse.model_validate(project))


@router.post(
    "/{project_id}/archive",
    response_model=SuccessResponse[ProjectResponse],
    summary="Archive a project",
)
async def archive_project(
    project_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[ProjectResponse]:
    project = await service.archive_project(project_id)
    return success(ProjectResponse.model_validate(project))
