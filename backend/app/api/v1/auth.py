from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, LoginRequest
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()

# ==========================================
# Register
# ==========================================

@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    return AuthService.register_user(
        db,
        user_in,
    )

# ==========================================
# Login
# OAuth2 compatible for Swagger
# ==========================================

@router.post(
    "/auth/login",
    response_model=Token,
    tags=["Authentication"],
)
def login(
    login_req: LoginRequest,
    db: Session = Depends(get_db),
):
    return AuthService.authenticate_user(
        db,
        login_req,
    )

# ==========================================
# Current User
# ==========================================

@router.get(
    "/auth/me",
    response_model=UserResponse,
    tags=["Authentication"],
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
