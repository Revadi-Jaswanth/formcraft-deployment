"""
Field Pydantic schemas — field type enum, per-type config models,
and full CRUD request/response schemas.
"""
from __future__ import annotations

from datetime import date as DateType
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Field Type Enum ───────────────────────────────────────────────────────────

class FieldType(str, Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    EMAIL = "email"
    PHONE = "phone"
    DROPDOWN = "dropdown"
    MULTI_CHECKBOX = "multi_checkbox"
    DATE = "date"
    FILE_UPLOAD = "file_upload"
    RATING = "rating"


# ── Per-type Config Schemas ───────────────────────────────────────────────────
# These are not persisted directly; they document the expected JSONB structure.

class TextConfig(BaseModel):
    min_length: int = Field(default=0, ge=0)
    max_length: int = Field(default=5000, gt=0)
    multiline: bool = False


class TextareaConfig(BaseModel):
    min_length: int = Field(default=0, ge=0)
    max_length: int = Field(default=10000, gt=0)
    rows: int = Field(default=4, ge=2, le=20)


class NumberConfig(BaseModel):
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    integer_only: bool = False
    decimal_places: int = Field(default=2, ge=0, le=10)
    unit: Optional[str] = None


class EmailConfig(BaseModel):
    placeholder: Optional[str] = None


class PhoneConfig(BaseModel):
    country_code: Optional[str] = None
    format_validation: bool = True


class DropdownConfig(BaseModel):
    allow_other: bool = False
    searchable: bool = False
    multiple: bool = False


class MultiCheckboxConfig(BaseModel):
    min_selections: int = Field(default=0, ge=0)
    max_selections: Optional[int] = None
    allow_other: bool = False


class DateConfig(BaseModel):
    min_date: Optional[str] = None   # ISO date string YYYY-MM-DD
    max_date: Optional[str] = None
    include_time: bool = False
    date_format: str = "YYYY-MM-DD"


class FileUploadConfig(BaseModel):
    allowed_types: List[str] = Field(
        default=["pdf", "docx", "doc", "jpg", "jpeg", "png", "gif", "xlsx", "csv", "txt"]
    )
    max_size_mb: int = Field(default=10, ge=1, le=100)
    multiple: bool = False
    max_files: int = Field(default=1, ge=1, le=20)


class RatingConfig(BaseModel):
    scale: int = Field(default=5, ge=2, le=10)
    icon: str = "star"       # star | heart | thumb
    low_label: str = "Poor"
    high_label: str = "Excellent"


# Default configs per type (used when no config is provided)
FIELD_TYPE_DEFAULT_CONFIG: Dict[FieldType, Dict[str, Any]] = {
    FieldType.TEXT: TextConfig().model_dump(),
    FieldType.TEXTAREA: TextareaConfig().model_dump(),
    FieldType.NUMBER: NumberConfig().model_dump(),
    FieldType.EMAIL: EmailConfig().model_dump(),
    FieldType.PHONE: PhoneConfig().model_dump(),
    FieldType.DROPDOWN: DropdownConfig().model_dump(),
    FieldType.MULTI_CHECKBOX: MultiCheckboxConfig().model_dump(),
    FieldType.DATE: DateConfig().model_dump(),
    FieldType.FILE_UPLOAD: FileUploadConfig().model_dump(),
    FieldType.RATING: RatingConfig().model_dump(),
}


# ── FieldOption Schemas ───────────────────────────────────────────────────────

class FieldOptionCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1, max_length=255)
    order_index: int = Field(default=0, ge=0)


class FieldOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    value: str
    order_index: int


# ── Field Request Schemas ─────────────────────────────────────────────────────

class FieldCreate(BaseModel):
    field_type: FieldType
    label: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    placeholder: Optional[str] = Field(None, max_length=500)
    is_required: bool = False
    order_index: int = Field(default=0, ge=0)
    config: Dict[str, Any] = Field(default_factory=dict)
    options: List[FieldOptionCreate] = Field(default_factory=list)

    @field_validator("options")
    @classmethod
    def options_only_for_choice_types(
        cls, options: List[FieldOptionCreate], info: Any
    ) -> List[FieldOptionCreate]:
        field_type = info.data.get("field_type")
        choice_types = {FieldType.DROPDOWN, FieldType.MULTI_CHECKBOX}
        if options and field_type not in choice_types:
            raise ValueError(
                f"Options are only supported for field types: "
                f"{', '.join(t.value for t in choice_types)}"
            )
        return options


class FieldUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    placeholder: Optional[str] = Field(None, max_length=500)
    is_required: Optional[bool] = None
    order_index: Optional[int] = Field(None, ge=0)
    config: Optional[Dict[str, Any]] = None
    options: Optional[List[FieldOptionCreate]] = None


class FieldReorderRequest(BaseModel):
    field_ids: List[UUID] = Field(..., min_length=1)


# ── Field Response Schemas ────────────────────────────────────────────────────

class FieldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    form_id: UUID
    field_type: FieldType
    label: str
    description: Optional[str]
    placeholder: Optional[str]
    is_required: bool
    order_index: int
    config: Dict[str, Any]
    options: List[FieldOptionResponse] = []
    created_at: datetime
    updated_at: datetime
