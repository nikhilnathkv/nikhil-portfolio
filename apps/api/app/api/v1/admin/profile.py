"""Admin profile management (singleton)."""

from fastapi import APIRouter, Depends

from app.api.deps import get_profile_service
from app.schemas.common import SuccessResponse, success
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.profile import ProfileService

router = APIRouter(prefix="/profile", tags=["Admin: Profile"])


@router.get("", response_model=SuccessResponse[ProfileResponse], summary="Get the profile")
async def get_profile(
    service: ProfileService = Depends(get_profile_service),
) -> SuccessResponse[ProfileResponse]:
    return success(ProfileResponse.model_validate(await service.get_profile()))


@router.put("", response_model=SuccessResponse[ProfileResponse], summary="Update the profile")
async def update_profile(
    payload: ProfileUpdate, service: ProfileService = Depends(get_profile_service)
) -> SuccessResponse[ProfileResponse]:
    return success(ProfileResponse.model_validate(await service.upsert_profile(payload)))
