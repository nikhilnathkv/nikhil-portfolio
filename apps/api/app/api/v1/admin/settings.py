"""Admin site-settings management (key/value)."""

from fastapi import APIRouter, Depends

from app.api.deps import get_settings_service
from app.schemas.common import SuccessResponse, success
from app.schemas.settings import SiteSettingResponse, SiteSettingUpdate
from app.services.settings import SettingsService

router = APIRouter(prefix="/settings", tags=["Admin: Settings"])


@router.get("", response_model=SuccessResponse[list[SiteSettingResponse]], summary="List settings")
async def list_settings(
    service: SettingsService = Depends(get_settings_service),
) -> SuccessResponse[list[SiteSettingResponse]]:
    items = await service.list_settings()
    return success([SiteSettingResponse.model_validate(s) for s in items])


@router.get("/{key}", response_model=SuccessResponse[SiteSettingResponse], summary="Get a setting")
async def get_setting(
    key: str, service: SettingsService = Depends(get_settings_service)
) -> SuccessResponse[SiteSettingResponse]:
    return success(SiteSettingResponse.model_validate(await service.get_setting(key)))


@router.put(
    "/{key}", response_model=SuccessResponse[SiteSettingResponse], summary="Upsert a setting"
)
async def upsert_setting(
    key: str, payload: SiteSettingUpdate, service: SettingsService = Depends(get_settings_service)
) -> SuccessResponse[SiteSettingResponse]:
    setting = await service.upsert_setting(key, payload.value)
    return success(SiteSettingResponse.model_validate(setting))
