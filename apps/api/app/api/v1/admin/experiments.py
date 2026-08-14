"""Admin experiment management."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_experiment_service
from app.schemas.common import SuccessResponse, success
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentUpdate,
)
from app.services.experiment import ExperimentService

router = APIRouter(prefix="/experiments", tags=["Admin: Experiments"])


@router.get(
    "", response_model=SuccessResponse[list[ExperimentListResponse]], summary="List all experiments"
)
async def list_experiments(
    service: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[list[ExperimentListResponse]]:
    items = await service.list_experiments()
    return success([ExperimentListResponse.model_validate(i) for i in items])


@router.post(
    "",
    response_model=SuccessResponse[ExperimentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create an experiment",
)
async def create_experiment(
    payload: ExperimentCreate, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(ExperimentResponse.model_validate(await service.create_experiment(payload)))


@router.get(
    "/{experiment_id}", response_model=SuccessResponse[ExperimentResponse], summary="Get experiment"
)
async def get_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> SuccessResponse[ExperimentResponse]:
    return success(ExperimentResponse.model_validate(await service.get_experiment(experiment_id)))


@router.put(
    "/{experiment_id}",
    response_model=SuccessResponse[ExperimentResponse],
    summary="Update experiment",
)
async def update_experiment(
    experiment_id: uuid.UUID,
    payload: ExperimentUpdate,
    service: ExperimentService = Depends(get_experiment_service),
) -> SuccessResponse[ExperimentResponse]:
    updated = await service.update_experiment(experiment_id, payload)
    return success(ExperimentResponse.model_validate(updated))


@router.delete(
    "/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete experiment"
)
async def delete_experiment(
    experiment_id: uuid.UUID, service: ExperimentService = Depends(get_experiment_service)
) -> None:
    await service.delete_experiment(experiment_id)
