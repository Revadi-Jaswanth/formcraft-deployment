"""
Field and FieldOption ORM models.

Supported field_type values (enforced by Pydantic schemas):
  text | textarea | number | email | phone | dropdown |
  multi_checkbox | date | file_upload | rating
"""
from uuid import uuid4, UUID
from typing import Optional, List

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

from app.models.base import Base, TimestampMixin


class Field(Base, TimestampMixin):
    __tablename__ = "fields"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    form_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("forms.id"), nullable=False, index=True
    )
    field_type: Mapped[str] = mapped_column(String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    placeholder: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Zero-based display order within the form
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Field-type-specific configuration (min/max length, scale, etc.)
    config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # ── Relationships ─────────────────────────────────────────────
    form: Mapped["Form"] = relationship("Form", back_populates="fields")
    options: Mapped[List["FieldOption"]] = relationship(
        "FieldOption",
        back_populates="field",
        cascade="all, delete-orphan",
        order_by="FieldOption.order_index",
    )
    # Conditions where this field is the trigger
    source_conditions: Mapped[List["ConditionalRule"]] = relationship(
        "ConditionalRule",
        foreign_keys="ConditionalRule.source_field_id",
        back_populates="source_field",
        cascade="all, delete-orphan",
    )
    # Conditions where this field is the target
    target_conditions: Mapped[List["ConditionalRule"]] = relationship(
        "ConditionalRule",
        foreign_keys="ConditionalRule.target_field_id",
        back_populates="target_field",
    )

    def __repr__(self) -> str:
        return f"<Field id={self.id} type={self.field_type} label={self.label!r}>"


class FieldOption(Base):
    __tablename__ = "field_options"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    field_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("fields.id"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Relationships ─────────────────────────────────────────────
    field: Mapped["Field"] = relationship("Field", back_populates="options")

    def __repr__(self) -> str:
        return f"<FieldOption field_id={self.field_id} value={self.value!r}>"
