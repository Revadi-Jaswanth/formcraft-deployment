"""
FastAPI dependency injection — database sessions and service factories.

To enable JWT auth on admin routes (Milestone 2), replace `optional_auth`
with `require_auth` in the router files.
"""
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.repositories.form_repository import FormRepository
from app.repositories.field_repository import FieldRepository
from app.repositories.condition_repository import ConditionRepository
from app.repositories.submission_repository import SubmissionRepository
from app.services.form_service import FormService
from app.services.field_service import FieldService
from app.services.condition_service import ConditionService


# ── Repository factories ──────────────────────────────────────────────────────

def get_form_repo(db: Session = Depends(get_db)) -> FormRepository:
    return FormRepository(db)


def get_field_repo(db: Session = Depends(get_db)) -> FieldRepository:
    return FieldRepository(db)


def get_condition_repo(db: Session = Depends(get_db)) -> ConditionRepository:
    return ConditionRepository(db)


def get_submission_repo(db: Session = Depends(get_db)) -> SubmissionRepository:
    return SubmissionRepository(db)


# ── Service factories ─────────────────────────────────────────────────────────

def get_form_service(
    form_repo: FormRepository = Depends(get_form_repo),
    field_repo: FieldRepository = Depends(get_field_repo),
) -> FormService:
    return FormService(form_repo, field_repo)


def get_field_service(
    field_repo: FieldRepository = Depends(get_field_repo),
    form_repo: FormRepository = Depends(get_form_repo),
) -> FieldService:
    return FieldService(field_repo, form_repo)


def get_condition_service(
    condition_repo: ConditionRepository = Depends(get_condition_repo),
    field_repo: FieldRepository = Depends(get_field_repo),
    form_repo: FormRepository = Depends(get_form_repo),
) -> ConditionService:
    return ConditionService(condition_repo, field_repo, form_repo)


# ── Auth (Milestone 1 = API-key; Milestone 2 = swap to JWT) ──────────────────

def verify_api_key(x_api_key: str = Header(default="")) -> None:
    """
    Lightweight API-key guard for admin routes in Milestone 1.
    Set X-Api-Key header to the value of `API_KEY` in your .env.
    """
    if settings.ENVIRONMENT == "development":
        return  # Skip key check in local dev
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )


def optional_auth(authorization: str = Header(default="")) -> None:
    """No-op auth dep — used as a placeholder until full JWT auth is wired."""
    pass
