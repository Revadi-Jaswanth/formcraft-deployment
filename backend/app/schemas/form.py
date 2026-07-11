"""
Form Pydantic schemas — CRUD, publish, archive, versioning, public view.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.schemas.field import FieldResponse
from app.schemas.condition import ConditionalRuleResponse


# ── Enums ─────────────────────────────────────────────────────────────────────

class FormStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# ── Form Settings ─────────────────────────────────────────────────────────────

class FormSettings(BaseModel):
    allow_multiple_submissions: bool = True
    show_progress_bar: bool = True
    submit_button_text: str = Field(default="Submit", max_length=100)
    success_message: str = Field(
        default="Thank you for your submission!", max_length=1000
    )
    redirect_url: Optional[str] = Field(None, max_length=2048)
    require_email: bool = False
    is_anonymous: bool = False
    close_on_date: Optional[datetime] = None
    max_submissions: Optional[int] = Field(None, ge=1)


# ── Request Schemas ───────────────────────────────────────────────────────────

class FormCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    settings: FormSettings = Field(default_factory=FormSettings)


class FormUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    settings: Optional[FormSettings] = None


class PublishFormRequest(BaseModel):
    change_summary: Optional[str] = Field(None, max_length=500)


class DuplicateFormRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)


# ── Version Response ──────────────────────────────────────────────────────────

class FormVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    form_id: UUID
    version_number: int
    schema_snapshot: Dict[str, Any]
    published_at: datetime
    is_active: bool
    change_summary: Optional[str]


# ── Form Response Schemas ─────────────────────────────────────────────────────

class FormListItem(BaseModel):
    """Lightweight representation used in list endpoints."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str]
    status: FormStatus
    current_version_number: int
    share_token: Optional[str]
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    # Computed in the service layer
    field_count: int = 0
    submission_count: int = 0


class FormDetailResponse(BaseModel):
    """Full representation including fields, versions, and conditions."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str]
    status: FormStatus
    current_version_number: int
    share_token: Optional[str]
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    fields: List[FieldResponse] = []
    versions: List[FormVersionResponse] = []
    conditions: List[ConditionalRuleResponse] = []


# ── Public Form Response (respondent view) ────────────────────────────────────

class PublicFormResponse(BaseModel):
    """Returned to unauthenticated respondents — no internal admin info."""
    id: UUID
    title: str
    description: Optional[str]
    settings: Dict[str, Any]
    version_number: int
    share_token: str
    fields: List[FieldResponse]
    conditions: List[ConditionalRuleResponse]
