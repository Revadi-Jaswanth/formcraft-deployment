"""
Submission Pydantic schemas.
"""
from __future__ import annotations

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Request Schemas ───────────────────────────────────────────────────────────

class ResponseValueCreate(BaseModel):
    field_id: UUID
    # Scalar text value; arrays (multi_checkbox) are JSON-encoded strings
    value: Optional[str] = None


class SubmissionCreate(BaseModel):
    session_id: Optional[str] = Field(None, max_length=255)
    started_at: Optional[datetime] = None
    completion_time_seconds: Optional[int] = Field(None, ge=0)
    responses: List[ResponseValueCreate] = Field(..., min_length=0)


# ── Response Schemas ──────────────────────────────────────────────────────────

class ResponseValueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    field_id: UUID
    value: Optional[str]
    file_path: Optional[str]
    created_at: datetime


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    form_id: UUID
    form_version_id: Optional[UUID]
    session_id: Optional[str]
    ip_address: Optional[str]
    started_at: Optional[datetime]
    submitted_at: datetime
    completion_time_seconds: Optional[int]
    response_values: List[ResponseValueResponse] = []


class SubmissionSummary(BaseModel):
    form_title: str
    fields_answered: int


class SubmissionCreateResponse(BaseModel):
    """Enriched response returned after a successful form submission."""
    response_id: UUID
    submitted_at: datetime
    summary: SubmissionSummary
    message: str = "Your response has been recorded. Thank you!"

    # Alias for backward compatibility
    @property
    def submission_id(self) -> UUID:
        return self.response_id


class FileUploadResponse(BaseModel):
    """Response returned after uploading a file."""
    file_id: str
    filename: str
    file_url: str
    file_path: str
    size_bytes: int


# ── Rule evaluation request/response (Milestone 2) ───────────────────────────

class EvaluateRulesRequest(BaseModel):
    """POST /public/forms/{token}/evaluate — evaluate rules client-side during form fill."""
    responses: List[ResponseValueCreate] = Field(default_factory=list)


class FieldStateResponse(BaseModel):
    """Resolved state of a single field after rule evaluation."""
    field_id: UUID
    visible: bool
    required: bool
    disabled: bool


class EvaluateRulesResponse(BaseModel):
    """Result of evaluating all conditional rules for a form submission."""
    field_states: List[FieldStateResponse]
