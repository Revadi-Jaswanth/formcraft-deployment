"""
Forms router — admin CRUD, publish, archive, duplicate, versioning.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_form_service, verify_api_key
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.form import (
    FormCreate,
    FormDetailResponse,
    FormListItem,
    FormUpdate,
    FormVersionResponse,
    PublishFormRequest,
    DuplicateFormRequest,
)
from app.services.form_service import FormService

router = APIRouter(prefix="/forms", tags=["Forms"])


@router.post(
    "",
    response_model=FormDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new form",
    dependencies=[Depends(verify_api_key)],
)
def create_form(
    body: FormCreate,
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.create_form(body)
    return FormDetailResponse.model_validate(form)


@router.get(
    "",
    response_model=PaginatedResponse[FormListItem],
    summary="List all forms",
    dependencies=[Depends(verify_api_key)],
)
def list_forms(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    form_status: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    svc: FormService = Depends(get_form_service),
) -> PaginatedResponse[FormListItem]:
    skip = (page - 1) * limit
    forms, total = svc.list_forms(skip=skip, limit=limit, form_status=form_status, search=search)
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = [FormListItem.model_validate(svc.enrich_list_item(f)) for f in forms]
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get(
    "/{form_id}",
    response_model=FormDetailResponse,
    summary="Get form details with fields, conditions, and versions",
    dependencies=[Depends(verify_api_key)],
)
def get_form(
    form_id: UUID,
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.get_form_detail(form_id)
    return FormDetailResponse.model_validate(form)


@router.put(
    "/{form_id}",
    response_model=FormDetailResponse,
    summary="Update form metadata / settings",
    dependencies=[Depends(verify_api_key)],
)
def update_form(
    form_id: UUID,
    body: FormUpdate,
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    svc.update_form(form_id, body)
    return FormDetailResponse.model_validate(svc.get_form_detail(form_id))


@router.delete(
    "/{form_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a form",
    dependencies=[Depends(verify_api_key)],
)
def delete_form(
    form_id: UUID,
    svc: FormService = Depends(get_form_service),
) -> None:
    svc.delete_form(form_id)


@router.post(
    "/{form_id}/publish",
    response_model=FormDetailResponse,
    summary="Publish form (or re-publish to create a new version)",
    dependencies=[Depends(verify_api_key)],
)
def publish_form(
    form_id: UUID,
    body: PublishFormRequest = PublishFormRequest(),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.publish_form(form_id, body)
    return FormDetailResponse.model_validate(form)


@router.post(
    "/{form_id}/archive",
    response_model=FormDetailResponse,
    summary="Archive a published form (stops accepting responses)",
    dependencies=[Depends(verify_api_key)],
)
def archive_form(
    form_id: UUID,
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.archive_form(form_id)
    return FormDetailResponse.model_validate(svc.get_form_detail(form.id))


@router.post(
    "/{form_id}/restore",
    response_model=FormDetailResponse,
    summary="Restore an archived form to draft status",
    dependencies=[Depends(verify_api_key)],
)
def restore_form(
    form_id: UUID,
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.restore_to_draft(form_id)
    return FormDetailResponse.model_validate(svc.get_form_detail(form.id))


@router.post(
    "/{form_id}/duplicate",
    response_model=FormDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a form (copies fields, options, and conditions)",
    dependencies=[Depends(verify_api_key)],
)
def duplicate_form(
    form_id: UUID,
    body: DuplicateFormRequest = DuplicateFormRequest(),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.duplicate_form(form_id, body)
    return FormDetailResponse.model_validate(form)


@router.get(
    "/{form_id}/versions",
    response_model=List[FormVersionResponse],
    summary="List all published versions of a form",
    dependencies=[Depends(verify_api_key)],
)
def list_versions(
    form_id: UUID,
    svc: FormService = Depends(get_form_service),
) -> List[FormVersionResponse]:
    form = svc.get_form_detail(form_id)
    return [FormVersionResponse.model_validate(v) for v in form.versions]


@router.get(
    "/{form_id}/share-link",
    summary="Get the public shareable link for a published form",
    dependencies=[Depends(verify_api_key)],
)
def get_share_link(
    form_id: UUID,
    svc: FormService = Depends(get_form_service),
) -> dict:
    form = svc.get_form_detail(form_id)
    if not form.share_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Form has not been published yet.")
    return {
        "share_token": form.share_token,
        "share_url": f"/public/forms/{form.share_token}",
    }
