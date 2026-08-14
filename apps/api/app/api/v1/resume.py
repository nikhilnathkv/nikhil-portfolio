"""Resume endpoint — returns the currently active resume."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.resume import ResumeResponse
from app.services.resume import ResumeService

router = APIRouter(prefix="/resume", tags=["resume"])


@router.get("", response_model=SuccessResponse[ResumeResponse])
async def get_resume(db: AsyncSession = Depends(get_db)) -> SuccessResponse[ResumeResponse]:
    resume = await ResumeService(db).get_active_resume()
    return success(ResumeResponse.model_validate(resume))
