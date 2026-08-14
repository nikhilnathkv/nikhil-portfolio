"""Admin experiment management."""

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_experiment_service, pagination_params
from app.models.enums import ContentStatus
from app.repositories.experiment import ExperimentFilters
from app.repositories.pagination import PageRequest
from app.schemas.common import SuccessResponse, paginated, success
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentUpdate,
)
from app.services.experiment import ExperimentService

router = APIRouter(prefix="/experiments", tags=["Admin: Experiments"])


@router.get(
    "", response_model=SuccessResponse[list[ExperimentListResponse]], summary="List all experiments"
)
async def list_experiments(
    q: str | None = Query(default=None),
    status_filter: ContentStatus | None = Query(default=None, alias="status"),
    project: uuid.UUID | None = Query(default=None),
    pagination: PageRequest = Depends(pagination_params),
    service: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[list[ExperimentListResponse]]:
    page = await service.search(
        filters=ExperimentFilters(status=status_filter, project_id=project, search=q),
        pagination=pagination,
    )
    return paginated(
        [ExperimentListResponse.model_validate(i) for i in page.items],
        page=page.page,
        page_size=page.page_size,
        total=page.total,
    )


@router.get(
    "/by-slug/{slug}",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Get an experiment by slug (any status) — used by the admin preview",
)
async def get_experiment_by_slug(
    slug: str, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(
        ExperimentResponse.model_validate(await service.get_by_slug(slug, published_only=False))
    )


@router.post(
    "",
    response_model=SuccessResponse[ExperimentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create an experiment",
)
async def create_experiment(
    payload: ExperimentCreate, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(ExperimentResponse.model_validate(await service.create_experiment(payload)))


@router.get(
    "/{experiment_id}", response_model=SuccessResponse[ExperimentResponse], summary="Get experiment"
)
async def get_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(ExperimentResponse.model_validate(await service.get_experiment(experiment_id)))


@router.put(
    "/{experiment_id}",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Update experiment",
)
async def update_experiment(
    experiment_id: uuid.UUID,
    payload: ExperimentUpdate,
    service: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[ExperimentResponse]:
    return success(
        ExperimentResponse.model_validate(await service.update_experiment(experiment_id, payload))
    )


@router.delete(
    "/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete experiment"
)
async def delete_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> None:
    await service.delete_experiment(experiment_id)


@router.post(
    "/{experiment_id}/publish",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Publish",
)
async def publish_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(
        ExperimentResponse.model_validate(await service.publish_experiment(experiment_id))
    )


@router.post(
    "/{experiment_id}/unpublish",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Unpublish",
)
async def unpublish_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(
        ExperimentResponse.model_validate(await service.unpublish_experiment(experiment_id))
    )


@router.post(
    "/{experiment_id}/archive",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Archive",
)
async def archive_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(
        ExperimentResponse.model_validate(await service.archive_experiment(experiment_id))
    )


@router.post(
    "/{experiment_id}/duplicate",
    response_model=SuccessResponse[ExperimentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate an experiment as a new draft",
)
async def duplicate_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(
        ExperimentResponse.model_validate(await service.duplicate_experiment(experiment_id))
    )
