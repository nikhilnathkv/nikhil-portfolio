"""Research endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.research import ResearchListResponse, ResearchResponse
from app.services.research import ResearchService

router = APIRouter(prefix="/research", tags=["research"])


@router.get("", response_model=SuccessResponse[list[ResearchListResponse]])
async def list_research(
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[ResearchListResponse]]:
    items = await ResearchService(db).list()
    return success([ResearchListResponse.model_validate(i) for i in items])


@router.get("/{slug}", response_model=SuccessResponse[ResearchResponse])
async def get_research(
    slug: str, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ResearchResponse]:
    item = await ResearchService(db).get_by_slug(slug)
    return success(ResearchResponse.model_validate(item))
