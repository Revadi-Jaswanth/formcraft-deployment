"""
Forms router — admin CRUD, publish, archive, duplicate, versioning.
"""
from typing import List, Optional
from uuid import UUID
import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

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

router = APIRouter(prefix="/forms", tags=["Forms"])


# ── Form CRUD ─────────────────────────────────────────────────────────────────

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
    forms, total = svc.list_forms(
        skip=skip, limit=limit, form_status=form_status, search=search, user_id=current_user.id
    )
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


# ── Lifecycle actions ─────────────────────────────────────────────────────────

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


# ── Versions & sharing ────────────────────────────────────────────────────────

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
        raise HTTPException(status_code=404, detail="Form has not been published yet.")
    return {
        "share_token": form.share_token,
        "share_url": f"/public/forms/{form.share_token}",
    }


# ── Submissions list ──────────────────────────────────────────────────────────

@router.get(
    "/{form_id}/submissions",
    response_model=PaginatedResponse[SubmissionResponse],
    summary="List all submissions for a form",
    description=(
        "Returns a paginated list of submissions. "
        "Supports rich server-side filtering via query parameters:\n\n"
        "- **date_from / date_to** — ISO 8601 datetime range on `submitted_at`\n"
        "- **field_id + field_value** — filter by a specific field's response (case-insensitive substring)\n"
        "- **field_id** alone — filter to submissions that answered a particular field\n"
        "- **ip_address** — exact match on respondent IP\n"
        "- **search** — substring match across all response values\n"
        "- **order_by** — column to sort by (`submitted_at` | `ip_address` | `completion_time_seconds`)\n"
        "- **order_dir** — `asc` or `desc` (default: `desc`)\n"
    ),
)
def list_submissions(
    form_id: UUID,
    # ── Pagination ────────────────────────────────────────────────────────────
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    # ── Date range filters ────────────────────────────────────────────────────
    date_from: Optional[datetime] = Query(
        default=None,
        description="Include submissions submitted at or after this ISO 8601 datetime",
    ),
    date_to: Optional[datetime] = Query(
        default=None,
        description="Include submissions submitted at or before this ISO 8601 datetime",
    ),
    # ── Field-value filter ────────────────────────────────────────────────────
    field_id: Optional[UUID] = Query(
        default=None,
        description="Filter to submissions that have a response for this field UUID",
    ),
    field_value: Optional[str] = Query(
        default=None,
        description="Case-insensitive substring to match inside the field's response value (requires field_id)",
    ),
    # ── Other filters ─────────────────────────────────────────────────────────
    ip_address: Optional[str] = Query(
        default=None,
        description="Exact IP address to filter by",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Substring search across all response values in the submission",
    ),
    # ── Sorting ───────────────────────────────────────────────────────────────
    order_by: str = Query(
        default="submitted_at",
        pattern="^(submitted_at|ip_address|completion_time_seconds)$",
        description="Column to sort by",
    ),
    order_dir: str = Query(
        default="desc",
        pattern="^(asc|desc)$",
        description="Sort direction",
    ),
    # ── Dependencies ─────────────────────────────────────────────────────────
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
) -> PaginatedResponse[SubmissionResponse]:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    skip = (page - 1) * limit
    subs, total = sub_repo.list_for_form(
        form_id=form_id,
        skip=skip,
        limit=limit,
        date_from=date_from,
        date_to=date_to,
        field_id=field_id,
        field_value=field_value,
        ip_address=ip_address,
        search=search,
        order_by=order_by,
        order_dir=order_dir,
    )
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = [SubmissionResponse.model_validate(s) for s in subs]
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)


# ── Export (Day 15) ───────────────────────────────────────────────────────────

def _build_csv_stream(form, subs):
    """Generator that yields CSV rows as UTF-8 bytes — enables true streaming."""
    fields = sorted(form.fields, key=lambda f: f.order_index)

    # Header row
    buf = io.StringIO()
    csv.writer(buf).writerow(
        ["submission_id", "submitted_at", "completion_time_seconds", "ip_address"]
        + [f.label for f in fields]
    )
    yield buf.getvalue().encode("utf-8")

    # Data rows — one yield per submission keeps memory flat
    for sub in subs:
        buf = io.StringIO()
        val_map = {r.field_id: r.value for r in sub.response_values}
        csv.writer(buf).writerow(
            [
                str(sub.id),
                sub.submitted_at.isoformat() if sub.submitted_at else "",
                sub.completion_time_seconds if sub.completion_time_seconds is not None else "",
                sub.ip_address or "",
            ]
            + [val_map.get(f.id, "") for f in fields]
        )
        yield buf.getvalue().encode("utf-8")


def _build_json_stream(form, subs):
    """Generator that yields a JSON array of submission objects as UTF-8 bytes."""
    fields = sorted(form.fields, key=lambda f: f.order_index)
    field_map = {f.id: f.label for f in fields}

    yield b"[\n"
    for idx, sub in enumerate(subs):
        val_map = {r.field_id: r.value for r in sub.response_values}
        record = {
            "submission_id": str(sub.id),
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "completion_time_seconds": sub.completion_time_seconds,
            "ip_address": sub.ip_address,
            # Nested object: field_label -> submitted_value
            "responses": {
                field_map[fid]: val
                for fid, val in val_map.items()
                if fid in field_map
            },
        }
        chunk = json.dumps(record, default=str, ensure_ascii=False)
        if idx < len(subs) - 1:
            chunk += ","
        yield (chunk + "\n").encode("utf-8")
    yield b"]\n"


@router.get(
    "/{form_id}/export",
    summary="Export submissions as CSV or JSON",
    description=(
        "Streams all submissions for the given form. "
        "Pass **?format=csv** (default) for a spreadsheet-ready CSV file, or "
        "**?format=json** for a structured JSON array. "
        "\n\n"
        "**CSV columns:** `submission_id`, `submitted_at`, `completion_time_seconds`, "
        "`ip_address`, then one column per field label. "
        "\n\n"
        "**JSON record shape:**\n"
        "```json\n"
        "{\n"
        '  "submission_id": "...",\n'
        '  "submitted_at": "2024-01-01T12:00:00",\n'
        '  "completion_time_seconds": 42,\n'
        '  "ip_address": "1.2.3.4",\n'
        '  "responses": { "<field label>": "<submitted value>", ... }\n'
        "}\n"
        "```\n"
        "\n"
        "File-upload fields are included as their stored URL string. "
        "The response header `X-Total-Submissions` reports the total row count."
    ),
)
def export_submissions(
    form_id: UUID,
    format: str = Query(
        default="csv",
        pattern="^(csv|json)$",
        description="Output format: 'csv' (default) or 'json'",
    ),
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    form = form_svc.get_form_detail(form_id, user_id=current_user.id)
    # Cap at 10 000 rows to keep memory bounded; use pagination for larger sets
    subs, total = sub_repo.list_for_form(form_id, limit=10_000)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    base_name = f"submissions_{form_id}_{ts}"
    common_headers = {"X-Total-Submissions": str(total)}

    if format == "json":
        return StreamingResponse(
            _build_json_stream(form, subs),
            media_type="application/json",
            headers={
                **common_headers,
                "Content-Disposition": f'attachment; filename="{base_name}.json"',
            },
        )

    # Default: CSV
    return StreamingResponse(
        _build_csv_stream(form, subs),
        media_type="text/csv; charset=utf-8",
        headers={
            **common_headers,
            "Content-Disposition": f'attachment; filename="{base_name}.csv"',
        },
    )


@router.get(
    "/{form_id}/export/csv",
    summary="Export submissions as CSV (legacy — prefer /export?format=csv)",
    include_in_schema=False,  # hidden from Swagger; kept for backward compat
)
def export_csv_alias(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    return export_submissions(
        form_id=form_id,
        format="csv",
        current_user=current_user,
        form_svc=form_svc,
        sub_repo=sub_repo,
    )


# ── Bulk Delete Submissions (Day 19) ──────────────────────────────────────────

from pydantic import BaseModel

class BulkDeleteSubmissionsRequest(BaseModel):
    submission_ids: Optional[List[UUID]] = None
    delete_all: bool = False


@router.post(
    "/{form_id}/submissions/bulk-delete",
    summary="Bulk delete form submissions",
    description="Deletes selected or all submissions for a form and records an audit log.",
)
def bulk_delete_submissions(
    form_id: UUID,
    body: BulkDeleteSubmissionsRequest,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
):
    from app.models.submission import Submission
    from app.models.audit_log import AuditLog

    form = form_svc.get_form_detail(form_id, user_id=current_user.id)

    query = sub_repo.db.query(Submission).filter(Submission.form_id == form_id)

    if not body.delete_all:
        if not body.submission_ids:
            raise HTTPException(status_code=400, detail="No submission IDs or delete_all flag provided.")
        query = query.filter(Submission.id.in_(body.submission_ids))

    subs_to_delete = query.all()
    deleted_count = len(subs_to_delete)

    for sub in subs_to_delete:
        sub_repo.db.delete(sub)

    # Record Audit Log entry
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="BULK_DELETE_SUBMISSIONS",
        target_type="submission",
        target_id=str(form_id),
        actor_email=current_user.email,
        details={
            "deleted_count": deleted_count,
            "form_title": form.title,
            "delete_all": body.delete_all,
            "submission_ids": [str(sid) for sid in (body.submission_ids or [])][:10],
        },
    )
    sub_repo.db.add(audit_entry)
    sub_repo.db.commit()

    return {
        "deleted_count": deleted_count,
        "message": f"Successfully deleted {deleted_count} submission(s).",
    }


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
    form_svc.get_form_detail(form_id, user_id=current_user.id)

    sub = sub_repo.get_with_responses(submission_id)
    if not sub or sub.form_id != form_id:
        raise HTTPException(status_code=404, detail="Submission not found.")

    sub_repo.db.delete(sub)
    sub_repo.db.commit()
    return {"message": "Response submission deleted."}

