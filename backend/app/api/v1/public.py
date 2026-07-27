"""
Public router — unauthenticated endpoints for respondents.

GET  /public/forms/{share_token}             — Retrieve form schema
GET  /public/forms/{share_token}/status      — Check if form is still open
POST /public/forms/{share_token}/evaluate    — Evaluate conditional rules live
POST /public/forms/{share_token}/submit      — Submit validated response (with Idempotency support)
POST /public/uploads                         — Upload file
GET  /public/uploads/{file_name}             — Download file safely
"""
import os
from uuid import uuid4, UUID
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    Request,
    Header,
    UploadFile,
    File,
    HTTPException,
    status,
)
from fastapi.responses import FileResponse

from app.api.deps import (
    get_form_service,
    get_submission_service,
    get_rule_engine,
    get_validation_engine,
    get_condition_repo,
    get_field_repo,
    get_form_repo,
)
from app.repositories.condition_repository import ConditionRepository
from app.repositories.field_repository import FieldRepository
from app.repositories.form_repository import FormRepository
from app.schemas.form import PublicFormResponse
from app.schemas.field import FieldResponse
from app.schemas.condition import ConditionalRuleResponse
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionCreateResponse,
    EvaluateRulesRequest,
    EvaluateRulesResponse,
    FieldStateResponse,
    FileUploadResponse,
)
from app.services.form_service import FormService
from app.services.submission_service import SubmissionService
from app.services.rule_engine import RuleEngine, RuleDTO
from app.services.validation_engine import ValidationEngine
from app.core.config import settings

router = APIRouter(prefix="/public", tags=["Public (Respondent)"])

UPLOAD_DIR = os.path.abspath(getattr(settings, "UPLOAD_DIR", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get(
    "/forms/{share_token}",
    response_model=PublicFormResponse,
    summary="Retrieve the public form schema for a respondent",
)
def get_public_form(
    share_token: str,
    svc: FormService = Depends(get_form_service),
) -> PublicFormResponse:
    form = svc.get_form_by_share_token(share_token)

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
    "/forms/{share_token}/status",
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
    "/forms/{share_token}/evaluate",
    response_model=EvaluateRulesResponse,
    summary="Evaluate conditional rules for current field values (used for live UI updates)",
)
def evaluate_rules(
    share_token: str,
    body: EvaluateRulesRequest,
    form_svc: FormService = Depends(get_form_service),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    field_repo: FieldRepository = Depends(get_field_repo),
    condition_repo: ConditionRepository = Depends(get_condition_repo),
    form_repo: FormRepository = Depends(get_form_repo),
) -> EvaluateRulesResponse:
    form = form_svc.get_form_by_share_token(share_token)

    fields = field_repo.get_fields_for_form(form.id)
    db_rules = condition_repo.get_conditions_for_form(form.id)

    rule_dtos: List[RuleDTO] = [
        RuleDTO(
            id=r.id,
            source_field_id=r.source_field_id,
            target_field_id=r.target_field_id,
            operator=r.operator,
            value=r.value,
            action=r.action,
            logic_group=r.logic_group,
        )
        for r in db_rules
    ]

    values_map = {r.field_id: r.value for r in body.responses}
    all_field_ids = [f.id for f in fields]
    states = rule_engine.evaluate(rules=rule_dtos, field_ids=all_field_ids, values=values_map)

    return EvaluateRulesResponse(
        field_states=[
            FieldStateResponse(
                field_id=fid,
                visible=state.visible,
                required=state.required,
                disabled=state.disabled,
            )
            for fid, state in states.items()
        ]
    )


@router.post(
    "/forms/{share_token}/submit",
    response_model=SubmissionCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a validated response with Idempotency protection",
)
def submit_form(
    share_token: str,
    body: SubmissionCreate,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    sub_svc: SubmissionService = Depends(get_submission_service),
) -> SubmissionCreateResponse:
    ip = request.client.host if request.client else None
    return sub_svc.submit(
        share_token=share_token,
        body=body,
        ip_address=ip,
        idempotency_key=idempotency_key,
    )


# ── File Upload & Download Endpoints ──────────────────────────────────────────

@router.post(
    "/uploads",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file for file_upload fields",
)
async def upload_file(
    file: UploadFile = File(...),
    validation_engine: ValidationEngine = Depends(get_validation_engine),
) -> FileUploadResponse:
    filename = file.filename or "uploaded_file"
    file_bytes = await file.read()
    size_bytes = len(file_bytes)

    # Validate file extension & size against default constraints
    file_err = validation_engine.validate_file(
        filename=filename,
        file_size_bytes=size_bytes,
        config={"allowed_types": ["pdf", "docx", "doc", "jpg", "jpeg", "png", "gif", "xlsx", "csv", "txt"], "max_size_mb": 10},
        field_label="File Upload",
        field_id="upload",
    )
    if file_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=file_err.message,
        )

    # Generate unique UUID filename
    unique_id = str(uuid4())
    safe_basename = os.path.basename(filename)
    saved_filename = f"{unique_id}_{safe_basename}"
    destination_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(destination_path, "wb") as f:
        f.write(file_bytes)

    file_url = f"/api/v1/public/uploads/{saved_filename}"

    return FileUploadResponse(
        file_id=unique_id,
        filename=filename,
        file_url=file_url,
        file_path=destination_path,
        size_bytes=size_bytes,
    )


@router.get(
    "/uploads/{file_name}",
    summary="Securely download an uploaded file",
)
def download_file(file_name: str):
    # Prevent directory traversal attacks
    safe_filename = os.path.basename(file_name)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(
        path=file_path,
        filename=safe_filename.split("_", 1)[-1] if "_" in safe_filename else safe_filename,
        media_type="application/octet-stream",
    )
