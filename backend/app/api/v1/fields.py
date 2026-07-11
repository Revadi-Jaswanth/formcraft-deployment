"""
Fields router — add, update, delete, reorder fields within a form.

IMPORTANT: /reorder is declared BEFORE /{field_id} to avoid FastAPI path conflicts.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import get_field_service, verify_api_key
from app.schemas.field import FieldCreate, FieldResponse, FieldUpdate, FieldReorderRequest
from app.services.field_service import FieldService

router = APIRouter(prefix="/forms/{form_id}/fields", tags=["Fields"])


@router.get(
    "",
    response_model=List[FieldResponse],
    summary="List all fields for a form",
    dependencies=[Depends(verify_api_key)],
)
def list_fields(
    form_id: UUID,
    svc: FieldService = Depends(get_field_service),
) -> List[FieldResponse]:
    return [FieldResponse.model_validate(f) for f in svc.get_fields(form_id)]


@router.post(
    "",
    response_model=FieldResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a field to a form",
    dependencies=[Depends(verify_api_key)],
)
def add_field(
    form_id: UUID,
    body: FieldCreate,
    svc: FieldService = Depends(get_field_service),
) -> FieldResponse:
    field = svc.add_field(form_id, body)
    return FieldResponse.model_validate(field)


# ── Static paths MUST be declared before parameterised paths ──────────────────
@router.put(
    "/reorder",
    response_model=List[FieldResponse],
    summary="Reorder all fields — pass complete ordered list of field IDs",
    dependencies=[Depends(verify_api_key)],
)
def reorder_fields(
    form_id: UUID,
    body: FieldReorderRequest,
    svc: FieldService = Depends(get_field_service),
) -> List[FieldResponse]:
    fields = svc.reorder_fields(form_id, body)
    return [FieldResponse.model_validate(f) for f in fields]


@router.get(
    "/{field_id}",
    response_model=FieldResponse,
    summary="Get a single field",
    dependencies=[Depends(verify_api_key)],
)
def get_field(
    form_id: UUID,
    field_id: UUID,
    svc: FieldService = Depends(get_field_service),
) -> FieldResponse:
    return FieldResponse.model_validate(svc.get_field(form_id, field_id))


@router.put(
    "/{field_id}",
    response_model=FieldResponse,
    summary="Update a field (config, label, options, etc.)",
    dependencies=[Depends(verify_api_key)],
)
def update_field(
    form_id: UUID,
    field_id: UUID,
    body: FieldUpdate,
    svc: FieldService = Depends(get_field_service),
) -> FieldResponse:
    field = svc.update_field(form_id, field_id, body)
    return FieldResponse.model_validate(field)


@router.delete(
    "/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a field (and its options/conditions)",
    dependencies=[Depends(verify_api_key)],
)
def delete_field(
    form_id: UUID,
    field_id: UUID,
    svc: FieldService = Depends(get_field_service),
) -> None:
    svc.delete_field(form_id, field_id)
