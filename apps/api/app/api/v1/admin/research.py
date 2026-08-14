"""Admin research management."""

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_research_service, pagination_params
from app.models.enums import ContentStatus
from app.repositories.pagination import PageRequest
from app.repositories.research import ResearchFilters
from app.schemas.common import SuccessResponse, paginated, success
from app.schemas.research import (
    ResearchCreate,
    ResearchListResponse,
    ResearchResponse,
    ResearchUpdate,
)
from app.services.research import ResearchService

router = APIRouter(prefix="/research", tags=["Admin: Research"])


@router.get(
    "", response_model=SuccessResponse[list[ResearchListResponse]], summary="List all research"
)
async def list_research(
    q: str | None = Query(default=None),
    status_filter: ContentStatus | None = Query(default=None, alias="status"),
    project: uuid.UUID | None = Query(default=None),
    pagination: PageRequest = Depends(pagination_params),
    service: ResearchService = Depends(get_research_service),
) -> SuccessResponse[list[ResearchListResponse]]:
    page = await service.search(
        filters=ResearchFilters(status=status_filter, project_id=project, search=q),
        pagination=pagination,
    )
    return paginated(
        [ResearchListResponse.model_validate(i) for i in page.items],
        page=page.page,
        page_size=page.page_size,
        total=page.total,
    )


@router.get(
    "/by-slug/{slug}",
    response_model=SuccessResponse[ResearchResponse],
    summary="Get research by slug (any status) — used by the admin preview",
)
async def get_research_by_slug(
    slug: str, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(
        ResearchResponse.model_validate(await service.get_by_slug(slug, published_only=False))
    )


@router.post(
    "",
    response_model=SuccessResponse[ResearchResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create research",
)
async def create_research(
    payload: ResearchCreate, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(ResearchResponse.model_validate(await service.create_research(payload)))


@router.get(
    "/{research_id}", response_model=SuccessResponse[ResearchResponse], summary="Get research"
)
async def get_research(
    research_id: uuid.UUID, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(ResearchResponse.model_validate(await service.get_research(research_id)))


@router.put(
    "/{research_id}", response_model=SuccessResponse[ResearchResponse], summary="Update research"
)
async def update_research(
    research_id: uuid.UUID,
    payload: ResearchUpdate,
    service: ResearchService = Depends(get_research_service),
) -> SuccessResponse[ResearchResponse]:
    return success(
        ResearchResponse.model_validate(await service.update_research(research_id, payload))
    )


@router.delete("/{research_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete research")
async def delete_research(
    research_id: uuid.UUID, service: ResearchService = Depends(get_research_service)
) -> None:
    await service.delete_research(research_id)


@router.post(
    "/{research_id}/publish", response_model=SuccessResponse[ResearchResponse], summary="Publish"
)
async def publish_research(
    research_id: uuid.UUID, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(ResearchResponse.model_validate(await service.publish_research(research_id)))


@router.post(
    "/{research_id}/unpublish",
    response_model=SuccessResponse[ResearchResponse],
    summary="Unpublish",
)
async def unpublish_research(
    research_id: uuid.UUID, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(ResearchResponse.model_validate(await service.unpublish_research(research_id)))


@router.post(
    "/{research_id}/archive", response_model=SuccessResponse[ResearchResponse], summary="Archive"
)
async def archive_research(
    research_id: uuid.UUID, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(ResearchResponse.model_validate(await service.archive_research(research_id)))


@router.post(
    "/{research_id}/duplicate",
    response_model=SuccessResponse[ResearchResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate research as a new draft",
)
async def duplicate_research(
    research_id: uuid.UUID, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    return success(ResearchResponse.model_validate(await service.duplicate_research(research_id)))
