"""
Fields router — add, update, delete, reorder fields within a form.

IMPORTANT: /reorder is declared BEFORE /{field_id} to avoid FastAPI path conflicts.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import get_field_service, get_current_user, get_form_service
from app.schemas.field import (
    FieldCreate,
    FieldResponse,
    FieldUpdate,
    FieldReorderRequest,
    FieldTypeMetadata,
    FIELD_TYPE_CATALOGUE,
)
from app.services.field_service import FieldService
from app.services.form_service import FormService
from app.models.user import User

router = APIRouter(prefix="/forms/{form_id}/fields", tags=["Fields"])

# Separate router for the /field-types meta endpoint (no form_id prefix)
meta_router = APIRouter(tags=["Field Types"])


@meta_router.get(
    "/field-types",
    response_model=List[FieldTypeMetadata],
    summary="List all supported field types with their configurable properties",
    description=(
        "Returns the complete catalogue of field types supported by the platform. "
        "Each entry includes the field type identifier, human-readable label, "
        "icon name, colour hint, whether options are supported, the default "
        "configuration values, and a schema describing every configurable property. "
        "This endpoint is used by the Form Builder UI to dynamically render the "
        "field-type palette and their configuration panels."
    ),
)
def get_field_types() -> List[FieldTypeMetadata]:
    """Return the full field-type catalogue — no authentication required."""
    return [FieldTypeMetadata(**entry) for entry in FIELD_TYPE_CATALOGUE]




@router.get(
    "",
    response_model=List[FieldResponse],
    summary="List all fields for a form",
)
def list_fields(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FieldService = Depends(get_field_service),
    form_svc: FormService = Depends(get_form_service),
) -> List[FieldResponse]:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    return [FieldResponse.model_validate(f) for f in svc.get_fields(form_id)]


@router.post(
    "",
    response_model=FieldResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a field to a form",
)
def add_field(
    form_id: UUID,
    body: FieldCreate,
    current_user: User = Depends(get_current_user),
    svc: FieldService = Depends(get_field_service),
    form_svc: FormService = Depends(get_form_service),
) -> FieldResponse:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    field = svc.add_field(form_id, body)
    return FieldResponse.model_validate(field)


# ── Static paths MUST be declared before parameterised paths ──────────────────
@router.put(
    "/reorder",
    response_model=List[FieldResponse],
    summary="Reorder all fields — pass complete ordered list of field IDs",
)
def reorder_fields(
    form_id: UUID,
    body: FieldReorderRequest,
    current_user: User = Depends(get_current_user),
    svc: FieldService = Depends(get_field_service),
    form_svc: FormService = Depends(get_form_service),
) -> List[FieldResponse]:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    fields = svc.reorder_fields(form_id, body)
    return [FieldResponse.model_validate(f) for f in fields]


@router.get(
    "/{field_id}",
    response_model=FieldResponse,
    summary="Get a single field",
)
def get_field(
    form_id: UUID,
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FieldService = Depends(get_field_service),
    form_svc: FormService = Depends(get_form_service),
) -> FieldResponse:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    return FieldResponse.model_validate(svc.get_field(form_id, field_id))


@router.put(
    "/{field_id}",
    response_model=FieldResponse,
    summary="Update a field (config, label, options, etc.)",
)
def update_field(
    form_id: UUID,
    field_id: UUID,
    body: FieldUpdate,
    current_user: User = Depends(get_current_user),
    svc: FieldService = Depends(get_field_service),
    form_svc: FormService = Depends(get_form_service),
) -> FieldResponse:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    field = svc.update_field(form_id, field_id, body)
    return FieldResponse.model_validate(field)


@router.delete(
    "/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a field (and its options/conditions)",
)
def delete_field(
    form_id: UUID,
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FieldService = Depends(get_field_service),
    form_svc: FormService = Depends(get_form_service),
) -> None:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    svc.delete_field(form_id, field_id)
