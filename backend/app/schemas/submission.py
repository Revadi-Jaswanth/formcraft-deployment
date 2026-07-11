"""
Submission Pydantic schemas.
"""
from __future__ import annotations

from typing import List, Optional
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


class SubmissionCreateResponse(BaseModel):
    """Minimal response returned after a successful form submission."""
    submission_id: UUID
    message: str = "Your response has been recorded. Thank you!"
