"""Skills endpoint — categories with their skills nested."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_skill_service
from app.schemas.common import SuccessResponse, success
from app.schemas.skill import SkillCategoryResponse
from app.services.skill import SkillService

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get(
    "",
    response_model=SuccessResponse[list[SkillCategoryResponse]],
    summary="List skill categories with their skills",
)
async def list_skills(
    category: str | None = Query(default=None, description="Filter to a single category name"),
    service: SkillService = Depends(get_skill_service),
) -> SuccessResponse[list[SkillCategoryResponse]]:
    categories = await service.list_categories(category_name=category)
    return success([SkillCategoryResponse.model_validate(c) for c in categories])
