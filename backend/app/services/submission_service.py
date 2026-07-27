from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException, status

from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate, SubmissionCreateResponse, SubmissionSummary
from app.services.rule_engine import RuleEngine, RuleDTO
from app.services.validation_engine import ValidationEngine

class DynamicObject:
    def __init__(self, d: dict):
        for k, v in d.items():
            if k == "options" and isinstance(v, list):
                setattr(self, k, [DynamicObject(item) for item in v])
            else:
                setattr(self, k, v)
        
        # Convert ID string back to UUID object for matching compatibility
        if hasattr(self, "id") and isinstance(self.id, str):
            try:
                self.id = UUID(self.id)
            except ValueError:
                pass
        if hasattr(self, "source_field_id") and isinstance(self.source_field_id, str):
            try:
                self.source_field_id = UUID(self.source_field_id)
            except ValueError:
                pass
        if hasattr(self, "target_field_id") and isinstance(self.target_field_id, str):
            try:
                self.target_field_id = UUID(self.target_field_id)
            except ValueError:
                pass

class SubmissionService:
    def __init__(self, form_repo, field_repo, condition_repo, sub_repo) -> None:
        self.form_repo = form_repo
        self.field_repo = field_repo
        self.condition_repo = condition_repo
        self.sub_repo = sub_repo

    def submit(
        self,
        share_token: str,
        body: SubmissionCreate,
        ip_address: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> SubmissionCreateResponse:
        # 1. Resolve Form
        form = self.form_repo.get_by_share_token(share_token)
        if not form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found.",
            )

        # 2. Check status
        if form.status != "published":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Form is not accepting responses.",
            )

        # 3. Resolve active form version
        form_version = self.form_repo.get_active_version(form.id)
        if not form_version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active form version not found.",
            )

        # 4. Idempotency check (store key in metadata JSON)
        if idempotency_key:
            existing = (
                self.sub_repo.db.query(Submission)
                .filter(Submission.form_id == form.id)
                .filter(Submission.metadata_["idempotency_key"].astext == idempotency_key)
                .first()
            )
            if existing:
                fields_answered = len([
                    rv for rv in existing.response_values
                    if rv.value and rv.value != "" and rv.value != "[]"
                ])
                return SubmissionCreateResponse(
                    response_id=existing.id,
                    submitted_at=existing.submitted_at,
                    summary=SubmissionSummary(
                        form_title=form.title,
                        fields_answered=fields_answered,
                    ),
                    message="Your response has been recorded. Thank you! (Duplicate submission ignored)",
                )

        # 5. Extract fields and conditions from schema snapshot
        snapshot = form_version.schema_snapshot or {}
        fields_raw = snapshot.get("fields", [])
        conditions_raw = snapshot.get("conditions", [])

        # Parse into dynamic objects
        fields = [DynamicObject(f) for f in fields_raw]
        conditions = [DynamicObject(c) for c in conditions_raw]

        # 6. Evaluate conditional rules using RuleEngine
        rule_engine = RuleEngine()
        rule_dtos = [
            RuleDTO(
                id=r.id,
                source_field_id=r.source_field_id,
                target_field_id=r.target_field_id,
                operator=r.operator,
                value=r.value,
                action=r.action,
                logic_group=r.logic_group,
            )
            for r in conditions
        ]

        # Map response values with UUID keys for comparison matching
        values_map = {UUID(str(r.field_id)): r.value for r in body.responses}
        all_field_ids = [f.id for f in fields]
        states = rule_engine.evaluate(rules=rule_dtos, field_ids=all_field_ids, values=values_map)

        # 7. Validate field values using ValidationEngine
        validation_engine = ValidationEngine()
        errors = []
        fields_answered = 0
        final_values = {}

        for field in fields:
            state = states.get(field.id)
            is_visible = state.visible if state else True
            is_required = state.required if state else field.is_required
            is_disabled = state.disabled if state else False

            val = values_map.get(field.id)

            if not is_visible or is_disabled:
                continue

            # Validate input formats and constraints
            err_msg = validation_engine.validate_field(field, val, is_required)
            if err_msg:
                errors.append({"field_id": str(field.id), "message": err_msg})
            else:
                final_values[field.id] = val
                if val is not None and str(val).strip() != "" and str(val).strip() != "[]":
                    fields_answered += 1

        if errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=errors,
            )

        # 8. Save submission
        sub_data = {
            "form_id": form.id,
            "form_version_id": form_version.id,
            "session_id": body.session_id,
            "ip_address": ip_address,
            "started_at": body.started_at,
            "completion_time_seconds": body.completion_time_seconds,
            "metadata_": {"idempotency_key": idempotency_key} if idempotency_key else {},
        }
        responses_data = [
            {"field_id": fid, "value": val}
            for fid, val in final_values.items() if val is not None
        ]

        submission = self.sub_repo.create_submission(sub_data, responses_data)

        # 9. Build and return response
        return SubmissionCreateResponse(
            response_id=submission.id,
            submitted_at=submission.submitted_at,
            summary=SubmissionSummary(
                form_title=form.title,
                fields_answered=fields_answered,
            ),
        )
