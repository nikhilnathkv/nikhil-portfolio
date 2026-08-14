"""Admin resume management (single active resume)."""

import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.deps import get_resume_service
from app.schemas.common import SuccessResponse, success
from app.schemas.resume import ResumeCreate, ResumeResponse
from app.services.resume import ResumeService

router = APIRouter(prefix="/resumes", tags=["Admin: Resume"])


@router.get("", response_model=SuccessResponse[list[ResumeResponse]], summary="List resumes")
async def list_resumes(
    service: ResumeService = Depends(get_resume_service),
) -> SuccessResponse[list[ResumeResponse]]:
    resumes = await service.list_resumes()
    return success([ResumeResponse.model_validate(r) for r in resumes])


@router.post(
    "",
    response_model=SuccessResponse[ResumeResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload resume metadata",
)
async def upload_resume(
    payload: ResumeCreate, service: ResumeService = Depends(get_resume_service)
) -> SuccessResponse[ResumeResponse]:
    return success(ResumeResponse.model_validate(await service.upload_resume(payload)))


@router.post(
    "/upload",
    response_model=SuccessResponse[ResumeResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a resume PDF",
)
async def upload_resume_file(
    file: UploadFile = File(...),
    name: str = Form(...),
    version: str = Form(...),
    is_active: bool = Form(default=False),
    service: ResumeService = Depends(get_resume_service),
) -> SuccessResponse[ResumeResponse]:
    data = await file.read()
    resume = await service.upload_resume_file(
        data=data,
        original_filename=file.filename or "resume.pdf",
        content_type=file.content_type or "application/octet-stream",
        name=name,
        version=version,
        is_active=is_active,
    )
    return success(ResumeResponse.model_validate(resume))


@router.post(
    "/{resume_id}/activate", response_model=SuccessResponse[ResumeResponse], summary="Activate"
)
async def activate_resume(
    resume_id: uuid.UUID, service: ResumeService = Depends(get_resume_service)
) -> SuccessResponse[ResumeResponse]:
    return success(ResumeResponse.model_validate(await service.activate_resume(resume_id)))


@router.post(
    "/{resume_id}/archive", response_model=SuccessResponse[ResumeResponse], summary="Archive"
)
async def archive_resume(
    resume_id: uuid.UUID, service: ResumeService = Depends(get_resume_service)
) -> SuccessResponse[ResumeResponse]:
    return success(ResumeResponse.model_validate(await service.archive_resume(resume_id)))
