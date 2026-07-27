"""
FormService — all business logic for forms and form versioning.
"""
from __future__ import annotations

import secrets
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status

from app.models.form import Form, FormVersion
from app.models.field import Field
from app.repositories.form_repository import FormRepository
from app.repositories.field_repository import FieldRepository
from app.schemas.form import (
    FormCreate,
    FormUpdate,
    FormListItem,
    FormDetailResponse,
    PublishFormRequest,
    DuplicateFormRequest,
)
from app.core.config import settings


class FormService:
    def __init__(
        self,
        form_repo: FormRepository,
        field_repo: FieldRepository,
    ) -> None:
        self.form_repo = form_repo
        self.field_repo = field_repo

    # ── Create ────────────────────────────────────────────────────────────────

    def create_form(self, data: FormCreate, user_id: Optional[UUID] = None) -> Form:
        form_dict = {
            "title": data.title,
            "description": data.description,
            "status": "draft",
            "settings": data.settings.model_dump(),
            "created_by": user_id,
        }
        return self.form_repo.create(form_dict)

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_form_detail(self, form_id: UUID, user_id: Optional[UUID] = None) -> Form:
        form = self.form_repo.get_with_details(form_id, user_id=user_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found.")
        return form

    def list_forms(
        self,
        skip: int = 0,
        limit: int = 50,
        form_status: Optional[str] = None,
        search: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ) -> Tuple[List[Form], int]:
        return self.form_repo.list_forms(skip=skip, limit=limit, status=form_status, search=search, user_id=user_id)

    def enrich_list_item(self, form: Form) -> dict:
        """Add computed fields (field_count, submission_count) to a form dict."""
        return {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "status": form.status,
            "current_version_number": form.current_version_number,
            "share_token": form.share_token,
            "settings": form.settings,
            "created_at": form.created_at,
            "updated_at": form.updated_at,
            "field_count": self.form_repo.count_fields(form.id),
            "submission_count": self.form_repo.count_submissions(form.id),
        }

    # ── Update ────────────────────────────────────────────────────────────────

    def update_form(self, form_id: UUID, data: FormUpdate, user_id: Optional[UUID] = None) -> Form:
        form = self._get_editable_form(form_id, user_id=user_id)
        update_dict = data.model_dump(exclude_unset=True)
        if "settings" in update_dict and update_dict["settings"]:
            # Merge settings (don't overwrite keys not passed)
            current = dict(form.settings)
            current.update(update_dict["settings"])
            update_dict["settings"] = current
        return self.form_repo.update(form, update_dict)

    # ── Publish ───────────────────────────────────────────────────────────────

    def publish_form(self, form_id: UUID, data: PublishFormRequest, user_id: Optional[UUID] = None) -> Form:
        form = self.form_repo.get_with_fields(form_id, user_id=user_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status == "archived":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot publish an archived form. Restore it to draft first.",
            )

        # Ensure at least one field exists
        if not form.fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A form must have at least one field before publishing.",
            )

        # Generate share token on first publish
        if not form.share_token:
            form.share_token = secrets.token_urlsafe(settings.SHARE_TOKEN_LENGTH)

        # Build frozen snapshot
        new_version_number = form.current_version_number + 1
        snapshot = self._build_snapshot(form)

        # Deactivate previous versions
        self.form_repo.deactivate_all_versions(form_id)

        version = FormVersion(
            form_id=form.id,
            version_number=new_version_number,
            schema_snapshot=snapshot,
            is_active=True,
            change_summary=data.change_summary,
        )
        self.form_repo.create_version(version)

        form.current_version_number = new_version_number
        form.status = "published"

        self.form_repo.db.commit()
        self.form_repo.db.refresh(form)
        return self.form_repo.get_with_details(form_id, user_id=user_id)

    # ── Archive / Restore ─────────────────────────────────────────────────────

    def archive_form(self, form_id: UUID, user_id: Optional[UUID] = None) -> Form:
        form = self.form_repo.get_with_details(form_id, user_id=user_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status == "draft":
            raise HTTPException(
                status_code=400,
                detail="Only published forms can be archived.",
            )
        form.status = "archived"
        return self.form_repo.save(form)

    def restore_to_draft(self, form_id: UUID, user_id: Optional[UUID] = None) -> Form:
        form = self.form_repo.get_with_details(form_id, user_id=user_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status != "archived":
            raise HTTPException(status_code=400, detail="Form is not archived.")
        form.status = "draft"
        return self.form_repo.save(form)

    # ── Delete (soft) ─────────────────────────────────────────────────────────

    def delete_form(self, form_id: UUID, user_id: Optional[UUID] = None) -> None:
        form = self.form_repo.get_with_details(form_id, user_id=user_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        form.is_deleted = True
        self.form_repo.save(form)

    # ── Duplicate ─────────────────────────────────────────────────────────────

    def duplicate_form(self, form_id: UUID, data: DuplicateFormRequest, user_id: Optional[UUID] = None) -> Form:
        source = self.form_repo.get_with_fields(form_id, user_id=user_id)
        if not source:
            raise HTTPException(status_code=404, detail="Form not found.")

        new_form = Form(
            title=data.title or f"Copy of {source.title}",
            description=source.description,
            settings=dict(source.settings),
            status="draft",
            created_by=user_id,
        )
        self.form_repo.db.add(new_form)
        self.form_repo.db.flush()

        field_id_map: dict = {}
        for src_field in sorted(source.fields, key=lambda f: f.order_index):
            new_field = Field(
                form_id=new_form.id,
                field_type=src_field.field_type,
                label=src_field.label,
                description=src_field.description,
                placeholder=src_field.placeholder,
                is_required=src_field.is_required,
                order_index=src_field.order_index,
                config=dict(src_field.config),
            )
            self.form_repo.db.add(new_field)
            self.form_repo.db.flush()
            field_id_map[src_field.id] = new_field.id

            from app.models.field import FieldOption
            for opt in src_field.options:
                new_opt = FieldOption(
                    field_id=new_field.id,
                    label=opt.label,
                    value=opt.value,
                    order_index=opt.order_index,
                )
                self.form_repo.db.add(new_opt)

        # Duplicate conditions
        from app.models.condition import ConditionalRule
        for cond in source.conditions:
            if cond.source_field_id in field_id_map and cond.target_field_id in field_id_map:
                new_cond = ConditionalRule(
                    form_id=new_form.id,
                    source_field_id=field_id_map[cond.source_field_id],
                    target_field_id=field_id_map[cond.target_field_id],
                    operator=cond.operator,
                    value=cond.value,
                    action=cond.action,
                    logic_group=cond.logic_group,
                )
                self.form_repo.db.add(new_cond)

        self.form_repo.db.commit()
        self.form_repo.db.refresh(new_form)
        return self.form_repo.get_with_details(new_form.id)

    # ── Public access ─────────────────────────────────────────────────────────

    def get_form_by_share_token(self, token: str) -> Form:
        form = self.form_repo.get_by_share_token(token)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status != "published":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This form is not currently accepting responses.",
            )
        return form

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _get_editable_form(self, form_id: UUID, user_id: Optional[UUID] = None) -> Form:
        form = self.form_repo.get_with_details(form_id, user_id=user_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status == "archived":
            raise HTTPException(status_code=400, detail="Cannot edit an archived form.")
        return form

    def _build_snapshot(self, form: Form) -> dict:
        """Freeze the full form schema into a JSON-serialisable dict."""
        return {
            "form": {
                "id": str(form.id),
                "title": form.title,
                "description": form.description,
                "settings": form.settings,
            },
            "fields": [
                {
                    "id": str(f.id),
                    "field_type": f.field_type,
                    "label": f.label,
                    "description": f.description,
                    "placeholder": f.placeholder,
                    "is_required": f.is_required,
                    "order_index": f.order_index,
                    "config": f.config,
                    "options": [
                        {
                            "id": str(o.id),
                            "label": o.label,
                            "value": o.value,
                            "order_index": o.order_index,
                        }
                        for o in sorted(f.options, key=lambda o: o.order_index)
                    ],
                }
                for f in sorted(form.fields, key=lambda f: f.order_index)
            ],
            "conditions": [
                {
                    "id": str(c.id),
                    "source_field_id": str(c.source_field_id),
                    "target_field_id": str(c.target_field_id),
                    "operator": c.operator,
                    "value": c.value,
                    "action": c.action,
                    "logic_group": c.logic_group,
                }
                for c in form.conditions
            ],
        }
