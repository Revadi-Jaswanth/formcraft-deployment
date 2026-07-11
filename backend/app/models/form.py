"""
Form and FormVersion ORM models.

Status flow:
  draft ──► published ──► archived
                │
                └──► (re-publish creates a new FormVersion)
"""
from uuid import uuid4, UUID
from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

from app.models.base import Base, TimestampMixin


class Form(Base, TimestampMixin):
    __tablename__ = "forms"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    # ── Core metadata ─────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    # Incremented every time the form is published
    current_version_number: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Unique token used in public share URLs
    share_token: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    # Soft-delete flag
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # JSON bag for form-level settings
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # ── Ownership (nullable for Milestone 1 — no auth) ────────────
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────────
    owner: Mapped[Optional["User"]] = relationship("User", back_populates="forms")
    fields: Mapped[List["Field"]] = relationship(
        "Field",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Field.order_index",
    )
    versions: Mapped[List["FormVersion"]] = relationship(
        "FormVersion",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="FormVersion.version_number",
    )
    conditions: Mapped[List["ConditionalRule"]] = relationship(
        "ConditionalRule",
        back_populates="form",
        cascade="all, delete-orphan",
    )
    submissions: Mapped[List["Submission"]] = relationship(
        "Submission", back_populates="form"
    )

    def __repr__(self) -> str:
        return f"<Form id={self.id} title={self.title!r} status={self.status}>"


class FormVersion(Base):
    __tablename__ = "form_versions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    form_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("forms.id"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    # Complete frozen snapshot of the form at publish time
    schema_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    change_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ─────────────────────────────────────────────
    form: Mapped["Form"] = relationship("Form", back_populates="versions")
    submissions: Mapped[List["Submission"]] = relationship(
        "Submission", back_populates="form_version"
    )

    def __repr__(self) -> str:
        return f"<FormVersion form_id={self.form_id} v={self.version_number}>"
