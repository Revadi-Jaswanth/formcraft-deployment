from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models import User
from app.schemas.user import UserCreate
from app.schemas.token import LoginRequest, Token
from app.repositories.user_repository import UserRepository

import bcrypt

from app.core.security import create_access_token, decode_access_token, create_refresh_token, decode_refresh_token

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes a plain text password using bcrypt directly."""
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain text password against a hashed password using bcrypt."""
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except Exception:
            return False

    @staticmethod
    def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
        """Generates a signed JWT access token using core security utility."""
        return create_access_token(str(subject), expires_delta)

    @staticmethod
    def decode_access_token(token: str) -> Optional[dict]:
        """Decodes and validates a JWT access token."""
        sub = decode_access_token(token)
        return {"sub": sub} if sub else None

    @staticmethod
    def create_refresh_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
        """Generates a signed JWT refresh token using core security utility."""
        return create_refresh_token(str(subject), expires_delta)

    @staticmethod
    def decode_refresh_token(token: str) -> Optional[dict]:
        """Decodes and validates a JWT refresh token."""
        sub = decode_refresh_token(token)
        return {"sub": sub} if sub else None

    @classmethod
    def register_user(cls, db: Session, user_in: UserCreate) -> User:
        """Registers a new user after verifying email uniqueness and hashing the password with passlib."""
        existing_user = UserRepository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists."
            )
        
        hashed_password = cls.hash_password(user_in.password)
        return UserRepository.create(db, user_in, hashed_password)

    @classmethod
    def authenticate_user(cls, db: Session, login_data: LoginRequest) -> Token:
        """Authenticates user credentials and returns a JWT access token response."""
        email = login_data.email or login_data.username
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username is required."
            )
        
        user = UserRepository.get_by_email(db, email)
        if not user or not cls.verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account."
            )
        
        access_token = cls.create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user
        )
