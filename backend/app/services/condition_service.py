"""
ConditionService — business logic for managing conditional rules.
"""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import HTTPException

from app.models.condition import ConditionalRule
from app.repositories.condition_repository import ConditionRepository
from app.repositories.field_repository import FieldRepository
from app.repositories.form_repository import FormRepository
from app.schemas.condition import ConditionalRuleCreate, ConditionalRuleUpdate


class ConditionService:
    def __init__(
        self,
        condition_repo: ConditionRepository,
        field_repo: FieldRepository,
        form_repo: FormRepository,
    ) -> None:
        self.condition_repo = condition_repo
        self.field_repo = field_repo
        self.form_repo = form_repo

    def _assert_form_editable(self, form_id: UUID) -> None:
        form = self.form_repo.get(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        if form.status == "archived":
            raise HTTPException(status_code=400, detail="Cannot modify an archived form.")

    def _assert_fields_belong_to_form(
        self, form_id: UUID, source_id: UUID, target_id: UUID
    ) -> None:
        src = self.field_repo.get_field_for_form(source_id, form_id)
        tgt = self.field_repo.get_field_for_form(target_id, form_id)
        if not src:
            raise HTTPException(status_code=400, detail=f"Source field {source_id} not found in this form.")
        if not tgt:
            raise HTTPException(status_code=400, detail=f"Target field {target_id} not found in this form.")
        if source_id == target_id:
            raise HTTPException(status_code=400, detail="Source and target fields cannot be the same.")

    def create_condition(self, form_id: UUID, data: ConditionalRuleCreate) -> ConditionalRule:
        self._assert_form_editable(form_id)
        self._assert_fields_belong_to_form(form_id, data.source_field_id, data.target_field_id)

        rule = ConditionalRule(
            form_id=form_id,
            source_field_id=data.source_field_id,
            target_field_id=data.target_field_id,
            operator=data.operator.value,
            value=data.value,
            action=data.action.value,
            logic_group=data.logic_group,
        )
        return self.condition_repo.save(rule)

    def list_conditions(self, form_id: UUID) -> List[ConditionalRule]:
        form = self.form_repo.get(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found.")
        return self.condition_repo.get_conditions_for_form(form_id)

    def update_condition(
        self, form_id: UUID, condition_id: UUID, data: ConditionalRuleUpdate
    ) -> ConditionalRule:
        self._assert_form_editable(form_id)
        rule = self.condition_repo.get_condition_for_form(condition_id, form_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Condition not found.")

        update_data = data.model_dump(exclude_unset=True)
        # Coerce enums to their string values
        for k in ("operator", "action"):
            if k in update_data and update_data[k] is not None:
                update_data[k] = update_data[k].value

        return self.condition_repo.update(rule, update_data)

    def delete_condition(self, form_id: UUID, condition_id: UUID) -> None:
        self._assert_form_editable(form_id)
        rule = self.condition_repo.get_condition_for_form(condition_id, form_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Condition not found.")
        self.condition_repo.db.delete(rule)
        self.condition_repo.db.commit()
