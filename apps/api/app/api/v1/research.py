"""Research endpoints (published only)."""

from fastapi import APIRouter, Depends

from app.api.deps import get_experiment_service, get_research_service
from app.schemas.common import SuccessResponse, success
from app.schemas.project import ContentRef
from app.schemas.research import ResearchListResponse, ResearchResponse
from app.services.experiment import ExperimentService
from app.services.research import ResearchService

router = APIRouter(prefix="/research", tags=["Research"])


@router.get(
    "",
    response_model=SuccessResponse[list[ResearchListResponse]],
    summary="List published research",
)
async def list_research(
    service: ResearchService = Depends(get_research_service),
) -> SuccessResponse[list[ResearchListResponse]]:
    items = await service.list()
    return success([ResearchListResponse.model_validate(i) for i in items])


@router.get(
    "/{slug}",
    response_model=SuccessResponse[ResearchResponse],
    summary="Get a published research item by slug",
)
async def get_research(
    slug: str,
    service: ResearchService = Depends(get_research_service),
    experiments: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[ResearchResponse]:
    item = await service.get_by_slug(slug)
    response = ResearchResponse.model_validate(item)
    # Project-centric graph: sibling experiments that share this project.
    if item.project_id is not None:
        siblings = await experiments.list(project_id=item.project_id)
        response.related_experiments = [ContentRef.model_validate(e) for e in siblings]
    return success(response)
