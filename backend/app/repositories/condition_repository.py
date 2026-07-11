"""
ConditionRepository — queries for conditional_rules.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.condition import ConditionalRule
from app.repositories.base import BaseRepository


class ConditionRepository(BaseRepository[ConditionalRule]):
    def __init__(self, db: Session) -> None:
        super().__init__(ConditionalRule, db)

    def get_conditions_for_form(self, form_id: UUID) -> List[ConditionalRule]:
        stmt = select(ConditionalRule).where(ConditionalRule.form_id == form_id)
        return list(self.db.execute(stmt).scalars().all())

    def get_condition_for_form(
        self, condition_id: UUID, form_id: UUID
    ) -> Optional[ConditionalRule]:
        stmt = select(ConditionalRule).where(
            ConditionalRule.id == condition_id,
            ConditionalRule.form_id == form_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def delete_conditions_for_form(self, form_id: UUID) -> int:
        result = (
            self.db.query(ConditionalRule)
            .filter(ConditionalRule.form_id == form_id)
            .delete()
        )
        self.db.flush()
        return result
