"""
Submission and ResponseValue ORM models.

Each Submission is linked to a FormVersion so historical responses
always reference the exact schema they were submitted against.
"""
from uuid import uuid4, UUID
from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

from app.models.base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    form_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("forms.id"), nullable=False, index=True
    )
    form_version_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("form_versions.id"), nullable=True
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # When the respondent opened the form
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completion_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Extra metadata bag (browser, user-agent, etc.)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSONB, default=dict, nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────
    form: Mapped["Form"] = relationship("Form", back_populates="submissions")
    form_version: Mapped[Optional["FormVersion"]] = relationship(
        "FormVersion", back_populates="submissions"
    )
    response_values: Mapped[List["ResponseValue"]] = relationship(
        "ResponseValue",
        back_populates="submission",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Submission id={self.id} form_id={self.form_id}>"


class ResponseValue(Base):
    __tablename__ = "response_values"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    submission_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("submissions.id"), nullable=False, index=True
    )
    field_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("fields.id"), nullable=False
    )
    # Raw value as string (arrays serialised as JSON string)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Path for file-upload fields (populated by M3 file service)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────
    submission: Mapped["Submission"] = relationship(
        "Submission", back_populates="response_values"
    )
    field: Mapped["Field"] = relationship("Field")

    def __repr__(self) -> str:
        return f"<ResponseValue sub={self.submission_id} field={self.field_id}>"
