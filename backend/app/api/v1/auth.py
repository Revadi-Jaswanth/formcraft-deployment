from fastapi import APIRouter, Depends, status, Response, Request, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user, get_user_repo
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
# ==========================================

@router.post(
    "/auth/login",
    response_model=Token,
    tags=["Authentication"],
)
def login(
    response: Response,
    login_req: LoginRequest,
    db: Session = Depends(get_db),
):
    token_resp = AuthService.authenticate_user(
        db,
        login_req,
    )
    
    # Create secure refresh token and set as HttpOnly cookie
    refresh_token = AuthService.create_refresh_token(subject=token_resp.user.id)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )
    
    return token_resp

# ==========================================
# Logout
# ==========================================

@router.post(
    "/auth/logout",
    tags=["Authentication"],
)
def logout(
    response: Response,
):
    response.delete_cookie(key="refresh_token")
    return {"message": "Successfully logged out."}

# ==========================================
# Refresh Token
# ==========================================

@router.post(
    "/auth/refresh",
    response_model=Token,
    tags=["Authentication"],
)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing.",
        )
        
    payload = AuthService.decode_refresh_token(refresh_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )
        
    user_id = payload.get("sub")
    user_repo = get_user_repo(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found.",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Deactivated user account.",
        )
        
    # Rotate refresh token
    new_access_token = AuthService.create_access_token(subject=user.id)
    new_refresh_token = AuthService.create_refresh_token(subject=user.id)
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    
    return Token(
        access_token=new_access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
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
