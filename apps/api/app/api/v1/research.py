"""Research endpoints (published only)."""

from fastapi import APIRouter, Depends

from app.api.deps import get_research_service
from app.schemas.common import SuccessResponse, success
from app.schemas.research import ResearchListResponse, ResearchResponse
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
    slug: str, service: ResearchService = Depends(get_research_service)
) -> SuccessResponse[ResearchResponse]:
    item = await service.get_by_slug(slug)
    return success(ResearchResponse.model_validate(item))
