"""
Conditions router — manage conditional show/hide/require rules for a form.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import get_condition_service, verify_api_key
from app.schemas.condition import (
    ConditionalRuleCreate,
    ConditionalRuleResponse,
    ConditionalRuleUpdate,
)
from app.services.condition_service import ConditionService

router = APIRouter(prefix="/forms/{form_id}/conditions", tags=["Conditions"])


@router.get(
    "",
    response_model=List[ConditionalRuleResponse],
    summary="List all conditional rules for a form",
    dependencies=[Depends(verify_api_key)],
)
def list_conditions(
    form_id: UUID,
    svc: ConditionService = Depends(get_condition_service),
) -> List[ConditionalRuleResponse]:
    return [ConditionalRuleResponse.model_validate(c) for c in svc.list_conditions(form_id)]


@router.post(
    "",
    response_model=ConditionalRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a conditional rule to a form",
    dependencies=[Depends(verify_api_key)],
)
def create_condition(
    form_id: UUID,
    body: ConditionalRuleCreate,
    svc: ConditionService = Depends(get_condition_service),
) -> ConditionalRuleResponse:
    rule = svc.create_condition(form_id, body)
    return ConditionalRuleResponse.model_validate(rule)


@router.put(
    "/{condition_id}",
    response_model=ConditionalRuleResponse,
    summary="Update a conditional rule",
    dependencies=[Depends(verify_api_key)],
)
def update_condition(
    form_id: UUID,
    condition_id: UUID,
    body: ConditionalRuleUpdate,
    svc: ConditionService = Depends(get_condition_service),
) -> ConditionalRuleResponse:
    rule = svc.update_condition(form_id, condition_id, body)
    return ConditionalRuleResponse.model_validate(rule)


@router.delete(
    "/{condition_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conditional rule",
    dependencies=[Depends(verify_api_key)],
)
def delete_condition(
    form_id: UUID,
    condition_id: UUID,
    svc: ConditionService = Depends(get_condition_service),
) -> None:
    svc.delete_condition(form_id, condition_id)
