"""Profile endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.profile import ProfileResponse
from app.services.misc import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=SuccessResponse[ProfileResponse])
async def get_profile(db: AsyncSession = Depends(get_db)) -> SuccessResponse[ProfileResponse]:
    profile = await ProfileService(db).get()
    return success(ProfileResponse.model_validate(profile))
