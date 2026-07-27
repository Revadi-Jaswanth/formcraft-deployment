from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User
from app.schemas.user import UserCreate
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash

class UserService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        existing_user = UserRepository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists."
            )
        
        hashed_password = get_password_hash(user_in.password)
        return UserRepository.create(db, user_in, hashed_password)

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        user = UserRepository.get_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return user

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return UserRepository.get_all(db, skip=skip, limit=limit)
