"""Skills endpoint — returns categories with their skills nested."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.skill import SkillCategoryResponse
from app.services.skill import SkillService

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=SuccessResponse[list[SkillCategoryResponse]])
async def list_skills(
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[SkillCategoryResponse]]:
    categories = await SkillService(db).list_categories()
    return success([SkillCategoryResponse.model_validate(c) for c in categories])
