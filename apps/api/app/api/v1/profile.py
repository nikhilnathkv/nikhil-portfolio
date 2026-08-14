"""Profile endpoint."""

from fastapi import APIRouter, Depends

from app.api.deps import get_profile_service
from app.schemas.common import SuccessResponse, success
from app.schemas.profile import ProfileResponse
from app.services.profile import ProfileService

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=SuccessResponse[ProfileResponse], summary="Get the public profile")
async def get_profile(
    service: ProfileService = Depends(get_profile_service),
) -> SuccessResponse[ProfileResponse]:
    return success(ProfileResponse.model_validate(await service.get_profile()))
