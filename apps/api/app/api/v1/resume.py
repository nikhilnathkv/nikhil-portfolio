"""Resume endpoint — returns the currently active resume."""

from fastapi import APIRouter, Depends

from app.api.deps import get_resume_service
from app.schemas.common import SuccessResponse, success
from app.schemas.resume import ResumeResponse
from app.services.resume import ResumeService

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.get("", response_model=SuccessResponse[ResumeResponse], summary="Get the active resume")
async def get_resume(
    service: ResumeService = Depends(get_resume_service),
) -> SuccessResponse[ResumeResponse]:
    resume = await service.get_active_resume()
    return success(ResumeResponse.model_validate(resume))
