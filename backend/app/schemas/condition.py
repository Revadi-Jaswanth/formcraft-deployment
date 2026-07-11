"""
ConditionalRule Pydantic schemas.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class ConditionOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
    LESS_THAN_OR_EQUAL = "less_than_or_equal"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"
    IN = "in"
    NOT_IN = "not_in"


class ConditionAction(str, Enum):
    SHOW = "show"
    HIDE = "hide"
    REQUIRE = "require"
    DISABLE = "disable"


# ── Request Schemas ───────────────────────────────────────────────────────────

class ConditionalRuleCreate(BaseModel):
    source_field_id: UUID
    target_field_id: UUID
    operator: ConditionOperator
    # Comparison value — not required for IS_EMPTY / IS_NOT_EMPTY operators
    value: Optional[str] = None
    action: ConditionAction
    logic_group: Optional[str] = Field(None, max_length=50)


class ConditionalRuleUpdate(BaseModel):
    operator: Optional[ConditionOperator] = None
    value: Optional[str] = None
    action: Optional[ConditionAction] = None
    logic_group: Optional[str] = Field(None, max_length=50)


# ── Response Schema ───────────────────────────────────────────────────────────

class ConditionalRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    form_id: UUID
    source_field_id: UUID
    target_field_id: UUID
    operator: ConditionOperator
    value: Optional[str]
    action: ConditionAction
    logic_group: Optional[str]
    created_at: datetime
    updated_at: datetime
