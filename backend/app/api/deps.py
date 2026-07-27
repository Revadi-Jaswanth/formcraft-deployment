"""
FastAPI dependency injection — database sessions and service factories.

To enable JWT auth on admin routes (Milestone 2), replace `optional_auth`
with `require_auth` in the router files.
"""
from typing import List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.repositories.form_repository import FormRepository
from app.repositories.field_repository import FieldRepository
from app.repositories.condition_repository import ConditionRepository
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.user_repository import UserRepository
from app.services.form_service import FormService
from app.services.field_service import FieldService
from app.services.condition_service import ConditionService
from app.services.submission_service import SubmissionService
from app.services.rule_engine import RuleEngine
from app.services.validation_engine import ValidationEngine
from app.services.auth_service import AuthService
from app.models.user import User


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


def get_rule_engine() -> RuleEngine:
    return RuleEngine()


def get_validation_engine() -> ValidationEngine:
    return ValidationEngine()


def get_submission_service(
    form_repo: FormRepository = Depends(get_form_repo),
    field_repo: FieldRepository = Depends(get_field_repo),
    condition_repo: ConditionRepository = Depends(get_condition_repo),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
) -> SubmissionService:
    return SubmissionService(form_repo, field_repo, condition_repo, sub_repo)


def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)


# ── Auth (Milestone 2 = JWT Authentication) ──────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repo),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Access token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        from uuid import UUID
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token format.",
        )
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated.",
        )
    return user


def require_role(allowed_roles: List[str]):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user
    return dependency


def verify_api_key(x_api_key: str = Header(default="")) -> None:
    if settings.ENVIRONMENT == "development":
        return
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )


def optional_auth(authorization: str = Header(default="")) -> None:
    pass

