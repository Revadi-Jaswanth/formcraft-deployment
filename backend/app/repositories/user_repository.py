from typing import Optional, List, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Optional[Session] = None) -> None:
        super().__init__(User, db)

    def get_by_id(self, user_id: Any, db: Optional[Session] = None) -> Optional[User]:
        if isinstance(self, UserRepository):
            session = self.db
            target_id = user_id
        else:
            session = self  # when called as UserRepository.get_by_id(db, user_id)
            target_id = user_id

        return session.query(User).filter(User.id == target_id).first()

    def get_by_email(self, email: str, db: Optional[Session] = None) -> Optional[User]:
        if isinstance(self, UserRepository):
            session = self.db
            target_email = email
        else:
            session = self  # when called as UserRepository.get_by_email(db, email)
            target_email = email

        return session.query(User).filter(User.email == target_email).first()

    def create(self, user_in: Any, hashed_password: Optional[str] = None, db: Optional[Session] = None) -> User:
        if isinstance(self, UserRepository):
            session = self.db
            data = user_in
            pwd = hashed_password
        else:
            session = self  # when called as UserRepository.create(db, user_in, hashed_password)
            data = user_in
            pwd = hashed_password

        db_user = User(
            name=data.name,
            email=data.email,
            hashed_password=pwd
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

    def update(self, db_user: User, update_data: dict) -> User:
        session = self.db if isinstance(self, UserRepository) else self
        for field, value in update_data.items():
            if hasattr(db_user, field):
                setattr(db_user, field, value)
        session.commit()
        session.refresh(db_user)
        return db_user

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        session = self.db if isinstance(self, UserRepository) else self
        return session.query(User).offset(skip).limit(limit).all()

    def delete(self, user_id_or_obj: Any) -> bool:
        if isinstance(user_id_or_obj, User):
            user_id = user_id_or_obj.id
        else:
            user_id = user_id_or_obj
        return super().delete(user_id)
