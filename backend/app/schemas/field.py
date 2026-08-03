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
    RADIO = "radio"
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


class RadioConfig(BaseModel):
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
    FieldType.RADIO: RadioConfig().model_dump(),
    FieldType.DATE: DateConfig().model_dump(),
    FieldType.FILE_UPLOAD: FileUploadConfig().model_dump(),
    FieldType.RATING: RatingConfig().model_dump(),
}

# ── Field types that support option lists ─────────────────────────────────────
CHOICE_FIELD_TYPES = {FieldType.DROPDOWN, FieldType.MULTI_CHECKBOX, FieldType.RADIO}


# ── API Response Schemas for GET /field-types ─────────────────────────────────

class FieldTypeConfigProperty(BaseModel):
    """Describes a single configurable property of a field type."""
    key: str
    type: str          # "string" | "integer" | "float" | "boolean" | "array"
    label: str
    description: str
    default: Any
    required: bool = False


class FieldTypeMetadata(BaseModel):
    """Full metadata for a single field type — returned by GET /field-types."""
    type: str
    label: str
    description: str
    icon: str          # lucide-react icon name (used by the frontend)
    color: str         # Tailwind color class (e.g. "text-blue-400")
    supports_options: bool  # True for dropdown / radio / multi_checkbox
    default_config: Dict[str, Any]
    config_schema: List[FieldTypeConfigProperty]


# ── Canonical field-type catalogue ────────────────────────────────────────────
# This is the single source of truth consumed by GET /field-types.

FIELD_TYPE_CATALOGUE: List[Dict[str, Any]] = [
    {
        "type": FieldType.TEXT,
        "label": "Short Text",
        "description": "Single-line text input",
        "icon": "Type",
        "color": "text-blue-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.TEXT],
        "config_schema": [
            FieldTypeConfigProperty(key="min_length", type="integer", label="Min Length",
                description="Minimum number of characters required", default=0),
            FieldTypeConfigProperty(key="max_length", type="integer", label="Max Length",
                description="Maximum number of characters allowed", default=5000),
            FieldTypeConfigProperty(key="multiline", type="boolean", label="Multiline",
                description="Allow line breaks in input", default=False),
        ],
    },
    {
        "type": FieldType.TEXTAREA,
        "label": "Long Text",
        "description": "Multi-line textarea for extended answers",
        "icon": "AlignLeft",
        "color": "text-indigo-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.TEXTAREA],
        "config_schema": [
            FieldTypeConfigProperty(key="min_length", type="integer", label="Min Length",
                description="Minimum number of characters required", default=0),
            FieldTypeConfigProperty(key="max_length", type="integer", label="Max Length",
                description="Maximum number of characters allowed", default=10000),
            FieldTypeConfigProperty(key="rows", type="integer", label="Visible Rows",
                description="Number of visible text rows (2–20)", default=4),
        ],
    },
    {
        "type": FieldType.NUMBER,
        "label": "Number",
        "description": "Numeric input with optional range and precision constraints",
        "icon": "Hash",
        "color": "text-violet-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.NUMBER],
        "config_schema": [
            FieldTypeConfigProperty(key="min_value", type="float", label="Min Value",
                description="Smallest value accepted (null = no limit)", default=None),
            FieldTypeConfigProperty(key="max_value", type="float", label="Max Value",
                description="Largest value accepted (null = no limit)", default=None),
            FieldTypeConfigProperty(key="integer_only", type="boolean", label="Integer Only",
                description="Reject decimal values", default=False),
            FieldTypeConfigProperty(key="decimal_places", type="integer", label="Decimal Places",
                description="Maximum decimal precision (0–10)", default=2),
            FieldTypeConfigProperty(key="unit", type="string", label="Unit",
                description="Optional unit label shown beside the input (e.g. kg, $)", default=None),
        ],
    },
    {
        "type": FieldType.EMAIL,
        "label": "Email",
        "description": "Email address field with format validation",
        "icon": "Mail",
        "color": "text-pink-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.EMAIL],
        "config_schema": [
            FieldTypeConfigProperty(key="placeholder", type="string", label="Placeholder",
                description="Hint text shown inside the input", default=None),
        ],
    },
    {
        "type": FieldType.PHONE,
        "label": "Phone",
        "description": "Phone number input with optional format validation",
        "icon": "Phone",
        "color": "text-rose-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.PHONE],
        "config_schema": [
            FieldTypeConfigProperty(key="country_code", type="string", label="Country Code",
                description="Default country code (e.g. +1, +91)", default=None),
            FieldTypeConfigProperty(key="format_validation", type="boolean", label="Format Validation",
                description="Validate phone number format", default=True),
        ],
    },
    {
        "type": FieldType.DROPDOWN,
        "label": "Dropdown",
        "description": "Single-select (or multi-select) list from a predefined set of options",
        "icon": "ChevronDown",
        "color": "text-amber-400",
        "supports_options": True,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.DROPDOWN],
        "config_schema": [
            FieldTypeConfigProperty(key="allow_other", type="boolean", label="Allow Other",
                description="Let respondents type a custom answer", default=False),
            FieldTypeConfigProperty(key="searchable", type="boolean", label="Searchable",
                description="Enable search / filter inside the dropdown", default=False),
            FieldTypeConfigProperty(key="multiple", type="boolean", label="Multiple Select",
                description="Allow selecting more than one option", default=False),
        ],
    },
    {
        "type": FieldType.RADIO,
        "label": "Radio Buttons",
        "description": "Single-select option list displayed as radio buttons",
        "icon": "CircleDot",
        "color": "text-purple-400",
        "supports_options": True,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.RADIO],
        "config_schema": [
            FieldTypeConfigProperty(key="allow_other", type="boolean", label="Allow Other",
                description="Let respondents type a custom answer", default=False),
        ],
    },
    {
        "type": FieldType.MULTI_CHECKBOX,
        "label": "Checkboxes",
        "description": "Multi-select option list displayed as checkboxes",
        "icon": "CheckSquare",
        "color": "text-emerald-400",
        "supports_options": True,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.MULTI_CHECKBOX],
        "config_schema": [
            FieldTypeConfigProperty(key="min_selections", type="integer", label="Min Selections",
                description="Minimum number of checkboxes that must be ticked", default=0),
            FieldTypeConfigProperty(key="max_selections", type="integer", label="Max Selections",
                description="Maximum number of checkboxes that can be ticked (null = unlimited)", default=None),
            FieldTypeConfigProperty(key="allow_other", type="boolean", label="Allow Other",
                description="Let respondents type a custom answer", default=False),
        ],
    },
    {
        "type": FieldType.DATE,
        "label": "Date",
        "description": "Date or date-time picker with optional range constraints",
        "icon": "Calendar",
        "color": "text-cyan-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.DATE],
        "config_schema": [
            FieldTypeConfigProperty(key="min_date", type="string", label="Earliest Date",
                description="ISO 8601 date string — earliest selectable date (YYYY-MM-DD)", default=None),
            FieldTypeConfigProperty(key="max_date", type="string", label="Latest Date",
                description="ISO 8601 date string — latest selectable date (YYYY-MM-DD)", default=None),
            FieldTypeConfigProperty(key="include_time", type="boolean", label="Include Time",
                description="Show a time-picker alongside the date picker", default=False),
            FieldTypeConfigProperty(key="date_format", type="string", label="Date Format",
                description="Display format string (e.g. YYYY-MM-DD, DD/MM/YYYY)", default="YYYY-MM-DD"),
        ],
    },
    {
        "type": FieldType.FILE_UPLOAD,
        "label": "File Upload",
        "description": "Secure file upload with type and size constraints",
        "icon": "Upload",
        "color": "text-teal-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.FILE_UPLOAD],
        "config_schema": [
            FieldTypeConfigProperty(key="allowed_types", type="array", label="Allowed File Types",
                description="List of accepted extensions without dot (e.g. ['pdf','jpg'])",
                default=["pdf", "docx", "doc", "jpg", "jpeg", "png", "gif", "xlsx", "csv", "txt"]),
            FieldTypeConfigProperty(key="max_size_mb", type="integer", label="Max File Size (MB)",
                description="Maximum allowed file size in megabytes (1–100)", default=10),
            FieldTypeConfigProperty(key="multiple", type="boolean", label="Allow Multiple Files",
                description="Let respondents upload more than one file", default=False),
            FieldTypeConfigProperty(key="max_files", type="integer", label="Max File Count",
                description="Maximum number of files when multiple is enabled (1–20)", default=1),
        ],
    },
    {
        "type": FieldType.RATING,
        "label": "Rating",
        "description": "Star, heart or thumb rating scale",
        "icon": "Star",
        "color": "text-yellow-400",
        "supports_options": False,
        "default_config": FIELD_TYPE_DEFAULT_CONFIG[FieldType.RATING],
        "config_schema": [
            FieldTypeConfigProperty(key="scale", type="integer", label="Scale",
                description="Number of rating steps (2–10)", default=5),
            FieldTypeConfigProperty(key="icon", type="string", label="Icon Style",
                description="Icon used for each step: star | heart | thumb", default="star"),
            FieldTypeConfigProperty(key="low_label", type="string", label="Low Label",
                description="Label shown at the low end of the scale", default="Poor"),
            FieldTypeConfigProperty(key="high_label", type="string", label="High Label",
                description="Label shown at the high end of the scale", default="Excellent"),
        ],
    },
]



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
        choice_types = {FieldType.DROPDOWN, FieldType.MULTI_CHECKBOX, FieldType.RADIO}
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
