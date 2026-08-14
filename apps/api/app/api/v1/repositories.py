"""GitHub-repository metadata endpoints."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_repository_service
from app.schemas.common import SuccessResponse, success
from app.schemas.repository import RepositoryResponse
from app.services.github_repository import GitHubRepositoryService

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get(
    "",
    response_model=SuccessResponse[list[RepositoryResponse]],
    summary="List repositories",
)
async def list_repositories(
    featured: bool | None = Query(default=None),
    service: GitHubRepositoryService = Depends(get_repository_service),
) -> SuccessResponse[list[RepositoryResponse]]:
    repos = await service.list_repositories(featured=featured)
    return success([RepositoryResponse.model_validate(r) for r in repos])
