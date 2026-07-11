"""
FieldService — business logic for adding, updating, deleting, and reordering fields.
"""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import HTTPException, status

from app.models.field import Field, FieldOption
from app.repositories.field_repository import FieldRepository
from app.repositories.form_repository import FormRepository
from app.schemas.field import FieldCreate, FieldUpdate, FieldReorderRequest, FIELD_TYPE_DEFAULT_CONFIG


class FieldService:
    def __init__(
        self,
        field_repo: FieldRepository,
        form_repo: FormRepository,
    ) -> None:
        self.field_repo = field_repo
        self.form_repo = form_repo

    # ── Guards ────────────────────────────────────────────────────────────────

    def _assert_form_editable(self, form_id: UUID) -> None:
        form = self.form_repo.get(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status == "archived":
            raise HTTPException(status_code=400, detail="Cannot modify an archived form.")

    def _get_field_or_404(self, field_id: UUID, form_id: UUID) -> Field:
        field = self.field_repo.get_field_for_form(field_id, form_id)
        if not field:
            raise HTTPException(status_code=404, detail="Field not found.")
        return field

    # ── Create ────────────────────────────────────────────────────────────────

    def add_field(self, form_id: UUID, data: FieldCreate) -> Field:
        self._assert_form_editable(form_id)

        # Auto-assign order_index if not explicitly provided (append)
        order_index = data.order_index
        if order_index == 0:
            max_idx = self.field_repo.get_max_order_index(form_id)
            order_index = max_idx + 1

        # Merge caller config with type defaults
        default_cfg = FIELD_TYPE_DEFAULT_CONFIG.get(data.field_type, {})
        config = {**default_cfg, **data.config}

        field_data = {
            "form_id": form_id,
            "field_type": data.field_type.value,
            "label": data.label,
            "description": data.description,
            "placeholder": data.placeholder,
            "is_required": data.is_required,
            "order_index": order_index,
            "config": config,
        }

        options_data = [
            {
                "label": opt.label,
                "value": opt.value,
                "order_index": opt.order_index if opt.order_index != 0 else i,
            }
            for i, opt in enumerate(data.options)
        ]

        return self.field_repo.create_field_with_options(field_data, options_data)

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_fields(self, form_id: UUID) -> List[Field]:
        form = self.form_repo.get(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        return self.field_repo.get_fields_for_form(form_id)

    def get_field(self, form_id: UUID, field_id: UUID) -> Field:
        form = self.form_repo.get(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        return self._get_field_or_404(field_id, form_id)

    # ── Update ────────────────────────────────────────────────────────────────

    def update_field(self, form_id: UUID, field_id: UUID, data: FieldUpdate) -> Field:
        self._assert_form_editable(form_id)
        field = self._get_field_or_404(field_id, form_id)

        update_dict = data.model_dump(exclude_unset=True, exclude={"options"})
        if "config" in update_dict and update_dict["config"] is not None:
            # Merge — don't wipe untouched keys
            merged = {**field.config, **update_dict["config"]}
            update_dict["config"] = merged

        for key, value in update_dict.items():
            setattr(field, key, value)

        if data.options is not None:
            options_data = [
                {
                    "label": opt.label,
                    "value": opt.value,
                    "order_index": opt.order_index if opt.order_index != 0 else i,
                }
                for i, opt in enumerate(data.options)
            ]
            return self.field_repo.replace_options(field, options_data)

        self.field_repo.db.commit()
        self.field_repo.db.refresh(field)
        return field

    # ── Delete ────────────────────────────────────────────────────────────────

    def delete_field(self, form_id: UUID, field_id: UUID) -> None:
        self._assert_form_editable(form_id)
        field = self._get_field_or_404(field_id, form_id)
        self.field_repo.db.delete(field)
        self.field_repo.db.commit()

    # ── Reorder ───────────────────────────────────────────────────────────────

    def reorder_fields(self, form_id: UUID, data: FieldReorderRequest) -> List[Field]:
        self._assert_form_editable(form_id)

        all_fields = self.field_repo.get_fields_for_form(form_id)
        existing_ids = {f.id for f in all_fields}

        for fid in data.field_ids:
            if fid not in existing_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Field {fid} does not belong to this form.",
                )
        if len(data.field_ids) != len(existing_ids):
            raise HTTPException(
                status_code=400,
                detail="field_ids must contain exactly all fields of the form.",
            )

        field_map = {f.id: f for f in all_fields}
        for idx, fid in enumerate(data.field_ids):
            field_map[fid].order_index = idx

        self.field_repo.db.commit()
        return [field_map[fid] for fid in data.field_ids]
