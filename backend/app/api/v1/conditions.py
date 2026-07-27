"""
Conditions router — manage conditional show/hide/require rules for a form.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import get_condition_service, get_current_user, get_form_service
from app.schemas.condition import (
    ConditionalRuleCreate,
    ConditionalRuleResponse,
    ConditionalRuleUpdate,
)
from app.services.condition_service import ConditionService
from app.services.form_service import FormService
from app.models.user import User

router = APIRouter(prefix="/forms/{form_id}/conditions", tags=["Conditions"])


@router.get(
    "",
    response_model=List[ConditionalRuleResponse],
    summary="List all conditional rules for a form",
)
def list_conditions(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: ConditionService = Depends(get_condition_service),
    form_svc: FormService = Depends(get_form_service),
) -> List[ConditionalRuleResponse]:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    return [ConditionalRuleResponse.model_validate(c) for c in svc.list_conditions(form_id)]


@router.post(
    "",
    response_model=ConditionalRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a conditional rule to a form",
)
def create_condition(
    form_id: UUID,
    body: ConditionalRuleCreate,
    current_user: User = Depends(get_current_user),
    svc: ConditionService = Depends(get_condition_service),
    form_svc: FormService = Depends(get_form_service),
) -> ConditionalRuleResponse:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    rule = svc.create_condition(form_id, body)
    return ConditionalRuleResponse.model_validate(rule)


@router.put(
    "/{condition_id}",
    response_model=ConditionalRuleResponse,
    summary="Update a conditional rule",
)
def update_condition(
    form_id: UUID,
    condition_id: UUID,
    body: ConditionalRuleUpdate,
    current_user: User = Depends(get_current_user),
    svc: ConditionService = Depends(get_condition_service),
    form_svc: FormService = Depends(get_form_service),
) -> ConditionalRuleResponse:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    rule = svc.update_condition(form_id, condition_id, body)
    return ConditionalRuleResponse.model_validate(rule)


@router.delete(
    "/{condition_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conditional rule",
)
def delete_condition(
    form_id: UUID,
    condition_id: UUID,
    current_user: User = Depends(get_current_user),
    svc: ConditionService = Depends(get_condition_service),
    form_svc: FormService = Depends(get_form_service),
) -> None:
    form_svc.get_form_detail(form_id, user_id=current_user.id)
    svc.delete_condition(form_id, condition_id)
