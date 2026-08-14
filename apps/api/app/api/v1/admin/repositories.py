"""Admin GitHub-repository metadata management."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_repository_service
from app.schemas.common import SuccessResponse, success
from app.schemas.repository import RepositoryCreate, RepositoryResponse, RepositoryUpdate
from app.services.github_repository import GitHubRepositoryService

router = APIRouter(prefix="/repositories", tags=["Admin: Repositories"])


@router.get(
    "", response_model=SuccessResponse[list[RepositoryResponse]], summary="List repositories"
)
async def list_repositories(
    service: GitHubRepositoryService = Depends(get_repository_service),
) -> SuccessResponse[list[RepositoryResponse]]:
    repos = await service.list_repositories()
    return success([RepositoryResponse.model_validate(r) for r in repos])


@router.post(
    "",
    response_model=SuccessResponse[RepositoryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a repository",
)
async def create_repository(
    payload: RepositoryCreate, service: GitHubRepositoryService = Depends(get_repository_service)
) -> SuccessResponse[RepositoryResponse]:
    return success(RepositoryResponse.model_validate(await service.create_repository(payload)))


@router.put(
    "/{repository_id}", response_model=SuccessResponse[RepositoryResponse], summary="Update"
)
async def update_repository(
    repository_id: uuid.UUID,
    payload: RepositoryUpdate,
    service: GitHubRepositoryService = Depends(get_repository_service),
) -> SuccessResponse[RepositoryResponse]:
    updated = await service.update_repository(repository_id, payload)
    return success(RepositoryResponse.model_validate(updated))


@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete")
async def delete_repository(
    repository_id: uuid.UUID, service: GitHubRepositoryService = Depends(get_repository_service)
) -> None:
    await service.delete_repository(repository_id)
