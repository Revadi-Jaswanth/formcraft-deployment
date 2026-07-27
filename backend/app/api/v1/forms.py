"""
Forms router — admin CRUD, publish, archive, duplicate, versioning.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_form_service, get_current_user, get_submission_repo
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
from app.schemas.submission import SubmissionResponse
from app.repositories.submission_repository import SubmissionRepository
from app.services.form_service import FormService
from app.models.user import User
import csv
import io
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/forms", tags=["Forms"])


@router.post(
    "",
    response_model=FormDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new form",
)
def create_form(
    body: FormCreate,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.create_form(body, user_id=current_user.id)
    return FormDetailResponse.model_validate(form)


@router.get(
    "",
    response_model=PaginatedResponse[FormListItem],
    summary="List all forms",
)
def list_forms(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    form_status: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> PaginatedResponse[FormListItem]:
    skip = (page - 1) * limit
    forms, total = svc.list_forms(skip=skip, limit=limit, form_status=form_status, search=search, user_id=current_user.id)
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = [FormListItem.model_validate(svc.enrich_list_item(f)) for f in forms]
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get(
    "/{form_id}",
    response_model=FormDetailResponse,
    summary="Get form details with fields, conditions, and versions",
)
def get_form(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.get_form_detail(form_id, user_id=current_user.id)
    return FormDetailResponse.model_validate(form)


@router.put(
    "/{form_id}",
    response_model=FormDetailResponse,
    summary="Update form metadata / settings",
)
def update_form(
    form_id: UUID,
    body: FormUpdate,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    svc.update_form(form_id, body, user_id=current_user.id)
    return FormDetailResponse.model_validate(svc.get_form_detail(form_id, user_id=current_user.id))


@router.delete(
    "/{form_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a form",
)
def delete_form(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> None:
    svc.delete_form(form_id, user_id=current_user.id)


@router.post(
    "/{form_id}/publish",
    response_model=FormDetailResponse,
    summary="Publish form (or re-publish to create a new version)",
)
def publish_form(
    form_id: UUID,
    body: PublishFormRequest = PublishFormRequest(),
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.publish_form(form_id, body, user_id=current_user.id)
    return FormDetailResponse.model_validate(form)


@router.post(
    "/{form_id}/archive",
    response_model=FormDetailResponse,
    summary="Archive a published form (stops accepting responses)",
)
def archive_form(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.archive_form(form_id, user_id=current_user.id)
    return FormDetailResponse.model_validate(svc.get_form_detail(form.id, user_id=current_user.id))


@router.post(
    "/{form_id}/restore",
    response_model=FormDetailResponse,
    summary="Restore an archived form to draft status",
)
def restore_form(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.restore_to_draft(form_id, user_id=current_user.id)
    return FormDetailResponse.model_validate(svc.get_form_detail(form.id, user_id=current_user.id))


@router.post(
    "/{form_id}/duplicate",
    response_model=FormDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a form (copies fields, options, and conditions)",
)
def duplicate_form(
    form_id: UUID,
    body: DuplicateFormRequest = DuplicateFormRequest(),
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> FormDetailResponse:
    form = svc.duplicate_form(form_id, body, user_id=current_user.id)
    return FormDetailResponse.model_validate(form)


@router.get(
    "/{form_id}/versions",
    response_model=List[FormVersionResponse],
    summary="List all published versions of a form",
)
def list_versions(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> List[FormVersionResponse]:
    form = svc.get_form_detail(form_id, user_id=current_user.id)
    return [FormVersionResponse.model_validate(v) for v in form.versions]


@router.get(
    "/{form_id}/share-link",
    summary="Get the public shareable link for a published form",
)
def get_share_link(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: FormService = Depends(get_form_service),
) -> dict:
    form = svc.get_form_detail(form_id, user_id=current_user.id)
    if not form.share_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Form has not been published yet.")
    return {
        "share_token": form.share_token,
        "share_url": f"/public/forms/{form.share_token}",
    }


@router.get(
    "/{form_id}/submissions",
    response_model=PaginatedResponse[SubmissionResponse],
    summary="List all submissions for a form",
)
def list_submissions(
    form_id: UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
) -> PaginatedResponse[SubmissionResponse]:
    # Ensure form exists and belongs to current user
    form_svc.get_form_detail(form_id, user_id=current_user.id)

    skip = (page - 1) * limit
    subs, total = sub_repo.list_for_form(form_id, skip=skip, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = [SubmissionResponse.model_validate(s) for s in subs]
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get(
    "/{form_id}/export/csv",
    summary="Export submissions as CSV",
)
def export_csv(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    form = form_svc.get_form_detail(form_id, user_id=current_user.id)
    subs, _ = sub_repo.list_for_form(form_id, limit=1000)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header: Submission ID, Time, and each field label
    fields = sorted(form.fields, key=lambda f: f.order_index)
    header = ["Submission ID", "Submitted At", "IP Address"] + [f.label for f in fields]
    writer.writerow(header)

    for sub in subs:
        row = [str(sub.id), sub.submitted_at.isoformat(), sub.ip_address or ""]
        # Match responses by field ID
        val_map = {r.field_id: r.value for r in sub.response_values}
        for f in fields:
            row.append(val_map.get(f.id, ""))
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=submissions_{form_id}.csv"},
    )


@router.delete(
    "/{form_id}/submissions/{submission_id}",
    summary="Delete a specific form submission",
)
def delete_submission(
    form_id: UUID,
    submission_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    # Verify ownership of form
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    
    # Check if submission belongs to form
    sub = sub_repo.get_with_responses(submission_id)
    if not sub or sub.form_id != form_id:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    sub_repo.db.delete(sub)
    sub_repo.db.commit()
    return {"message": "Response submission deleted."}


@router.get(
    "/{form_id}/submissions",
    response_model=PaginatedResponse[SubmissionResponse],
    summary="List all submissions for a form",
)
def list_submissions(
    form_id: UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
) -> PaginatedResponse[SubmissionResponse]:
    # Ensure form exists and belongs to current user
    form_svc.get_form_detail(form_id, user_id=current_user.id)

    skip = (page - 1) * limit
    subs, total = sub_repo.list_for_form(form_id, skip=skip, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = [SubmissionResponse.model_validate(s) for s in subs]
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get(
    "/{form_id}/export/csv",
    summary="Export submissions as CSV",
)
def export_csv(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    form = form_svc.get_form_detail(form_id, user_id=current_user.id)
    subs, _ = sub_repo.list_for_form(form_id, limit=1000)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header: Submission ID, Time, and each field label
    fields = sorted(form.fields, key=lambda f: f.order_index)
    header = ["Submission ID", "Submitted At", "IP Address"] + [f.label for f in fields]
    writer.writerow(header)

    for sub in subs:
        row = [str(sub.id), sub.submitted_at.isoformat(), sub.ip_address or ""]
        # Match responses by field ID
        val_map = {r.field_id: r.value for r in sub.response_values}
        for f in fields:
            row.append(val_map.get(f.id, ""))
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=submissions_{form_id}.csv"},
    )


@router.delete(
    "/{form_id}/submissions/{submission_id}",
    summary="Delete a specific form submission",
)
def delete_submission(
    form_id: UUID,
    submission_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    # Verify ownership of form
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    
    # Check if submission belongs to form
    sub = sub_repo.get_with_responses(submission_id)
    if not sub or sub.form_id != form_id:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    sub_repo.db.delete(sub)
    sub_repo.db.commit()
    return {"message": "Response submission deleted."}


@router.delete(
    "/{form_id}/submissions/{submission_id}",
    summary="Delete a specific form submission",
)
def delete_submission(
    form_id: UUID,
    submission_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    # Verify ownership of form
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    
    # Check if submission belongs to form
    sub = sub_repo.get_with_responses(submission_id)
    if not sub or sub.form_id != form_id:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    sub_repo.db.delete(sub)
    sub_repo.db.commit()
    return {"message": "Response submission deleted."}
