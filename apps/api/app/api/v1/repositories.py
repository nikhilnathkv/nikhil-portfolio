"""Repository (GitHub repos) endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.repository import RepositoryResponse
from app.services.misc import RepositoryService

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.get("", response_model=SuccessResponse[list[RepositoryResponse]])
async def list_repositories(
    featured: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[RepositoryResponse]]:
    repos = await RepositoryService(db).list(featured=featured)
    return success([RepositoryResponse.model_validate(r) for r in repos])
