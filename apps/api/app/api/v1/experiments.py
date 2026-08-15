"""Experiment endpoints (published only)."""

import uuid

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_experiment_service, get_research_service
from app.schemas.common import SuccessResponse, success
from app.schemas.experiment import ExperimentListResponse, ExperimentResponse
from app.schemas.project import ContentRef
from app.services.experiment import ExperimentService
from app.services.research import ResearchService

router = APIRouter(prefix="/experiments", tags=["Experiments"])


@router.get(
    "",
    response_model=SuccessResponse[list[ExperimentListResponse]],
    summary="List published experiments",
)
async def list_experiments(
    project_id: uuid.UUID | None = Query(default=None, description="Filter by related project"),
    service: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[list[ExperimentListResponse]]:
    items = await service.list(project_id=project_id)
    return success([ExperimentListResponse.model_validate(i) for i in items])


@router.get(
    "/{slug}",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Get a published experiment by slug",
)
async def get_experiment(
    slug: str,
    service: ExperimentService = Depends(get_experiment_service),
    research: ResearchService = Depends(get_research_service),
) -> SuccessResponse[ExperimentResponse]:
    item = await service.get_by_slug(slug)
    response = ExperimentResponse.model_validate(item)
    # Project-centric graph: sibling research that shares this project.
    if item.project_id is not None:
        siblings = await research.list(project_id=item.project_id)
        response.related_research = [ContentRef.model_validate(r) for r in siblings]
    return success(response)
