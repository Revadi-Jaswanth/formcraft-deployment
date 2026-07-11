"""
ConditionalRule ORM model.

A rule says: "When <source_field> <operator> <value>, then <action> <target_field>."
Multiple rules on the same target_field are evaluated with OR logic by default;
use logic_group to create AND groups.
"""
from uuid import uuid4, UUID
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, TimestampMixin


class ConditionalRule(Base, TimestampMixin):
    __tablename__ = "conditional_rules"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    form_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("forms.id"), nullable=False, index=True
    )
    # Field whose value is evaluated
    source_field_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("fields.id"), nullable=False
    )
    # Field that is shown/hidden/required based on evaluation
    target_field_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("fields.id"), nullable=False
    )
    # Comparison operator (equals, not_equals, contains, greater_than, …)
    operator: Mapped[str] = mapped_column(String(50), nullable=False)
    # Value to compare against (serialised as string; frontend/backend parse as needed)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Action to take: show | hide | require | disable
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    # Optional grouping key for AND/OR compound logic
    logic_group: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # ── Relationships ─────────────────────────────────────────────
    form: Mapped["Form"] = relationship("Form", back_populates="conditions")
    source_field: Mapped["Field"] = relationship(
        "Field",
        foreign_keys=[source_field_id],
        back_populates="source_conditions",
    )
    target_field: Mapped["Field"] = relationship(
        "Field",
        foreign_keys=[target_field_id],
        back_populates="target_conditions",
    )

    def __repr__(self) -> str:
        return (
            f"<ConditionalRule src={self.source_field_id} "
            f"op={self.operator} -> {self.action} tgt={self.target_field_id}>"
        )
