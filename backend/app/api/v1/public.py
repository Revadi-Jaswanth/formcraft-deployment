"""
Public router — unauthenticated endpoints for respondents.

GET  /public/forms/{share_token}          — Retrieve form schema
POST /public/forms/{share_token}/submit   — Submit a response
GET  /public/forms/{share_token}/status   — Check if form is still open
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import get_form_service, get_submission_repo
from app.repositories.submission_repository import SubmissionRepository
from app.schemas.form import PublicFormResponse
from app.schemas.field import FieldResponse
from app.schemas.condition import ConditionalRuleResponse
from app.schemas.submission import SubmissionCreate, SubmissionCreateResponse
from app.services.form_service import FormService

router = APIRouter(prefix="/public/forms", tags=["Public (Respondent)"])


@router.get(
    "/{share_token}",
    response_model=PublicFormResponse,
    summary="Retrieve the public form schema for a respondent",
)
def get_public_form(
    share_token: str,
    svc: FormService = Depends(get_form_service),
) -> PublicFormResponse:
    form = svc.get_form_by_share_token(share_token)
    active_version = next((v for v in form.versions if v.is_active), None)

    return PublicFormResponse(
        id=form.id,
        title=form.title,
        description=form.description,
        settings=form.settings,
        version_number=form.current_version_number,
        share_token=form.share_token,
        fields=[FieldResponse.model_validate(f) for f in form.fields],
        conditions=[ConditionalRuleResponse.model_validate(c) for c in form.conditions],
    )


@router.get(
    "/{share_token}/status",
    summary="Check form availability before rendering",
)
def get_form_status(
    share_token: str,
    svc: FormService = Depends(get_form_service),
) -> dict:
    form = svc.get_form_by_share_token(share_token)
    settings_dict = dict(form.settings)
    return {
        "status": "open",
        "title": form.title,
        "allow_multiple_submissions": settings_dict.get("allow_multiple_submissions", True),
        "max_submissions": settings_dict.get("max_submissions"),
        "close_on_date": settings_dict.get("close_on_date"),
    }


@router.post(
    "/{share_token}/submit",
    response_model=SubmissionCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a response to a published form",
)
def submit_form(
    share_token: str,
    body: SubmissionCreate,
    request: Request,
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
) -> SubmissionCreateResponse:
    form = form_svc.get_form_by_share_token(share_token)

    # Find the currently active version
    active_version = next((v for v in form.versions if v.is_active), None)

    sub_data = {
        "form_id": form.id,
        "form_version_id": active_version.id if active_version else None,
        "session_id": body.session_id,
        "ip_address": request.client.host if request.client else None,
        "started_at": body.started_at,
        "completion_time_seconds": body.completion_time_seconds,
        "metadata_": {},
    }

    responses_data = [
        {"field_id": r.field_id, "value": r.value}
        for r in body.responses
    ]

    submission = sub_repo.create_submission(sub_data, responses_data)

    return SubmissionCreateResponse(submission_id=submission.id)
