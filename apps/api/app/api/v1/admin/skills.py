"""Admin skill & skill-category management."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel

from app.api.deps import get_project_service, get_skill_service
from app.schemas.common import SuccessResponse, success
from app.schemas.project import ProjectRef
from app.schemas.skill import (
    SkillCategoryCreate,
    SkillCategoryResponse,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
)
from app.services.project import ProjectService
from app.services.skill import SkillService

router = APIRouter(tags=["Admin: Skills"])


class SkillCategoryUpdate(BaseModel):
    name: str | None = None
    display_order: int | None = None


# --- categories ------------------------------------------------------------
@router.get(
    "/skill-categories",
    response_model=SuccessResponse[list[SkillCategoryResponse]],
    summary="List categories",
)
async def list_categories(
    service: SkillService = Depends(get_skill_service),
) -> SuccessResponse[list[SkillCategoryResponse]]:
    cats = await service.list_categories()
    return success([SkillCategoryResponse.model_validate(c) for c in cats])


@router.post(
    "/skill-categories",
    response_model=SuccessResponse[SkillCategoryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a category",
)
async def create_category(
    payload: SkillCategoryCreate, service: SkillService = Depends(get_skill_service)
) -> SuccessResponse[SkillCategoryResponse]:
    return success(SkillCategoryResponse.model_validate(await service.create_category(payload)))


@router.put(
    "/skill-categories/{category_id}",
    response_model=SuccessResponse[SkillCategoryResponse],
    summary="Update a category",
)
async def update_category(
    category_id: uuid.UUID,
    payload: SkillCategoryUpdate,
    service: SkillService = Depends(get_skill_service),
) -> SuccessResponse[SkillCategoryResponse]:
    updated = await service.update_category(
        category_id, name=payload.name, display_order=payload.display_order
    )
    return success(SkillCategoryResponse.model_validate(updated))


@router.delete(
    "/skill-categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category",
)
async def delete_category(
    category_id: uuid.UUID, service: SkillService = Depends(get_skill_service)
) -> None:
    await service.delete_category(category_id)


# --- skills ----------------------------------------------------------------
@router.get(
    "/skills",
    response_model=SuccessResponse[list[SkillResponse]],
    summary="List all skills (flat) — used by the project technology selector",
)
async def list_skills(
    service: SkillService = Depends(get_skill_service),
) -> SuccessResponse[list[SkillResponse]]:
    skills = await service.list_skills()
    return success([SkillResponse.model_validate(s) for s in skills])


@router.get(
    "/skills/{skill_id}/projects",
    response_model=SuccessResponse[list[ProjectRef]],
    summary="Projects using a skill (usage indicator)",
)
async def skill_usage(
    skill_id: uuid.UUID, service: ProjectService = Depends(get_project_service)
) -> SuccessResponse[list[ProjectRef]]:
    projects = await service.projects_using_skill(skill_id)
    return success([ProjectRef.model_validate(p) for p in projects])


@router.post(
    "/skills",
    response_model=SuccessResponse[SkillResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a skill",
)
async def create_skill(
    payload: SkillCreate, service: SkillService = Depends(get_skill_service)
) -> SuccessResponse[SkillResponse]:
    return success(SkillResponse.model_validate(await service.create_skill(payload)))


@router.put(
    "/skills/{skill_id}", response_model=SuccessResponse[SkillResponse], summary="Update a skill"
)
async def update_skill(
    skill_id: uuid.UUID, payload: SkillUpdate, service: SkillService = Depends(get_skill_service)
) -> SuccessResponse[SkillResponse]:
    return success(SkillResponse.model_validate(await service.update_skill(skill_id, payload)))


@router.delete(
    "/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a skill"
)
async def delete_skill(
    skill_id: uuid.UUID,
    force: bool = Query(default=False, description="Delete even if referenced by projects"),
    service: SkillService = Depends(get_skill_service),
) -> None:
    await service.delete_skill(skill_id, force=force)
