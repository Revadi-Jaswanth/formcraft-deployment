"""
FieldRepository — queries for fields and field options.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.field import Field, FieldOption
from app.repositories.base import BaseRepository


class FieldRepository(BaseRepository[Field]):
    def __init__(self, db: Session) -> None:
        super().__init__(Field, db)

    def get_fields_for_form(self, form_id: UUID) -> List[Field]:
        """Return all fields for a form, ordered by order_index."""
        stmt = (
            select(Field)
            .where(Field.form_id == form_id)
            .options(selectinload(Field.options))
            .order_by(Field.order_index)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_field_for_form(self, field_id: UUID, form_id: UUID) -> Optional[Field]:
        """Get a single field that belongs to a specific form."""
        stmt = (
            select(Field)
            .where(Field.id == field_id, Field.form_id == form_id)
            .options(selectinload(Field.options))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_max_order_index(self, form_id: UUID) -> int:
        """Returns the current maximum order_index for a form's fields."""
        fields = self.get_fields_for_form(form_id)
        if not fields:
            return -1
        return max(f.order_index for f in fields)

    def create_field_with_options(
        self, field_data: dict, options_data: List[dict]
    ) -> Field:
        field = Field(**field_data)
        self.db.add(field)
        self.db.flush()  # populate field.id

        for opt_data in options_data:
            option = FieldOption(field_id=field.id, **opt_data)
            self.db.add(option)

        self.db.commit()
        self.db.refresh(field)
        return field

    def replace_options(self, field: Field, options_data: List[dict]) -> Field:
        """Delete all existing options and re-create from options_data."""
        for opt in list(field.options):
            self.db.delete(opt)
        self.db.flush()

        for i, opt_data in enumerate(options_data):
            # Ensure order_index is set
            if "order_index" not in opt_data or opt_data["order_index"] == 0:
                opt_data["order_index"] = i
            option = FieldOption(field_id=field.id, **opt_data)
            self.db.add(option)

        self.db.commit()
        self.db.refresh(field)
        return field
